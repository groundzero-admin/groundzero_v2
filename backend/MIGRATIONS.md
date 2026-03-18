# DB Migrations (Ops Notes)

This file is a **human-readable** summary of important database migrations that need attention during deployments.

## How to apply migrations

From the `backend/` directory (with correct `DATABASE_URL_SYNC` / DB credentials configured):

```bash
alembic upgrade head
```

To check the current DB revision:

```bash
alembic current
```

## Latest: Multi-competency questions (TEXT[])

- **Alembic revision**: `2f6a1c9d8c1a`
- **Purpose**: Allow questions to be tagged with **multiple competencies**.
- **Tables changed**:
  - `activity_questions`
    - added `competency_ids TEXT[] NOT NULL DEFAULT '{}'`
    - backfilled: `competency_ids = ARRAY[competency_id]`
    - added GIN index: `ix_activity_questions_competency_ids_gin`
  - `questions`
    - added `competency_ids TEXT[] NOT NULL DEFAULT '{}'`
    - backfilled: `competency_ids = ARRAY[competency_id]`
    - added GIN index: `ix_questions_competency_ids_gin`
- **Notes**:
  - Legacy `competency_id` columns are still present for compatibility; the app writes the first element of `competency_ids` into `competency_id`.

