from fastapi import APIRouter
from app.api.v1.endpoints import health, lectures

api_router = APIRouter()

api_router.include_router(health.router, prefix="", tags=["Health"])
api_router.include_router(lectures.router, prefix="/lectures", tags=["Lectures"])
# Note: chat endpoint lives at POST /api/v1/lectures/{lecture_id}/chat

