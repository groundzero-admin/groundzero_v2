"""Student-to-cohort enrollment — many-to-many link between students and cohorts."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CohortEnrollment(Base):
    __tablename__ = "cohort_enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "cohort_id", name="uq_student_cohort"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), index=True
    )
    cohort_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cohorts.id", ondelete="CASCADE"), index=True
    )
    enrolled_at: Mapped[datetime] = mapped_column(server_default=func.now())
