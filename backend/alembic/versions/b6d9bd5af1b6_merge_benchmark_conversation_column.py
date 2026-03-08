"""merge benchmark conversation column

Revision ID: b6d9bd5af1b6
Revises: 4eb817bcc3c4, ab4f78c7f4db
Create Date: 2026-03-08 23:30:35.629139

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6d9bd5af1b6'
down_revision: Union[str, None] = ('4eb817bcc3c4', 'ab4f78c7f4db')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
