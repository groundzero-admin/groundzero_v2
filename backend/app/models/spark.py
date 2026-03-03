"""SPARK conversation and message models."""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SparkConversation(Base):
    __tablename__ = "spark_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), index=True)
    question_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # MCQ that triggered this
    trigger: Mapped[str] = mapped_column(String(20))  # wrong_answer, low_confidence, hint_request, free_chat
    status: Mapped[str] = mapped_column(String(20), server_default="active")  # active, completed, dismissed
    competency_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # primary competency context
    evidence_submitted: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)


class SparkMessage(Base):
    __tablename__ = "spark_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("spark_conversations.id"), index=True
    )
    role: Mapped[str] = mapped_column(String(10))  # student, spark, system
    content: Mapped[str] = mapped_column(Text)
    tool_calls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
