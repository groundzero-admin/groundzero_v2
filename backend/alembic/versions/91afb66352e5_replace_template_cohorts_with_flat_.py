"""replace_template_cohorts_with_flat_templates

Revision ID: 91afb66352e5
Revises: b7fae0043243
Create Date: 2026-03-10 12:10:31.249574

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '91afb66352e5'
down_revision: Union[str, None] = 'b7fae0043243'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create new flat templates table
    op.create_table('templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('day', sa.Integer(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True),
        sa.Column('activities', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add template_id to sessions, drop old template_session_id + is_locally_modified
    op.add_column('sessions', sa.Column('template_id', sa.UUID(), nullable=True))
    op.drop_constraint('sessions_template_session_id_fkey', 'sessions', type_='foreignkey')
    op.create_foreign_key(None, 'sessions', 'templates', ['template_id'], ['id'], ondelete='SET NULL')
    op.drop_column('sessions', 'is_locally_modified')
    op.drop_column('sessions', 'template_session_id')

    # 3. Drop old template tables (template_sessions must go first due to FK)
    op.drop_table('template_sessions')
    op.drop_table('template_cohorts')


def downgrade() -> None:
    # Recreate old tables
    op.create_table('template_cohorts',
        sa.Column('id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('name', sa.VARCHAR(length=200), autoincrement=False, nullable=False),
        sa.Column('level', sa.INTEGER(), server_default=sa.text('1'), autoincrement=False, nullable=False),
        sa.Column('mode', sa.VARCHAR(length=20), server_default=sa.text("'online'::character varying"), autoincrement=False, nullable=False),
        sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('template_sessions',
        sa.Column('id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('template_cohort_id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('title', sa.VARCHAR(length=300), autoincrement=False, nullable=False),
        sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('day', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('order', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(['template_cohort_id'], ['template_cohorts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Restore old session columns
    op.add_column('sessions', sa.Column('template_session_id', sa.UUID(), nullable=True))
    op.add_column('sessions', sa.Column('is_locally_modified', sa.BOOLEAN(), server_default=sa.text('false'), nullable=False))
    op.drop_constraint(None, 'sessions', type_='foreignkey')
    op.create_foreign_key('sessions_template_session_id_fkey', 'sessions', 'template_sessions', ['template_session_id'], ['id'], ondelete='SET NULL')
    op.drop_column('sessions', 'template_id')

    op.drop_table('templates')
