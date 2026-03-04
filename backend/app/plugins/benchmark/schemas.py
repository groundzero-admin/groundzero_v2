from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BenchmarkSessionCreate(BaseModel):
    character: str
    voice_provider: str = "sarvam"


class BenchmarkSessionOut(BaseModel):
    id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    student_grade: Optional[int] = None
    character: str
    voice_provider: str
    status: str
    started_at: datetime
    total_turns: int

    model_config = {"from_attributes": True}


class BenchmarkTurnRequest(BaseModel):
    session_id: UUID
    student_text: str
    turn_number: int


class BenchmarkTurnResponse(BaseModel):
    ai_text: str
    audio_base64: str
    turn_number: int
    session_id: UUID


class BenchmarkEndRequest(BaseModel):
    session_id: UUID


class PillarStages(BaseModel):
    communication: int = 1
    creativity: int = 1
    ai_systems: int = 1
    math_logic: int = 1


class BenchmarkInsights(BaseModel):
    strongest_areas: list[str] = []
    growth_areas: list[str] = []
    dominant_interests: list[str] = []
    learning_style: Optional[str] = None
    engagement_level: Optional[str] = None
    notable_observations: list[str] = []


class BenchmarkResultOut(BaseModel):
    id: UUID
    session_id: UUID
    generated_at: datetime
    pillar_stages: PillarStages
    capability_stages: dict[str, Optional[int]] = {}
    capability_evidence: dict[str, str] = {}
    insights: BenchmarkInsights
    scores: dict[str, int] = {}
    summary: Optional[str] = None
    conversation_snapshot: Optional[list[dict[str, Any]]] = None
    student_name: Optional[str] = None
    student_grade: Optional[int] = None
    character: Optional[str] = None
    total_turns: Optional[int] = None
    session_started_at: Optional[datetime] = None
    bkt_seeded: Optional[str] = None

    model_config = {"from_attributes": True}
