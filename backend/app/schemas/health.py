from datetime import datetime
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(..., json_schema_extra={"example": "Recallix Backend"})
    version: str = Field(..., json_schema_extra={"example": "0.1.0"})
    database: str = Field(..., json_schema_extra={"example": "connected"})
    timestamp: datetime
    uptime_seconds: float
