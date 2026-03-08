"""Student-to-batch enrollment — many-to-many link between students and live batches."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BatchStudentEnrollment(Base):
    __tablename__ = "batch_student_enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "batch_id", name="uq_student_batch"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), index=True
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("live_batches.id", ondelete="CASCADE"), index=True
    )
    enrolled_at: Mapped[datetime] = mapped_column(server_default=func.now())
