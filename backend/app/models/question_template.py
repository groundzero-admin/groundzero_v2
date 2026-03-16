import uuid
from datetime import datetime

from sqlalchemy import Boolean, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class QuestionTemplate(Base):
    __tablename__ = "question_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    example_use_cases: Mapped[str] = mapped_column(Text, default="")
    frontend_component: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(10), default="")
    scorable: Mapped[bool] = mapped_column(Boolean, default=True)
    input_schema: Mapped[dict] = mapped_column(JSONB, default=dict)
    llm_prompt_template: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
