import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    module_id: Mapped[str] = mapped_column(String(50))  # level_1, math_v1
    name: Mapped[str] = mapped_column(String(300))
    type: Mapped[str] = mapped_column(String(20))  # warmup, key_topic, diy, ai_lab, artifact
    mode: Mapped[str] = mapped_column(String(20), server_default="default")  # timed_mcq, open_ended, discussion, default
    week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    session_number: Mapped[int | None] = mapped_column(Integer, nullable=True)  # deprecated: use template.activities
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade_bands: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["4-5", "6-7", "8-9"]
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    learning_outcomes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    primary_competencies: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{competencyId, expectedGain}]
    secondary_competencies: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    prerequisites: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{competencyId, minStage}]
    question_ids: Mapped[list] = mapped_column(JSONB, server_default="[]")  # ["question_uuid_1", "question_uuid_2"]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id: Mapped[str] = mapped_column(String(50))  # level_1, math_v1
    competency_id: Mapped[str] = mapped_column(String(10), ForeignKey("competencies.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20))  # mcq, short_answer
    options: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{label, text, isCorrect}]
    correct_answer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    difficulty: Mapped[float] = mapped_column(Float)  # 0.0-1.0
    grade_band: Mapped[str] = mapped_column(String(5))  # "4-5", "6-7", "8-9"
    topic_id: Mapped[str | None] = mapped_column(
        String(100), ForeignKey("curriculum_topics.id"), nullable=True, index=True
    )
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
