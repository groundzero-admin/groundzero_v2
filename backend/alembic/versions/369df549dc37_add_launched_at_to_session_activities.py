"""add_launched_at_to_session_activities

Revision ID: 369df549dc37
Revises: b32be161b067
Create Date: 2026-03-07 14:43:00.985305

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '369df549dc37'
down_revision: Union[str, None] = 'b32be161b067'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('session_activities', sa.Column('launched_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('session_activities', 'launched_at')
