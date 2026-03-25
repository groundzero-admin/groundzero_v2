"""add_visual_data_to_bm_questions

Revision ID: 702ed1041958
Revises: 2f6a1c9d8c1a
Create Date: 2026-03-21 16:58:21.090018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '702ed1041958'
down_revision: Union[str, None] = '2f6a1c9d8c1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bm_questions', sa.Column('visual_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('bm_questions', 'visual_data')
