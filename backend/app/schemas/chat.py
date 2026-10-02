from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)


class ChatResponse(BaseModel):
    answer: str
    lecture_id: str
    lecture_title: str
    powered_by: str = "gemma-via-ollama"
