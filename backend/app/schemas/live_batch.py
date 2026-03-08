"""Pydantic schemas for live batches and live batch sessions."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Live Batch ──

class LiveBatchCreate(BaseModel):
    name: str = Field(max_length=200)
    description: str | None = None
    start_date: date
    daily_timing: str = Field(max_length=20)  # e.g. "10:00-12:00"


class LiveBatchUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    start_date: date | None = None
    daily_timing: str | None = Field(default=None, max_length=20)


class LiveBatchOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    start_date: date
    daily_timing: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Live Batch Session ──

class LiveBatchSessionOut(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    template_session_id: uuid.UUID | None
    title: str
    description: str | None
    day: int
    order: int
    is_locally_modified: bool
    scheduled_date: date | None = None  # computed: batch.start_date + timedelta(days=day - 1)
    daily_timing: str | None = None  # copied from parent batch for convenience
    hms_room_id: str | None = None
    hms_room_code_host: str | None = None
    hms_room_code_guest: str | None = None
    is_live: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LiveBatchSessionUpdate(BaseModel):
    """Local override for a live batch session."""
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    day: int | None = Field(default=None, ge=1)
    order: int | None = Field(default=None, ge=0)
    daily_timing: str | None = Field(default=None, max_length=20)  # per-session time override


class LiveBatchWithSessions(LiveBatchOut):
    """Live batch with all its sessions, used for detail view."""
    sessions: list[LiveBatchSessionOut] = []
