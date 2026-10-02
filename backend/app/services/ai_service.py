import json
import re
from typing import List, Optional
from pydantic import BaseModel, ValidationError

from app.services.ollama_client import OllamaClient, OllamaError


class ConceptItem(BaseModel):
    concept: str
    explanation: str


class LectureAIResult(BaseModel):
    summary: str
    key_concepts: List[str]
    action_items: List[str]


class AIProcessingError(Exception):
    """Raised when AI processing fails (Ollama offline, parse error, etc.)"""
    pass


# ── Prompts ────────────────────────────────────────────────────────────────

_PROCESS_SYSTEM = """\
You are a rigorous academic study assistant. Your output must always be valid JSON and nothing else.
Do not include markdown fences, commentary, or any text outside the JSON object.
"""

_PROCESS_TEMPLATE = """\
A student uploaded lecture notes. Your job is to analyse these notes and produce a structured JSON object.

Lecture title: {title}
Subject: {subject}

Raw notes:
\"\"\"
{notes}
\"\"\"

Produce a JSON object with exactly these three keys:
- "summary": A concise 2–4 sentence summary of the core ideas covered.
- "key_concepts": A JSON array of 3–5 short strings, each naming a key concept from the notes (no explanations, just names).
- "action_items": A JSON array of 2–4 short, actionable study task strings (e.g. "Review the derivation of X", "Solve practice problem set Y").

Return only the JSON object. Example structure:
{{
  "summary": "...",
  "key_concepts": ["Concept A", "Concept B", "Concept C"],
  "action_items": ["Review ...", "Implement ...", "Solve ..."]
}}
"""

_QA_SYSTEM = """\
You are a study assistant helping a student understand their own lecture notes.
You only answer questions based on the notes provided. If the answer is not present in the notes, say exactly:
"The provided notes do not contain enough information to answer this question."
Do not fabricate information or invent details not present in the notes.
"""

_QA_TEMPLATE = """\
Here are the student's lecture notes for "{title}" ({subject}):

\"\"\"
{notes}
\"\"\"

Summary of this lecture:
{summary}

Student's question: {question}

Answer the question based strictly on the notes above. Be concise and direct.
"""


# ── Helpers ────────────────────────────────────────────────────────────────

def _strip_json_fences(raw: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences if the model adds them."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _parse_ai_result(raw_response: str) -> LectureAIResult:
    """
    Parse and validate the model's JSON output.
    Raises AIProcessingError with a descriptive message on failure.
    """
    cleaned = _strip_json_fences(raw_response)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIProcessingError(
            f"Model returned non-JSON output. Parse error: {exc}. "
            f"Raw (first 300 chars): {cleaned[:300]}"
        ) from exc

    try:
        result = LectureAIResult(**data)
    except (ValidationError, TypeError) as exc:
        raise AIProcessingError(
            f"Model JSON is missing required fields: {exc}. "
            f"Got keys: {list(data.keys()) if isinstance(data, dict) else type(data)}"
        ) from exc

    return result


# ── Public API ─────────────────────────────────────────────────────────────

def process_lecture(
    client: OllamaClient,
    title: str,
    subject: str,
    notes: str,
) -> LectureAIResult:
    """
    Send lecture notes to Gemma and return structured AI output.

    Raises:
        AIProcessingError: if Ollama is unavailable or returns unparseable output.
    """
    prompt = _PROCESS_TEMPLATE.format(
        title=title,
        subject=subject,
        notes=notes[:6000],  # Limit context to avoid token overflow
    )
    try:
        raw = client.generate(prompt=prompt, system=_PROCESS_SYSTEM)
    except OllamaError as exc:
        raise AIProcessingError(str(exc)) from exc

    return _parse_ai_result(raw)


def answer_question(
    client: OllamaClient,
    title: str,
    subject: str,
    notes: str,
    summary: Optional[str],
    question: str,
) -> str:
    """
    Ask a contextual question about a lecture's notes using Gemma.

    Returns the model's answer as a plain string.
    Raises:
        AIProcessingError: if Ollama is unavailable.
    """
    prompt = _QA_TEMPLATE.format(
        title=title,
        subject=subject,
        notes=notes[:5000],
        summary=summary or "No summary available.",
        question=question,
    )
    try:
        return client.generate(prompt=prompt, system=_QA_SYSTEM)
    except OllamaError as exc:
        raise AIProcessingError(str(exc)) from exc
