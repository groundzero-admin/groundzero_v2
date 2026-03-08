"""Live batch and live batch session models.

A live batch is an actual running cohort with a start date and timing.
Sessions can be imported from a template cohort (parent–child link) or
created independently. The `is_locally_modified` flag controls whether
a linked session inherits updates from the parent template session.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LiveBatch(Base):
    __tablename__ = "live_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date)
    daily_timing: Mapped[str] = mapped_column(String(20))  # e.g. "10:00-12:00"
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["LiveBatchSession"]] = relationship(
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="LiveBatchSession.order",
    )


class LiveBatchSession(Base):
    __tablename__ = "live_batch_sessions"
    __table_args__ = (
        UniqueConstraint("batch_id", "template_session_id", name="uq_batch_template_session"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("live_batches.id", ondelete="CASCADE")
    )
    template_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("template_sessions.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    day: Mapped[int] = mapped_column(Integer)  # day offset
    order: Mapped[int] = mapped_column(Integer)  # display order
    daily_timing: Mapped[str | None] = mapped_column(String(20), nullable=True)  # per-session override, e.g. "14:00-16:00"
    hms_room_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 100ms room ID
    hms_room_code_host: Mapped[str | None] = mapped_column(String(20), nullable=True)  # room code for admin
    hms_room_code_guest: Mapped[str | None] = mapped_column(String(20), nullable=True)  # room code for student
    is_live: Mapped[bool] = mapped_column(Boolean, server_default="false")  # class currently active?
    is_locally_modified: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    batch: Mapped["LiveBatch"] = relationship(back_populates="sessions")
    template_session: Mapped["TemplateSession | None"] = relationship(
        "TemplateSession", lazy="joined"
    )
