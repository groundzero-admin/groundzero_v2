.PHONY: backend frontend dev stop db seed-questions generate-images generate-characters

# ─── Individual services ───

backend:
	@echo "Starting backend on port 8001..."
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8001

frontend:
	@echo "Starting frontend on port 3000..."
	export NVM_DIR="$$HOME/.nvm" && source "$$NVM_DIR/nvm.sh" && nvm use 22 && cd frontend && npm run dev

# ─── Run both together ───

dev:
	@echo "Starting backend + frontend..."
	@make stop 2>/dev/null || true
	@make backend &
	@sleep 2
	@make frontend

# ─── Stop all ───

stop:
	@echo "Stopping servers..."
	@lsof -ti :8001 -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
	@lsof -ti :3000 -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
	@echo "Stopped."

# ─── Database ───

db:
	@echo "Starting PostgreSQL & Redis via Docker..."
	docker compose up -d

seed-questions:
	@echo "Seeding benchmark questions..."
	cd backend && source .venv/bin/activate && python -m app.plugins.benchmark.seed_questions

generate-images:
	@echo "Generating question background images via Bedrock Titan..."
	cd backend && source .venv/bin/activate && python -m app.plugins.benchmark.generate_question_images

generate-characters:
	@echo "Generating character pose images via Bedrock Titan..."
	cd backend && source .venv/bin/activate && python -m app.plugins.benchmark.generate_character_images
