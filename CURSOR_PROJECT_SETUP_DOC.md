# GroundZero Project Setup Handoff (for Cursor AI)

Use this document as context when asking Cursor AI to set up, extend, or deploy this project.

## 1) Current Architecture (What exists today)

- Frontend: React + TypeScript + Vite (`frontend/`)
- Backend: FastAPI + SQLAlchemy async ORM + Alembic (`backend/`)
- Database: PostgreSQL
- Cache: Redis
- Local infra: Docker Compose for DB + Redis (`backend/docker-compose.yml`)
- AWS deploy:
  - Backend: EC2 + Docker Compose (`deploy/deploy-backend.sh`, `deploy/docker-compose.prod.yml`)
  - Frontend: static build to S3 (+ optional CloudFront invalidation) (`deploy/deploy-frontend.sh`)

## 2) Is ORM used?

Yes.

- ORM: SQLAlchemy 2.x (`backend/app/database.py`, models in `backend/app/models/`)
- Migrations: Alembic (`backend/alembic/`, `backend/alembic.ini`)
- Backend runtime DB connection: async URL (`DATABASE_URL`)
- Migration/seed scripts use sync URL (`DATABASE_URL_SYNC`)

## 3) How frontend and backend are linked

- Backend API prefix is `/api/v1` (`backend/app/config.py`, `backend/app/main.py`).
- Frontend API client calls relative base URL `/api/v1` (`frontend/src/api/client.ts`).
- In local Vite dev, `/api` is proxied to backend target in `frontend/vite.config.ts`.
- Current proxy target is `http://localhost:8001`.
- `Makefile` runs backend on port `8001` (`make backend`).
- Docker production backend container exposes `8000`.

Important: local setup should keep backend port + Vite proxy consistent (usually both `8001` for dev).

## 4) Docker usage in this repo

### Local

- DB + Redis only are containerized for local dev:
  - `cd backend && docker compose up -d`
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`

### Production backend (AWS EC2)

- Backend container is built from `backend/Dockerfile`.
- `deploy/docker-compose.prod.yml` defines backend service and loads env from `../.env.production`.
- Deployment script `deploy/deploy-backend.sh`:
  1. rsync project to EC2
  2. `docker compose -f deploy/docker-compose.prod.yml up -d --build`
  3. optional: run migrations (`--migrate`)
  4. optional: run seed (`--seed`)

## 5) Environment variables and files

No `.env` files are committed (ignored by `.gitignore`), which is correct.

### Backend expected env vars (from `backend/app/config.py`)

Required for a healthy setup:

- `DATABASE_URL` (async SQLAlchemy URL)
- `DATABASE_URL_SYNC` (sync URL for Alembic and seed scripts)
- `REDIS_URL`
- `JWT_SECRET_KEY` (must be strong in production)
- `FRONTEND_URL`

Feature-specific vars:

- `SPARK_API_KEY`
- `SPARK_BASE_URL`
- `SPARK_MODEL`
- `HMS_ACCESS_KEY`
- `HMS_APP_SECRET`

Operational defaults also exist in code, but production should override all sensitive values.

### Recommended env file layout

- `backend/.env` for local backend runtime
- `.env.production` at repo root for EC2 compose deploy (this is what current prod compose expects)

You can also maintain:

- `.env.example` (root)
- `backend/.env.example`
- `frontend/.env.example` (if future frontend env vars are introduced)

## 6) Recommended env templates

Create `backend/.env` (local):

```env
DATABASE_URL=postgresql+asyncpg://gz_user:gz_local_password@localhost:5432/groundzero
DATABASE_URL_SYNC=postgresql://gz_user:gz_local_password@localhost:5432/groundzero
REDIS_URL=redis://localhost:6379/0

DEBUG=true
API_V1_PREFIX=/api/v1
JWT_SECRET_KEY=replace-with-local-dev-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12
FRONTEND_URL=http://localhost:3000

SPARK_API_KEY=
SPARK_BASE_URL=https://bedrock-mantle.ap-southeast-2.api.aws/v1
SPARK_MODEL=openai.gpt-oss-safeguard-120b
SPARK_MAX_TURNS=4

HMS_ACCESS_KEY=
HMS_APP_SECRET=
```

Create `.env.production` (repo root, used by `deploy/docker-compose.prod.yml`):

```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<rds-or-db-host>:5432/<db_name>
DATABASE_URL_SYNC=postgresql://<user>:<password>@<rds-or-db-host>:5432/<db_name>
REDIS_URL=redis://<redis-host>:6379/0

DEBUG=false
API_V1_PREFIX=/api/v1
JWT_SECRET_KEY=<very-strong-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12
FRONTEND_URL=https://<frontend-domain>

SPARK_API_KEY=<secret>
SPARK_BASE_URL=https://bedrock-mantle.ap-southeast-2.api.aws/v1
SPARK_MODEL=openai.gpt-oss-safeguard-120b
SPARK_MAX_TURNS=4

HMS_ACCESS_KEY=<secret>
HMS_APP_SECRET=<secret>
```

## 7) Local setup flow (fast + contributor-friendly)

From repo root:

1. Start DB + Redis
   - `cd backend && docker compose up -d`
2. Setup backend venv + install
   - `cd backend`
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -e .`
3. Apply migrations
   - `alembic upgrade head`
4. (Optional) Seed data
   - `python -m seed.seed`
5. Run backend
   - `uvicorn app.main:app --reload --port 8001`
6. Setup frontend
   - `cd frontend && npm install`
7. Run frontend
   - `npm run dev` (port `3000`)

Quick check:

- Backend health: `http://localhost:8001/health`
- Frontend should call backend via Vite proxy (`/api` -> `localhost:8001`)

## 8) DB migrations: local and AWS

### Local

- Ensure `DATABASE_URL_SYNC` points to local Postgres.
- Run:
  - `cd backend`
  - `source .venv/bin/activate`
  - `alembic upgrade head`

### AWS (current EC2 flow)

- Keep correct prod env in `.env.production`.
- Deploy backend:
  - `./deploy/deploy-backend.sh <EC2_IP> --migrate`
- This runs:
  - `docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head`

### Fast migration tips

- Keep migration scripts small and additive.
- Add indexes in migrations for query-critical fields.
- Avoid large blocking schema changes during peak traffic.
- For zero-downtime pattern:
  1. Add nullable/new columns
  2. Backfill in batches
  3. Switch app reads/writes
  4. Drop old columns later

## 9) AWS deployment status and improvements needed

### Already present

- EC2 bootstrap script (`deploy/setup-ec2.sh`)
- Backend deploy script (`deploy/deploy-backend.sh`)
- Frontend S3/CloudFront deploy script (`deploy/deploy-frontend.sh`)
- CloudWatch logging configured for backend container

### Gaps to close for robust production

- `deploy/docker-compose.prod.yml` currently defines only backend service.
  - Add/confirm external managed DB + Redis (RDS/ElastiCache), or add service definitions only if self-hosting.
- Ensure security group/network access for DB/Redis is private and restricted.
- Store secrets in AWS SSM Parameter Store or Secrets Manager (not plain files).
- Add CI pipeline to run tests/lint/migrations before deployment.
- Add health checks, rollback strategy, and backup/restore docs.

## 10) Suggested contributor workflow (GitHub-friendly)

- Keep one command bootstrap script (recommended):
  - `scripts/bootstrap-local.sh` to automate venv, npm install, compose up, migrate, seed.
- Add examples:
  - `.env.example`, `backend/.env.example`
- Add verification script:
  - `scripts/check-local.sh` to hit `/health` and run a simple API smoke test.
- Add pre-commit checks:
  - backend lint/tests + frontend lint/build
- Document this in root `README.md` for new contributors.

## 11) Cursor AI instruction prompt (copy/paste)

Use this prompt with Cursor AI for project setup work:

```text
Set up this GroundZero repo for clean local development and AWS deployment hardening.

Context:
- Frontend: Vite React on port 3000, API calls to /api/v1
- Backend: FastAPI on port 8001 in local dev, SQLAlchemy + Alembic
- Local infra: Postgres + Redis via backend/docker-compose.yml
- AWS deploy currently uses EC2 + deploy/docker-compose.prod.yml and .env.production

Goals:
1) Create/update root README with exact local setup steps for Linux/macOS.
2) Add env example files (.env.example and backend/.env.example) from documented keys.
3) Ensure frontend proxy target and backend local port are consistent.
4) Add scripts/bootstrap-local.sh and scripts/check-local.sh.
5) Add docs/deployment-aws.md with:
   - EC2 deploy flow
   - migration flow
   - secrets handling (SSM/Secrets Manager)
   - rollback + backup guidance
6) Keep existing app behavior unchanged.
7) Run lint/tests if available and summarize results.

Constraints:
- Do not commit secrets.
- Do not change business logic.
- Keep changes minimal and production-safe.
```

## 12) Direct answers to your key questions

- "Are we using ORM?" -> Yes, SQLAlchemy ORM.
- "How is Docker used?" -> Local DB/Redis; backend containerized for EC2 deploy.
- "How are DB migrations done?" -> Alembic with `DATABASE_URL_SYNC`; local and AWS both use `alembic upgrade head`.
- "How are frontend/backend linked?" -> Frontend hits `/api/v1`; Vite proxy routes `/api` to backend dev server.
- "How to make local + AWS fast and maintainable?" -> Standardize env examples, bootstrap scripts, strict migration workflow, managed secrets, CI checks, and a single deployment playbook.

