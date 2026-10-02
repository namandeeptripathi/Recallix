import json
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import sqlite3

from app.core.database import get_db
from app.schemas.lecture import LectureCreate, LectureResponse, TaskToggleRequest, TaskItem

router = APIRouter()

def row_to_lecture(row: sqlite3.Row) -> LectureResponse:
    concepts = []
    actions = []
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
        updated_at=row["updated_at"]
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
    """Create a new lecture note and prepare placeholder summary, concepts, and actionable tasks."""
    lecture_id = f"lec-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate starter structured summary & actionable tasks from notes
    lines = [line.strip() for line in payload.raw_notes.split("\n") if line.strip()]
    first_few = " ".join(lines[:3]) if lines else payload.raw_notes
    summary = f"Summary overview for {payload.title}: {first_few[:300]}..."
    
    sample_concepts = [
        f"Core Principle: {payload.subject} Foundations",
        "Key Analytical Methodology",
        "Practical Application & Edge Cases"
    ]
    
    sample_tasks = [
        {"id": f"task-{uuid.uuid4().hex[:6]}", "task": f"Review key formulas and notes for {payload.title}", "completed": False},
        {"id": f"task-{uuid.uuid4().hex[:6]}", "task": "Synthesize study flashcards for upcoming exam", "completed": False}
    ]

    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO lectures (id, title, subject, raw_notes, summary, key_concepts, action_items, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        lecture_id,
        payload.title,
        payload.subject,
        payload.raw_notes,
        summary,
        json.dumps(sample_concepts),
        json.dumps(sample_tasks),
        "processed",
        now,
        now
    ))
    db.commit()

    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    return row_to_lecture(row)

@router.patch("/{lecture_id}/tasks/{task_id}", response_model=LectureResponse, tags=["Lectures"])
def toggle_task_status(lecture_id: str, task_id: str, req: TaskToggleRequest, db: sqlite3.Connection = Depends(get_db)):
    """Toggle completion status of an actionable study task."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lecture not found")

    action_items = []
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
    cursor.execute("""
        UPDATE lectures
        SET action_items = ?, updated_at = ?
        WHERE id = ?;
    """, (json.dumps(action_items), now, lecture_id))
    db.commit()

    cursor.execute("SELECT * FROM lectures WHERE id = ?;", (lecture_id,))
    updated_row = cursor.fetchone()
    return row_to_lecture(updated_row)
