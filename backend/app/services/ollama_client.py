import json
import httpx
from typing import Optional
from app.core.config import settings


class OllamaError(Exception):
    """Raised when Ollama is unreachable or returns an unexpected response."""
    pass


class OllamaClient:
    """
    Thin client for Ollama's local HTTP API.
    Calls /api/generate with the configured model name and a text prompt.
    All timeout and connectivity errors are caught and re-raised as OllamaError
    so callers can degrade gracefully without crashing the API.
    """

    def __init__(self) -> None:
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        # Timeout configurable via OLLAMA_TIMEOUT_SECONDS env var (default 120s)
        self.timeout = httpx.Timeout(
            connect=5.0,
            read=float(settings.OLLAMA_TIMEOUT_SECONDS),
            write=30.0,
            pool=5.0,
        )

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        """
        Send a prompt to Ollama and return the full text response.

        Raises:
            OllamaError: on connection failure, timeout, or non-200 response.
        """
        payload: dict = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,   # Low temperature for factual, grounded answers
                "num_predict": 1024,  # Token budget per response
            },
        }
        if system:
            payload["system"] = system

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
        except httpx.ConnectError:
            raise OllamaError(
                f"Cannot connect to Ollama at {self.base_url}. "
                "Ensure Ollama is running: `ollama serve`"
            )
        except httpx.TimeoutException:
            raise OllamaError(
                f"Ollama request timed out after {self.timeout.read}s. "
                "The model may need more time — try a smaller model or shorter notes."
            )
        except Exception as exc:
            raise OllamaError(f"Unexpected error calling Ollama: {exc}") from exc

        if response.status_code != 200:
            raise OllamaError(
                f"Ollama returned HTTP {response.status_code}: {response.text[:300]}"
            )

        try:
            data = response.json()
            return data["response"].strip()
        except (KeyError, ValueError) as exc:
            raise OllamaError(
                f"Malformed response from Ollama — could not parse JSON: {exc}"
            ) from exc


# Module-level singleton reused across requests
ollama_client = OllamaClient()
