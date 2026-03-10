"""remove_day_column_from_sessions_and_templates

Revision ID: fdafff15f84d
Revises: 91afb66352e5
Create Date: 2026-03-10 19:48:11.460053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fdafff15f84d'
down_revision: Union[str, None] = '91afb66352e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('sessions', 'day')
    op.drop_column('templates', 'day')


def downgrade() -> None:
    op.add_column('templates', sa.Column('day', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('sessions', sa.Column('day', sa.INTEGER(), autoincrement=False, nullable=True))
