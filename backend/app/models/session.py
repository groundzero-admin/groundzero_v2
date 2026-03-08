"""
Delivery layer models — optional, nothing in the core engine depends on these.
Sessions, cohorts, and facilitator notes can change shape without affecting
the BKT engine, evidence pipeline, or student state logic.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Cohort(Base):
    __tablename__ = "cohorts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    grade_band: Mapped[str] = mapped_column(String(5))  # "4-5", "6-7", "8-9"
    level: Mapped[int] = mapped_column(Integer, server_default="1")  # curriculum level 1, 2, 3
    schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "Sat/Sun", "Mon/Wed/Fri"
    board: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "CBSE", "ICSE"
    current_session_number: Mapped[int] = mapped_column(Integer, server_default="1")  # 1–14
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=True)
    session_number: Mapped[int] = mapped_column(Integer, server_default="1")  # copied from cohort at creation
    current_activity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # what's LIVE right now
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    started_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)


class SessionActivity(Base):
    """Lesson plan for a session — one row per activity assigned to the session."""
    __tablename__ = "session_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    activity_id: Mapped[str] = mapped_column(String(100))  # loose coupling, not a strict FK
    order: Mapped[int] = mapped_column(Integer)  # 1, 2, 3, 4
    status: Mapped[str] = mapped_column(String(20), server_default="pending")  # pending / active / completed
    launched_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class FacilitatorNote(Base):
    __tablename__ = "facilitator_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"))
    engagement: Mapped[int] = mapped_column(Integer)  # 1=motions, 2=partial, 3=fully engaged
    notable_moment: Mapped[str | None] = mapped_column(Text, nullable=True)
    intervention_flag: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
