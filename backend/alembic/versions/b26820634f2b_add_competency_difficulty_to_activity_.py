"""add_competency_difficulty_to_activity_questions

Revision ID: b26820634f2b
Revises: c9827c1734d7
Create Date: 2026-03-17 01:10:38.792236

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b26820634f2b'
down_revision: Union[str, None] = 'c9827c1734d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Clear test data — competency_id is now required
    op.execute("DELETE FROM activity_questions")
    op.add_column('activity_questions', sa.Column('competency_id', sa.String(10), nullable=False))
    op.add_column('activity_questions', sa.Column('difficulty', sa.Float(), server_default='0.5', nullable=False))
    op.create_index('ix_activity_questions_competency_id', 'activity_questions', ['competency_id'])
    op.create_foreign_key(
        'fk_activity_questions_competency_id',
        'activity_questions', 'competencies',
        ['competency_id'], ['id'],
        ondelete='RESTRICT',
    )


def downgrade() -> None:
    op.drop_constraint('fk_activity_questions_competency_id', 'activity_questions', type_='foreignkey')
    op.drop_index('ix_activity_questions_competency_id', table_name='activity_questions')
    op.drop_column('activity_questions', 'difficulty')
    op.drop_column('activity_questions', 'competency_id')
