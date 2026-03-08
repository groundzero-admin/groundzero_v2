"""add encompassing_weight to prerequisite_edges

Revision ID: c7f1a3b5d890
Revises: b3c8e1a2f450
Create Date: 2026-03-06
"""

from alembic import op
import sqlalchemy as sa

revision = "c7f1a3b5d890"
down_revision = "b3c8e1a2f450"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "prerequisite_edges",
        sa.Column("encompassing_weight", sa.Float(), server_default="0.0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("prerequisite_edges", "encompassing_weight")
