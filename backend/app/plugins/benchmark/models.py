import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class BenchmarkSession(Base):
    __tablename__ = "bm_sessions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    character = Column(String(50), nullable=False)
    voice_provider = Column(String(20), nullable=False, default="sarvam")
    status = Column(String(20), default="active")
    started_at = Column(DateTime(timezone=True), default=_utcnow)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    total_turns = Column(Integer, default=0)

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
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    session = relationship("BenchmarkSession", back_populates="turns")

    __table_args__ = (
        Index("ix_bm_turns_session_turn", "session_id", "turn_number"),
    )


class BenchmarkResult(Base):
    __tablename__ = "bm_results"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(PGUUID(as_uuid=True), ForeignKey("bm_sessions.id"), unique=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), default=_utcnow)

    score_curiosity = Column(Integer)
    score_critical_thinking = Column(Integer)
    score_mathematical_thinking = Column(Integer)
    score_knowledge_depth = Column(Integer)
    score_communication = Column(Integer)
    score_creativity = Column(Integer)
    score_emotional_intelligence = Column(Integer)
    score_leadership = Column(Integer)

    strongest_areas = Column(JSONB)
    growth_areas = Column(JSONB)
    dominant_interests = Column(JSONB)
    learning_style = Column(String(50))
    engagement_level = Column(String(20))
    notable_observations = Column(JSONB)
    curriculum_signals = Column(JSONB)
    summary = Column(Text)
    conversation_snapshot = Column(JSONB)

    session = relationship("BenchmarkSession", back_populates="result")
