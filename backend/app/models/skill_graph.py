from sqlalchemy import ForeignKey, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PrerequisiteEdge(Base):
    __tablename__ = "prerequisite_edges"

    source_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), primary_key=True)
    target_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), primary_key=True)
    min_stage: Mapped[int] = mapped_column(Integer, server_default="2")
    encompassing_weight: Mapped[float] = mapped_column(Float, server_default="0.0")


class CodevelopmentEdge(Base):
    __tablename__ = "codevelopment_edges"

    source_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), primary_key=True)
    target_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), primary_key=True)
    transfer_weight: Mapped[float] = mapped_column(Float)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
