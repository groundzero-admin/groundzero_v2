"""Store invite raw token so admin can re-copy links without regenerating.

Revision ID: d4e8a1b2c3f4
Revises: 2f6a1c9d8c1a
Create Date: 2025-03-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e8a1b2c3f4"
down_revision: Union[str, None] = "2f6a1c9d8c1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "student_invites",
        sa.Column("raw_token", sa.String(length=128), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_invites", "raw_token")
