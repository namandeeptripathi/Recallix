import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
import sqlite3

from app.schemas.health import HealthResponse
from app.core.config import settings
from app.core.database import get_db

router = APIRouter()
START_TIME = time.time()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health(db: sqlite3.Connection = Depends(get_db)):
    """Health check endpoint returning system status and SQLite connectivity."""
    db_status = "connected"
    try:
        cursor = db.cursor()
        cursor.execute("SELECT 1;")
        cursor.fetchone()
    except Exception as e:
        db_status = f"error: {str(e)}"

    uptime = round(time.time() - START_TIME, 2)

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        service=f"{settings.PROJECT_NAME} Backend API",
        version=settings.VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
        uptime_seconds=uptime
    )
