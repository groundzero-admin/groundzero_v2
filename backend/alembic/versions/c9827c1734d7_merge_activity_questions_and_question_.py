"""merge_activity_questions_and_question_ids

Revision ID: c9827c1734d7
Revises: 431ff477182a, 852eedf7403c
Create Date: 2026-03-17 00:56:19.730990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9827c1734d7'
down_revision: Union[str, None] = ('431ff477182a', '852eedf7403c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
