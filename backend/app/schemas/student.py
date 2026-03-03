import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    name: str
    board: str = Field(default="cbse", pattern=r"^(cbse|icse|ib)$")
    grade: int = Field(ge=4, le=9)
    grade_band: str = Field(pattern=r"^(4-5|6-7|8-9)$")
    cohort_id: uuid.UUID | None = None


class StudentOut(BaseModel):
    id: uuid.UUID
    name: str
    board: str
    grade: int
    grade_band: str
    cohort_id: uuid.UUID | None = None
    diagnostic_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CompetencyStateOut(BaseModel):
    competency_id: str
    p_learned: float
    p_transit: float
    p_guess: float
    p_slip: float
    total_evidence: int
    consecutive_failures: int
    is_stuck: bool
    last_evidence_at: datetime | None = None
    stability: float
    avg_response_time_ms: float | None = None
    stage: int
    confidence: float
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class StudentStateOut(BaseModel):
    student: StudentOut
    states: list[CompetencyStateOut]
