"""add_competency_ids_arrays_to_questions

Revision ID: 2f6a1c9d8c1a
Revises: b7fae0043243
Create Date: 2026-03-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "2f6a1c9d8c1a"
down_revision: Union[str, None] = "b26820634f2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # activity_questions: add competency_ids[] and backfill
    op.add_column(
        "activity_questions",
        sa.Column(
            "competency_ids",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    op.execute(
        "UPDATE activity_questions SET competency_ids = ARRAY[competency_id] WHERE competency_id IS NOT NULL"
    )
    op.create_index(
        "ix_activity_questions_competency_ids_gin",
        "activity_questions",
        ["competency_ids"],
        unique=False,
        postgresql_using="gin",
    )

    # questions: add competency_ids[] and backfill
    op.add_column(
        "questions",
        sa.Column(
            "competency_ids",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    op.execute("UPDATE questions SET competency_ids = ARRAY[competency_id] WHERE competency_id IS NOT NULL")
    op.create_index(
        "ix_questions_competency_ids_gin",
        "questions",
        ["competency_ids"],
        unique=False,
        postgresql_using="gin",
    )


def downgrade() -> None:
    op.drop_index("ix_questions_competency_ids_gin", table_name="questions")
    op.drop_column("questions", "competency_ids")

    op.drop_index("ix_activity_questions_competency_ids_gin", table_name="activity_questions")
    op.drop_column("activity_questions", "competency_ids")

