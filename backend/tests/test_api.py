"""
Tests for the Ollama AI integration layer.

All Ollama HTTP calls are mocked so these tests run without a live model.
"""
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import init_db
from app.services.ollama_client import OllamaClient, OllamaError
from app.services.ai_service import (
    process_lecture,
    answer_question,
    AIProcessingError,
    LectureAIResult,
    _parse_ai_result,
    _strip_json_fences,
)


# ────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def test_db_setup():
    """Ensure the SQLite schema and seed data exist before any test."""
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _mock_client(return_value: str) -> MagicMock:
    """Return a mock OllamaClient whose generate() returns the given string."""
    m = MagicMock(spec=OllamaClient)
    m.generate.return_value = return_value
    return m


def _mock_client_error(exc: Exception) -> MagicMock:
    """Return a mock OllamaClient whose generate() raises the given exception."""
    m = MagicMock(spec=OllamaClient)
    m.generate.side_effect = exc
    return m


# ────────────────────────────────────────────────────────────────
# OllamaClient unit tests (no HTTP calls made)
# ────────────────────────────────────────────────────────────────

class TestOllamaClient:

    def test_successful_generate(self):
        """generate() returns the text from Ollama's JSON response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "  Hello world  "}

        with patch("app.services.ollama_client.httpx.Client") as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            instance.post.return_value = mock_response

            client = OllamaClient()
            result = client.generate("Test prompt")
            assert result == "Hello world"  # stripped

    def test_connect_error_raises_ollama_error(self):
        import httpx as real_httpx
        with patch("app.services.ollama_client.httpx.Client") as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            instance.post.side_effect = real_httpx.ConnectError("refused")

            client = OllamaClient()
            with pytest.raises(OllamaError, match="Cannot connect"):
                client.generate("prompt")

    def test_timeout_raises_ollama_error(self):
        import httpx as real_httpx
        with patch("app.services.ollama_client.httpx.Client") as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            instance.post.side_effect = real_httpx.TimeoutException("timeout")

            client = OllamaClient()
            with pytest.raises(OllamaError, match="timed out"):
                client.generate("prompt")

    def test_non_200_raises_ollama_error(self):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "model not found"

        with patch("app.services.ollama_client.httpx.Client") as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            instance.post.return_value = mock_response

            client = OllamaClient()
            with pytest.raises(OllamaError, match="HTTP 404"):
                client.generate("prompt")

    def test_missing_response_key_raises_ollama_error(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"done": True}  # no 'response' key

        with patch("app.services.ollama_client.httpx.Client") as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            instance.post.return_value = mock_response

            client = OllamaClient()
            with pytest.raises(OllamaError, match="Malformed response"):
                client.generate("prompt")


# ────────────────────────────────────────────────────────────────
# ai_service unit tests
# ────────────────────────────────────────────────────────────────

class TestAIService:

    VALID_JSON = json.dumps({
        "summary": "Transformers use self-attention instead of recurrence.",
        "key_concepts": ["Self-Attention", "Scaled Dot-Product", "Multi-Head Attention"],
        "action_items": ["Review Vaswani et al.", "Implement a single attention head"],
    })

    def test_process_lecture_success(self):
        client = _mock_client(self.VALID_JSON)
        result = process_lecture(client, "Transformers", "NLP", "Raw notes here.")
        assert isinstance(result, LectureAIResult)
        assert "self-attention" in result.summary.lower()
        assert len(result.key_concepts) == 3
        assert len(result.action_items) == 2

    def test_process_lecture_strips_json_fences(self):
        fenced = f"```json\n{self.VALID_JSON}\n```"
        client = _mock_client(fenced)
        result = process_lecture(client, "T", "S", "notes")
        assert result.summary  # parsed successfully

    def test_process_lecture_ollama_unavailable(self):
        client = _mock_client_error(OllamaError("Cannot connect"))
        with pytest.raises(AIProcessingError, match="Cannot connect"):
            process_lecture(client, "T", "S", "notes")

    def test_process_lecture_non_json_response(self):
        client = _mock_client("Sure! Here is a summary of your lecture...")
        with pytest.raises(AIProcessingError, match="non-JSON"):
            process_lecture(client, "T", "S", "notes")

    def test_process_lecture_missing_fields(self):
        incomplete = json.dumps({"summary": "Only a summary, nothing else."})
        client = _mock_client(incomplete)
        with pytest.raises(AIProcessingError, match="missing required fields"):
            process_lecture(client, "T", "S", "notes")

    def test_answer_question_success(self):
        client = _mock_client("The scaling factor is 1/√d_k to prevent vanishing gradients.")
        answer = answer_question(client, "Transformers", "NLP", "raw notes", "summary", "What is scaling?")
        assert "1/√d_k" in answer

    def test_answer_question_ollama_unavailable(self):
        client = _mock_client_error(OllamaError("Cannot connect to Ollama"))
        with pytest.raises(AIProcessingError, match="Cannot connect"):
            answer_question(client, "T", "S", "notes", None, "question?")

    def test_parse_ai_result_valid(self):
        result = _parse_ai_result(self.VALID_JSON)
        assert result.summary
        assert len(result.key_concepts) > 0
        assert len(result.action_items) > 0

    def test_strip_json_fences(self):
        assert _strip_json_fences("```json\n{}\n```") == "{}"
        assert _strip_json_fences("```\n{}\n```") == "{}"
        assert _strip_json_fences("{}") == "{}"


# ────────────────────────────────────────────────────────────────
# Lecture API integration tests (AI mocked at the service layer)
# ────────────────────────────────────────────────────────────────

VALID_AI_JSON = json.dumps({
    "summary": "This covers quantum superposition and entanglement.",
    "key_concepts": ["Superposition", "Entanglement", "Qubit"],
    "action_items": ["Derive Bloch sphere representation", "Solve EPR paradox problems"],
})

LECTURE_PAYLOAD = {
    "title": "Quantum Entanglement",
    "subject": "Quantum Physics",
    "raw_notes": "Qubits in superposition. Hadamard gates. EPR pairs. Bell inequality violation.",
}


class TestLectureCreationWithAI:

    def test_create_lecture_with_ai_success(self, client):
        """When Ollama works, lecture is saved with real summary and status=processed."""
        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.return_value = VALID_AI_JSON
            resp = client.post("/api/v1/lectures", json=LECTURE_PAYLOAD)

        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "processed"
        assert data["summary"] == "This covers quantum superposition and entanglement."
        assert "Superposition" in data["key_concepts"]
        assert len(data["action_items"]) == 2
        assert data["action_items"][0]["completed"] is False

    def test_create_lecture_ollama_offline(self, client):
        """When Ollama is offline, lecture is saved with status=ai_failed, no fake content."""
        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.side_effect = OllamaError("Cannot connect to Ollama")
            resp = client.post("/api/v1/lectures", json=LECTURE_PAYLOAD)

        assert resp.status_code == 201  # still saved — just degraded
        data = resp.json()
        assert data["status"] == "ai_failed"
        assert data["summary"] is None
        assert data["key_concepts"] == []
        assert data["action_items"] == []

    def test_create_lecture_invalid_ai_json(self, client):
        """When model returns garbage, lecture is saved with status=ai_failed."""
        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.return_value = "Oops I forgot to return JSON!"
            resp = client.post("/api/v1/lectures", json=LECTURE_PAYLOAD)

        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "ai_failed"

    def test_create_lecture_validation_error(self, client):
        """Invalid input still returns 422 before AI is called."""
        resp = client.post("/api/v1/lectures", json={"title": "", "subject": "X", "raw_notes": "hi"})
        assert resp.status_code == 422


# ────────────────────────────────────────────────────────────────
# Chat / Q&A endpoint tests
# ────────────────────────────────────────────────────────────────

class TestChatEndpoint:

    def _create_test_lecture(self, client, ai_return: str) -> str:
        """Helper: create a lecture and return its ID."""
        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.return_value = ai_return
            resp = client.post("/api/v1/lectures", json=LECTURE_PAYLOAD)
        assert resp.status_code == 201
        return resp.json()["id"]

    def test_chat_success(self, client):
        """Successful Q&A returns an answer grounded by Gemma."""
        lec_id = self._create_test_lecture(client, VALID_AI_JSON)

        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.return_value = "Entanglement means qubits are correlated regardless of distance."
            resp = client.post(
                f"/api/v1/lectures/{lec_id}/chat",
                json={"question": "What is entanglement?"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "Entanglement" in data["answer"]
        assert data["lecture_id"] == lec_id
        assert data["powered_by"] == "gemma-via-ollama"

    def test_chat_ollama_offline_returns_503(self, client):
        """When Ollama is offline during Q&A, endpoint returns 503."""
        lec_id = self._create_test_lecture(client, VALID_AI_JSON)

        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            mock_ollama.generate.side_effect = OllamaError("Cannot connect to Ollama")
            resp = client.post(
                f"/api/v1/lectures/{lec_id}/chat",
                json={"question": "What is superposition?"},
            )

        assert resp.status_code == 503
        assert "AI service unavailable" in resp.json()["detail"]

    def test_chat_lecture_not_found(self, client):
        resp = client.post(
            "/api/v1/lectures/does-not-exist/chat",
            json={"question": "Does this exist?"},
        )
        assert resp.status_code == 404

    def test_chat_insufficient_context(self, client):
        """Model should say 'notes do not contain' when question is out of scope."""
        lec_id = self._create_test_lecture(client, VALID_AI_JSON)

        with patch("app.api.v1.endpoints.lectures.ollama_client") as mock_ollama:
            # Simulate the model following instructions and saying it can't answer
            mock_ollama.generate.return_value = (
                "The provided notes do not contain enough information to answer this question."
            )
            resp = client.post(
                f"/api/v1/lectures/{lec_id}/chat",
                json={"question": "What is the GDP of France?"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "do not contain" in data["answer"].lower()

    def test_chat_question_too_short(self, client):
        """Questions shorter than 2 characters fail validation."""
        resp = client.post(
            "/api/v1/lectures/lec-101/chat",
            json={"question": "?"},
        )
        assert resp.status_code == 422


# ────────────────────────────────────────────────────────────────
# Existing endpoint regression tests (ensure nothing broke)
# ────────────────────────────────────────────────────────────────

class TestExistingEndpoints:

    def test_health_check(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"

    def test_list_lectures(self, client):
        resp = client.get("/api/v1/lectures")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_get_lecture_not_found(self, client):
        resp = client.get("/api/v1/lectures/non-existent-999")
        assert resp.status_code == 404

    def test_toggle_task(self, client):
        # Use a seeded lecture
        lec_resp = client.get("/api/v1/lectures")
        lec = lec_resp.json()[0]
        lec_id = lec["id"]
        task_id = lec["action_items"][0]["id"]

        patch_resp = client.patch(
            f"/api/v1/lectures/{lec_id}/tasks/{task_id}",
            json={"completed": True},
        )
        assert patch_resp.status_code == 200
        updated = patch_resp.json()
        task = next(t for t in updated["action_items"] if t["id"] == task_id)
        assert task["completed"] is True
