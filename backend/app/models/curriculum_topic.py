"""Curriculum topic models — CBSE/IB/ICSE chapter-level content mapping."""

from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CurriculumTopic(Base):
    __tablename__ = "curriculum_topics"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # cbse-math-6-fractions
    board: Mapped[str] = mapped_column(String(20), index=True)  # cbse, ib, icse
    subject: Mapped[str] = mapped_column(String(50), index=True)  # mathematics, science
    grade: Mapped[int] = mapped_column(Integer, index=True)  # 4-9
    chapter_number: Mapped[int] = mapped_column(Integer)  # ordering within grade+subject
    name: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ncert_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "Class 6, Ch 7"
    content: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # content blocks for ContentRenderer
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class TopicCompetencyMap(Base):
    __tablename__ = "topic_competency_map"

    topic_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("curriculum_topics.id"), primary_key=True
    )
    competency_id: Mapped[str] = mapped_column(
        String(10), ForeignKey("competencies.id"), primary_key=True
    )
    relevance: Mapped[float] = mapped_column(Float)  # 0.0-1.0
