"""Template cohort and template session models.

Templates are reusable blueprints. An admin creates a template cohort with
sessions, then imports it into one or more live batches.
"""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TemplateCohort(Base):
    __tablename__ = "template_cohorts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    level: Mapped[int] = mapped_column(Integer, server_default="1")
    mode: Mapped[str] = mapped_column(String(20), server_default="online")  # online | offline
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["TemplateSession"]] = relationship(
        back_populates="template_cohort",
        cascade="all, delete-orphan",
        order_by="TemplateSession.order",
    )


class TemplateSession(Base):
    __tablename__ = "template_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_cohort_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("template_cohorts.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    day: Mapped[int] = mapped_column(Integer)  # day offset from batch start (1, 3, 7 …)
    order: Mapped[int] = mapped_column(Integer)  # display order within template
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    template_cohort: Mapped["TemplateCohort"] = relationship(back_populates="sessions")
