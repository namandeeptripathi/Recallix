from typing import List, Optional
from pydantic import BaseModel, Field

class TaskItem(BaseModel):
    id: str
    task: str
    completed: bool = False

class LectureBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    subject: str = Field(..., min_length=2, max_length=100)
    raw_notes: str = Field(..., min_length=5)

class LectureCreate(LectureBase):
    pass

class LectureResponse(BaseModel):
    id: str
    title: str
    subject: str
    raw_notes: str
    summary: Optional[str] = None
    key_concepts: List[str] = []
    action_items: List[TaskItem] = []
    status: str
    created_at: str
    updated_at: str

class TaskToggleRequest(BaseModel):
    completed: bool
