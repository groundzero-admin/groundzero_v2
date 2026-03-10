"""add hms fields to live batch sessions

Revision ID: b7f8a2c3d4e5
Revises: a1afee95460c
Create Date: 2026-03-07
"""
from alembic import op
import sqlalchemy as sa

revision = "b7f8a2c3d4e5"
down_revision = "a1afee95460c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("live_batch_sessions", sa.Column("hms_room_id", sa.String(50), nullable=True))
    op.add_column("live_batch_sessions", sa.Column("hms_room_code_host", sa.String(20), nullable=True))
    op.add_column("live_batch_sessions", sa.Column("hms_room_code_guest", sa.String(20), nullable=True))
    op.add_column("live_batch_sessions", sa.Column("is_live", sa.Boolean(), server_default="false"))


def downgrade() -> None:
    op.drop_column("live_batch_sessions", "is_live")
    op.drop_column("live_batch_sessions", "hms_room_code_guest")
    op.drop_column("live_batch_sessions", "hms_room_code_host")
    op.drop_column("live_batch_sessions", "hms_room_id")
