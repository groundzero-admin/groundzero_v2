"""session_activity and cohort fields

Revision ID: b3c8e1a2f450
Revises: 0497ac9a0663
Create Date: 2026-03-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b3c8e1a2f450'
down_revision: Union[str, None] = '0497ac9a0663'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- Cohort: add level, schedule, board, current_session_number --
    op.add_column('cohorts', sa.Column('level', sa.Integer(), server_default='1', nullable=False))
    op.add_column('cohorts', sa.Column('schedule', sa.String(50), nullable=True))
    op.add_column('cohorts', sa.Column('board', sa.String(50), nullable=True))
    op.add_column('cohorts', sa.Column('current_session_number', sa.Integer(), server_default='1', nullable=False))

    # -- Session: add session_number, rename activity_id → current_activity_id, replace facilitator_name with teacher_id --
    op.add_column('sessions', sa.Column('session_number', sa.Integer(), server_default='1', nullable=False))
    op.alter_column('sessions', 'activity_id', new_column_name='current_activity_id')
    op.add_column('sessions', sa.Column('teacher_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True))
    op.drop_column('sessions', 'facilitator_name')

    # -- SessionActivity: new table --
    op.create_table(
        'session_activities',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('activity_id', sa.String(100), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('session_activities')
    op.add_column('sessions', sa.Column('facilitator_name', sa.String(200), nullable=True))
    op.drop_column('sessions', 'teacher_id')
    op.alter_column('sessions', 'current_activity_id', new_column_name='activity_id')
    op.drop_column('sessions', 'session_number')
    op.drop_column('cohorts', 'current_session_number')
    op.drop_column('cohorts', 'board')
    op.drop_column('cohorts', 'schedule')
    op.drop_column('cohorts', 'level')
