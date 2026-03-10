"""merge heads

Revision ID: 4412709c8461
Revises: b6d9bd5af1b6, b7f8a2c3d4e5
Create Date: 2026-03-09 23:02:18.677431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4412709c8461'
down_revision: Union[str, None] = ('b6d9bd5af1b6', 'b7f8a2c3d4e5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
