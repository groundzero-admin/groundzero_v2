"""merge_benchmark_and_template_heads

Revision ID: 05b51ecfcc3c
Revises: 550ca812e8bf, fdafff15f84d
Create Date: 2026-03-10 22:35:25.772131

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '05b51ecfcc3c'
down_revision: Union[str, None] = ('550ca812e8bf', 'fdafff15f84d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
