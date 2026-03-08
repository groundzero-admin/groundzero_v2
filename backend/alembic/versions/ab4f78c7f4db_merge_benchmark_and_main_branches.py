"""merge benchmark and main branches

Revision ID: ab4f78c7f4db
Revises: 369df549dc37, 5d0c144872f0
Create Date: 2026-03-08 23:18:27.308699

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab4f78c7f4db'
down_revision: Union[str, None] = ('369df549dc37', '5d0c144872f0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
