"""SPARK API request/response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Requests ──


class SparkConversationCreate(BaseModel):
    student_id: UUID
    question_id: UUID | None = None
    trigger: str = Field(pattern=r"^(wrong_answer|low_confidence|hint_request|free_chat)$")
    competency_id: str | None = None
    selected_option: str | None = None
    confidence_report: str | None = None
    student_response: dict | None = None  # raw student answer for contextual hints


class SparkTurnRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class SparkHintRequest(BaseModel):
    student_id: UUID
    question_id: UUID
    student_response: dict | None = None


# ── Responses ──


class SparkMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SparkConversationOut(BaseModel):
    id: UUID
    student_id: UUID
    trigger: str
    status: str
    competency_id: str | None
    evidence_submitted: bool
    created_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class SparkStartResponse(BaseModel):
    conversation_id: UUID
    message: SparkMessageOut


class SparkTurnResponse(BaseModel):
    message: SparkMessageOut
    evidence_submitted: bool
    is_complete: bool


class SparkEndResponse(BaseModel):
    message: SparkMessageOut
    evidence_submitted: bool


class SparkHintResponse(BaseModel):
    hint: str


class SparkConversationDetailOut(BaseModel):
    conversation: SparkConversationOut
    messages: list[SparkMessageOut]
