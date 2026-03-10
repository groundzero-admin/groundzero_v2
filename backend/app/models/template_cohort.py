"""Template model — a reusable lesson plan (group of activities).

When imported into a cohort, a template becomes a session.
"""
import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activities: Mapped[list] = mapped_column(JSONB, server_default="[]")  # ["activity_id_1", "activity_id_2"]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
