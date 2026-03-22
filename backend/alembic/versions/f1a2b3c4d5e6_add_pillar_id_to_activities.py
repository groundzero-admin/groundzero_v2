"""add pillar_id to activities

Revision ID: f1a2b3c4d5e6
Revises: a3c6ce9f9569
Create Date: 2026-03-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'a3c6ce9f9569'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activities', sa.Column('pillar_id', sa.String(30), sa.ForeignKey('pillars.id'), nullable=True))


def downgrade() -> None:
    op.drop_column('activities', 'pillar_id')
