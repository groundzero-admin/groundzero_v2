"""Pydantic schemas for template cohorts and template sessions."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Template Cohort ──

class TemplateCohortCreate(BaseModel):
    name: str = Field(max_length=200)
    level: int = Field(default=1, ge=1)
    mode: str = Field(default="online", pattern=r"^(online|offline)$")
    description: str | None = None


class TemplateCohortUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    level: int | None = Field(default=None, ge=1)
    mode: str | None = Field(default=None, pattern=r"^(online|offline)$")
    description: str | None = None


class TemplateCohortOut(BaseModel):
    id: uuid.UUID
    name: str
    level: int
    mode: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Template Session ──

class TemplateSessionCreate(BaseModel):
    title: str = Field(max_length=300)
    description: str | None = None
    day: int = Field(ge=1)
    order: int = Field(ge=0)


class TemplateSessionUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    day: int | None = Field(default=None, ge=1)
    order: int | None = Field(default=None, ge=0)


class TemplateSessionOut(BaseModel):
    id: uuid.UUID
    template_cohort_id: uuid.UUID
    title: str
    description: str | None
    day: int
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateCohortWithSessions(TemplateCohortOut):
    """Template cohort with all its sessions, used for detail view."""
    sessions: list[TemplateSessionOut] = []


class ReorderItem(BaseModel):
    """Used for bulk-reorder: session id + new order."""
    id: uuid.UUID
    order: int
