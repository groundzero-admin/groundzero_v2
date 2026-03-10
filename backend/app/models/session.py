"""
Delivery layer models — sessions, cohorts, live rooms, and facilitator notes.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Cohort(Base):
    __tablename__ = "cohorts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_band: Mapped[str] = mapped_column(String(5))  # "4-5", "6-7", "8-9"
    level: Mapped[int] = mapped_column(Integer, server_default="1")
    schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)
    board: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_session_number: Mapped[int] = mapped_column(Integer, server_default="1")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="cohort",
        cascade="all, delete-orphan",
        order_by="Session.order",
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=True)

    # Scheduling & display
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_number: Mapped[int] = mapped_column(Integer, server_default="1")
    order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Template link — which template this session was created from
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("templates.id", ondelete="SET NULL"), nullable=True
    )

    # Learning session state
    current_activity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    cohort: Mapped["Cohort"] = relationship(back_populates="sessions")
    live_room: Mapped["LiveRoom | None"] = relationship(back_populates="session", uselist=False)
    activities: Mapped[list["SessionActivity"]] = relationship(back_populates="session")


class LiveRoom(Base):
    """HMS video room for a session — created on demand when teacher goes live."""
    __tablename__ = "live_rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), unique=True
    )
    hms_room_id: Mapped[str] = mapped_column(String(50))
    room_code_host: Mapped[str | None] = mapped_column(String(20), nullable=True)
    room_code_guest: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_live: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    session: Mapped["Session"] = relationship(back_populates="live_room")


class SessionActivity(Base):
    """Lesson plan for a session — one row per activity assigned to the session."""
    __tablename__ = "session_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    activity_id: Mapped[str] = mapped_column(String(100))
    order: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), server_default="pending")
    launched_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    session: Mapped["Session"] = relationship(back_populates="activities")


class FacilitatorNote(Base):
    __tablename__ = "facilitator_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"))
    engagement: Mapped[int] = mapped_column(Integer)
    notable_moment: Mapped[str | None] = mapped_column(Text, nullable=True)
    intervention_flag: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
