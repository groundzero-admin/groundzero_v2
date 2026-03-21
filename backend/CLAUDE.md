# GroundZero Backend Rules

## Architecture
- Routes (`app/api/`) — thin: validation + auth only, delegate to services
- Services (`app/services/`) — DB + engine integration, business logic
- Engine (`app/engine/`) — pure Python, no DB deps, no app imports
- Seed (`seed/`) — idempotent upserts only

## FastAPI Best Practices
- Use Pydantic models for all request/response schemas
- Return typed response models — never raw dicts from endpoints
- Use `Depends()` for auth, DB session, and shared dependencies
- Use `HTTPException` with proper status codes
- Keep endpoints thin — one service call max per endpoint
- Use async/await throughout — no blocking calls

## SQLAlchemy Async
- Always use `AsyncSession` — never sync session
- `await db.flush()` before reading auto-generated IDs
- `await db.commit()` only in services, not routes
- Use `select()` not `db.query()` (legacy)
- Use `.scalar_one_or_none()` not `.first()` for single rows
- Always add indexes for foreign keys and commonly filtered columns

## Database / Migrations
- Every schema change needs an Alembic migration
- Never alter DB directly — always through migrations
- Migration IDs follow pattern: `a1b2c3d4e5f6`
- Use `op.add_column` not `ALTER TABLE` in migrations

## BKT Engine
- `StudentCompetencyState` = lifetime BKT state per (student, competency)
- `SessionCompetencySnapshot` = before/after BKT per (session, student, competency)
- `StudentActivityProgress` = current question index per (student, activity)
- Evidence → BKT update → advance progress (all in `evidence_service.py`)

## Question Serving
- `activity.question_ids` set → ordered mode via `StudentActivityProgress`
- Not set → ZPD random selection by P(L) and difficulty
- Count unique questions only — DISTINCT ON `activity_question_id`, last attempt wins

## Security
- Never trust client-supplied IDs without DB verification
- Use `require_role()` on all admin/teacher endpoints
- Never log sensitive data (tokens, passwords, PII)
- Validate file types before S3 upload
