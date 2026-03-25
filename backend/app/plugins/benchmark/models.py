import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class BenchmarkQuestion(Base):
    __tablename__ = "bm_questions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grade_band = Column(String(10), nullable=False)
    question_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    curriculum_anchor = Column(String(300), nullable=True)
    pillars = Column(JSONB, nullable=False, default=list)
    strong_signals = Column(JSONB, nullable=False, default=list)
    watchout_signals = Column(JSONB, nullable=False, default=list)
    image_url = Column(Text, nullable=True)
    visual_data = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    __table_args__ = (
        UniqueConstraint("grade_band", "question_number", name="uq_bm_questions_grade_number"),
        Index("ix_bm_questions_grade_band", "grade_band"),
    )


class BenchmarkSession(Base):
    __tablename__ = "bm_sessions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    character = Column(String(50), nullable=False)
    voice_provider = Column(String(20), nullable=False, default="text")
    status = Column(String(20), default="active")
    started_at = Column(DateTime(timezone=True), default=_utcnow)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    total_turns = Column(Integer, default=0)
    conversation = Column(JSONB, nullable=True, default=list)

    student = relationship("Student", lazy="selectin")
    turns = relationship(
        "BenchmarkTurn",
        back_populates="session",
        lazy="selectin",
        order_by="BenchmarkTurn.turn_number",
    )
    result = relationship(
        "BenchmarkResult",
        back_populates="session",
        uselist=False,
        lazy="selectin",
    )


class BenchmarkTurn(Base):
    __tablename__ = "bm_turns"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("bm_sessions.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)
    speaker = Column(String(10), nullable=False)
    text = Column(Text, nullable=False)
    question_id = Column(PGUUID(as_uuid=True), ForeignKey("bm_questions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    session = relationship("BenchmarkSession", back_populates="turns")
    question = relationship("BenchmarkQuestion", lazy="selectin")

    __table_args__ = (
        Index("ix_bm_turns_session_turn", "session_id", "turn_number"),
    )


class BenchmarkResult(Base):
    __tablename__ = "bm_results"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("bm_sessions.id"), unique=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), default=_utcnow)

    pillar_stages = Column(JSONB)
    capability_stages = Column(JSONB)
    capability_evidence = Column(JSONB)

    strongest_areas = Column(JSONB)
    growth_areas = Column(JSONB)
    dominant_interests = Column(JSONB)
    learning_style = Column(String(50))
    engagement_level = Column(String(20))
    notable_observations = Column(JSONB)
    summary = Column(Text)
    conversation_snapshot = Column(JSONB)

    bkt_seeded = Column(String(10), default="pending")

    session = relationship("BenchmarkSession", back_populates="result", lazy="selectin")
