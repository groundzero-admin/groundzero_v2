import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CohortCreate(BaseModel):
    name: str
    grade_band: str = Field(pattern=r"^(4-5|6-7|8-9)$")
    level: int = 1
    schedule: str | None = None
    board: str | None = None


class CohortOut(BaseModel):
    id: uuid.UUID
    name: str
    grade_band: str
    level: int
    schedule: str | None = None
    board: str | None = None
    current_session_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    cohort_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    teacher_id: uuid.UUID | None = None


class SessionOut(BaseModel):
    id: uuid.UUID
    cohort_id: uuid.UUID | None = None
    session_number: int
    current_activity_id: str | None = None
    teacher_id: uuid.UUID | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None

    model_config = {"from_attributes": True}


class SessionActivityOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    activity_id: str
    order: int
    status: str  # pending / active / completed
    launched_at: datetime | None = None
    # Joined from Activity table:
    activity_name: str | None = None
    activity_type: str | None = None
    duration_minutes: int | None = None

    model_config = {"from_attributes": True}


class LaunchActivityRequest(BaseModel):
    activity_id: str


class FacilitatorNoteCreate(BaseModel):
    student_id: uuid.UUID
    engagement: int = Field(ge=1, le=3)
    notable_moment: str | None = None
    intervention_flag: bool = False
    # Optional: competency_id to create evidence event from
    competency_id: str | None = None


class FacilitatorNoteOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    engagement: int
    notable_moment: str | None = None
    intervention_flag: bool
    created_at: datetime

    model_config = {"from_attributes": True}
