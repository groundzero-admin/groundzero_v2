import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityQuestion(Base):
    __tablename__ = "activity_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("question_templates.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    grade_band: Mapped[str] = mapped_column(String(10), default="")
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    competency_id: Mapped[str] = mapped_column(
        String(10), ForeignKey("competencies.id", ondelete="RESTRICT"), index=True
    )
    competency_ids: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        server_default="{}",
        nullable=False,
    )
    difficulty: Mapped[float] = mapped_column(Float, default=0.5, server_default="0.5")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
