import json
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import sqlite3
import logging

from app.core.database import get_db
from app.schemas.lecture import LectureCreate, LectureResponse, TaskToggleRequest, TaskItem
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ollama_client import ollama_client
from app.services.ai_service import process_lecture, answer_question, AIProcessingError

logger = logging.getLogger(__name__)
router = APIRouter()


def row_to_lecture(row: sqlite3.Row) -> LectureResponse:
    concepts: List[str] = []
    actions: List[TaskItem] = []
    if row["key_concepts"]:
        try:
            concepts = json.loads(row["key_concepts"])
        except Exception:
            concepts = []
    if row["action_items"]:
        try:
            actions_raw = json.loads(row["action_items"])
            actions = [TaskItem(**item) for item in actions_raw]
        except Exception:
            actions = []

    return LectureResponse(
        id=row["id"],
        title=row["title"],
        subject=row["subject"],
        raw_notes=row["raw_notes"],
        summary=row["summary"],
        key_concepts=concepts,
        action_items=actions,
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=List[LectureResponse], tags=["Lectures"])
def list_lectures(db: sqlite3.Connection = Depends(get_db)):
    """Retrieve all processed and pending lecture notes."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lectures ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    return [row_to_lecture(row) for row in rows]


@router.get("/{lecture_id}", response_model=LectureResponse, tags=["Lectures"])
def get_lecture(lecture_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Retrieve a specific lecture note by ID."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return row_to_lecture(row)


@router.post("", response_model=LectureResponse, status_code=status.HTTP_201_CREATED, tags=["Lectures"])
def create_lecture(payload: LectureCreate, db: sqlite3.Connection = Depends(get_db)):
    """
    Create a new lecture note.

    Attempts to generate a real AI summary, key concepts, and study tasks via Gemma/Ollama.
    If Ollama is unavailable or returns an error, the lecture is saved with status='ai_failed'
    and explicit placeholder fields — no fake AI content is generated.
    """
    lecture_id = f"lec-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # ── Attempt real AI processing ─────────────────────────────────────
    summary: str | None = None
    key_concepts: List[str] = []
    action_items_data: List[dict] = []
    lecture_status = "processed"

    try:
        ai_result = process_lecture(
            client=ollama_client,
            title=payload.title,
            subject=payload.subject,
            notes=payload.raw_notes,
        )
        summary = ai_result.summary
        key_concepts = ai_result.key_concepts
        # Attach deterministic IDs to each task
        action_items_data = [
            {"id": f"task-{uuid.uuid4().hex[:6]}", "task": task, "completed": False}
            for task in ai_result.action_items
        ]
        logger.info("AI processing succeeded for lecture %s", lecture_id)

    except AIProcessingError as exc:
        # Ollama offline or bad response — store the error, don't fabricate content
        logger.warning("AI processing failed for lecture %s: %s", lecture_id, exc)
        summary = None
        key_concepts = []
        action_items_data = []
        lecture_status = "ai_failed"

    # ── Persist to SQLite ──────────────────────────────────────────────
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO lectures
            (id, title, subject, raw_notes, summary, key_concepts, action_items, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            lecture_id,
            payload.title,
            payload.subject,
            payload.raw_notes,
            summary,
            json.dumps(key_concepts),
            json.dumps(action_items_data),
            lecture_status,
            now,
            now,
        ),
    )
    db.commit()

    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    return row_to_lecture(row)


@router.patch("/{lecture_id}/tasks/{task_id}", response_model=LectureResponse, tags=["Lectures"])
def toggle_task_status(
    lecture_id: str,
    task_id: str,
    req: TaskToggleRequest,
    db: sqlite3.Connection = Depends(get_db),
):
    """Toggle completion status of an actionable study task."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lecture not found")

    action_items: List[dict] = []
    if row["action_items"]:
        try:
            action_items = json.loads(row["action_items"])
        except Exception:
            action_items = []

    task_found = False
    for item in action_items:
        if item.get("id") == task_id:
            item["completed"] = req.completed
            task_found = True
            break

    if not task_found:
        raise HTTPException(status_code=404, detail="Task not found in this lecture")

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "UPDATE lectures SET action_items = ?, updated_at = ? WHERE id = ?;",
        (json.dumps(action_items), now, lecture_id),
    )
    db.commit()

    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    updated_row = cursor.fetchone()
    return row_to_lecture(updated_row)


@router.post("/{lecture_id}/chat", response_model=ChatResponse, tags=["Lectures"])
def chat_with_lecture(
    lecture_id: str,
    req: ChatRequest,
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Ask a contextual question about a specific lecture's notes.

    Retrieves the lecture from SQLite, constructs a grounded prompt, calls Gemma via Ollama,
    and returns the model's answer. If Ollama is unavailable, returns a 503.
    """
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lecture not found")

    try:
        answer = answer_question(
            client=ollama_client,
            title=row["title"],
            subject=row["subject"],
            notes=row["raw_notes"],
            summary=row["summary"],
            question=req.question,
        )
    except AIProcessingError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {exc}",
        ) from exc

    return ChatResponse(
        answer=answer,
        lecture_id=lecture_id,
        lecture_title=row["title"],
        powered_by="gemma-via-ollama",
    )
