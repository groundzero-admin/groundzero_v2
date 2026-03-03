import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Pillar(Base):
    __tablename__ = "pillars"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)  # communication, creativity, ai_systems, math_logic
    name: Mapped[str] = mapped_column(String(100))
    color: Mapped[str] = mapped_column(String(10))  # hex color
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Capability(Base):
    __tablename__ = "capabilities"

    id: Mapped[str] = mapped_column(String(1), primary_key=True)  # A through P
    pillar_id: Mapped[str] = mapped_column(ForeignKey("pillars.id"))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)  # C1.1 through C4.19
    capability_id: Mapped[str] = mapped_column(ForeignKey("capabilities.id"))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    assessment_method: Mapped[str] = mapped_column(String(20))  # mcq | llm | both
    default_params: Mapped[dict] = mapped_column(JSONB, server_default='{"pL0": 0.10, "pT": 0.15, "pG": 0.25, "pS": 0.10}')
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
