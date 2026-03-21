"""add_session_competency_snapshots

Revision ID: a1b2c3d4e5f6
Revises: 2f6a1c9d8c1a
Create Date: 2026-03-20

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "2f6a1c9d8c1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "session_competency_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("competency_id", sa.String(10), nullable=False),
        sa.Column("p_learned_before", sa.Float(), nullable=False),
        sa.Column("stage_before", sa.Integer(), nullable=False),
        sa.Column("p_learned_after", sa.Float(), nullable=False),
        sa.Column("stage_after", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("session_id", "student_id", "competency_id", name="uq_scs_session_student_competency"),
    )
    op.create_index(
        "ix_scs_session_competency",
        "session_competency_snapshots",
        ["session_id", "competency_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_scs_session_competency", table_name="session_competency_snapshots")
    op.drop_table("session_competency_snapshots")
