"""update image fields to image_upload type in question templates

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update image_url fields from type "text" to "image_upload" in question_templates
    op.execute("""
        UPDATE question_templates
        SET input_schema = jsonb_set(
            input_schema,
            '{fields}',
            (
                SELECT jsonb_agg(
                    CASE
                        WHEN (field->>'key' = 'image_url' OR field->>'key' = 'reference_image_url')
                             AND field->>'type' = 'text'
                        THEN field
                            - 'type'
                            - 'label'
                            || jsonb_build_object(
                                'type', 'image_upload',
                                'label', CASE field->>'key'
                                    WHEN 'image_url' THEN 'Image'
                                    WHEN 'reference_image_url' THEN 'Reference image (optional)'
                                    ELSE field->>'label'
                                END
                            )
                        ELSE field
                    END
                )
                FROM jsonb_array_elements(input_schema->'fields') AS field
            )
        )
        WHERE input_schema->'fields' IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(input_schema->'fields') AS f
            WHERE (f->>'key' = 'image_url' OR f->>'key' = 'reference_image_url')
              AND f->>'type' = 'text'
          )
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE question_templates
        SET input_schema = jsonb_set(
            input_schema,
            '{fields}',
            (
                SELECT jsonb_agg(
                    CASE
                        WHEN (field->>'key' = 'image_url' OR field->>'key' = 'reference_image_url')
                             AND field->>'type' = 'image_upload'
                        THEN field
                            - 'type'
                            - 'label'
                            || jsonb_build_object('type', 'text', 'label', field->>'key')
                        ELSE field
                    END
                )
                FROM jsonb_array_elements(input_schema->'fields') AS field
            )
        )
        WHERE input_schema->'fields' IS NOT NULL
    """)
