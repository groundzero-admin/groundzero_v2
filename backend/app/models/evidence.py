import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EvidenceEvent(Base):
    __tablename__ = "evidence_events"
    __table_args__ = (Index("ix_evidence_student_competency_time", "student_id", "competency_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), index=True)
    competency_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), index=True)

    source: Mapped[str] = mapped_column(String(30))  # mcq, llm_transcript, llm_spark, facilitator, artifact, diagnostic
    module_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # level_1, math_v1, spark
    session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # NOT a FK — loose coupling

    outcome: Mapped[float] = mapped_column(Float)  # 0.0-1.0
    weight: Mapped[float] = mapped_column(Float)  # source reliability weight

    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # meta may contain: responseTimeMs, confidence, attempts, aiInteraction, evidenceText

    misconception: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=None)

    is_propagated: Mapped[bool] = mapped_column(Boolean, server_default="false")
    source_event_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
