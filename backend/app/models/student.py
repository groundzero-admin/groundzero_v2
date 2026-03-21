import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    board: Mapped[str] = mapped_column(String(20), server_default="cbse")  # cbse, icse, ib
    grade: Mapped[int] = mapped_column(Integer)  # 4-9
    grade_band: Mapped[str] = mapped_column(String(5))  # "4-5", "6-7", "8-9"
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, unique=True
    )
    cohort_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # derived from cohort_enrollments at read time
    diagnostic_completed: Mapped[bool] = mapped_column(Boolean, server_default="false")
    diagnostic_profile: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class StudentCompetencyState(Base):
    __tablename__ = "student_competency_states"
    __table_args__ = (UniqueConstraint("student_id", "competency_id"),)

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True)
    competency_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), primary_key=True)

    # BKT parameters (personalized per student)
    p_learned: Mapped[float] = mapped_column(Float, server_default="0.10")
    p_transit: Mapped[float] = mapped_column(Float, server_default="0.15")
    p_guess: Mapped[float] = mapped_column(Float, server_default="0.25")
    p_slip: Mapped[float] = mapped_column(Float, server_default="0.10")

    # Evidence counters
    total_evidence: Mapped[int] = mapped_column(Integer, server_default="0")
    consecutive_failures: Mapped[int] = mapped_column(Integer, server_default="0")
    is_stuck: Mapped[bool] = mapped_column(Boolean, server_default="false")

    # Temporal
    last_evidence_at: Mapped[datetime | None] = mapped_column(nullable=True)
    stability: Mapped[float] = mapped_column(Float, server_default="7.0")  # forgetting half-life in days
    avg_response_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Derived
    stage: Mapped[int] = mapped_column(Integer, server_default="1")  # 1-5
    confidence: Mapped[float] = mapped_column(Float, server_default="0.0")  # 0-1

    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class StudentActivityProgress(Base):
    """Tracks where a student is in an ordered activity (question_ids list).

    current_index = index of the next question to serve (0-based).
    Incremented after each answer. completed_at set when all questions done.
    """
    __tablename__ = "student_activity_progress"
    __table_args__ = (UniqueConstraint("student_id", "activity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"))
    activity_id: Mapped[str] = mapped_column(String(50))
    current_index: Mapped[int] = mapped_column(Integer, server_default="0")
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class SessionCompetencySnapshot(Base):
    """BKT state captured at start and end of each session per (student, competency).

    Written when the first evidence event fires for a (session, student, competency) triple.
    p_learned_before = p_learned snapshot taken before BKT processes that first event.
    p_learned_after / stage_after = updated live after every subsequent event in the session.
    """
    __tablename__ = "session_competency_snapshots"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", "competency_id"),
        Index("ix_scs_session_competency", "session_id", "competency_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"))
    competency_id: Mapped[str] = mapped_column(String(10))

    p_learned_before: Mapped[float] = mapped_column(Float)
    stage_before: Mapped[int] = mapped_column(Integer)
    p_learned_after: Mapped[float] = mapped_column(Float)
    stage_after: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
