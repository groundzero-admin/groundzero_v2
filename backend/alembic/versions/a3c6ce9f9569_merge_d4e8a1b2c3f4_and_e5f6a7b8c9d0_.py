"""merge d4e8a1b2c3f4 and e5f6a7b8c9d0 heads

Revision ID: a3c6ce9f9569
Revises: d4e8a1b2c3f4, e5f6a7b8c9d0
Create Date: 2026-03-21 17:54:23.739365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c6ce9f9569'
down_revision: Union[str, None] = ('d4e8a1b2c3f4', 'e5f6a7b8c9d0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
