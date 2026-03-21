import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class EvidenceCreate(BaseModel):
    student_id: uuid.UUID
    competency_id: str
    outcome: float = Field(ge=0.0, le=1.0, default=0.0)
    source: str = "mcq"  # mcq, llm_transcript, llm_spark, facilitator, artifact, diagnostic
    module_id: str | None = None
    session_id: uuid.UUID | None = None
    weight: float | None = None  # if None, derived from source

    # Optional metadata (stored in meta JSONB)
    question_id: uuid.UUID | None = None
    response_time_ms: int | None = None
    confidence_report: Literal["got_it", "kinda", "lost"] | None = None
    ai_interaction: Literal["none", "hint", "conversation"] = "none"

    # Rich activity question evaluation (if set, backend derives outcome + source)
    activity_question_id: uuid.UUID | None = None
    response: dict | None = None


class EvidenceOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    competency_id: str
    source: str
    module_id: str | None = None
    session_id: uuid.UUID | None = None
    outcome: float
    weight: float
    # JSONB — must not assume object shape (legacy or hand-edited rows can be arrays)
    meta: Any | None = None
    is_propagated: bool
    source_event_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BKTUpdateOut(BaseModel):
    competency_id: str
    p_learned_before: float
    p_learned_after: float
    stage_before: int
    stage_after: int
    is_stuck: bool
    fire_refreshed: list[str] = []  # prerequisite IDs whose decay clocks were reset


class EvidenceResultOut(BaseModel):
    event: EvidenceOut
    updates: list[BKTUpdateOut]
    feedback: str | None = None
