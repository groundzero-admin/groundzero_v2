EC2_IP      := 13.127.212.180
EC2_USER    := ubuntu
S3_BUCKET   := groundzero-frontend-607416643912
CF_DIST_ID  := E3UB1MMSAZCO69
KEY_PATH    := ~/.ssh/id_ed25519_gz
SSH         := ssh -i $(KEY_PATH) -o StrictHostKeyChecking=no $(EC2_USER)@$(EC2_IP)

# Load AWS credentials from .env.aws if it exists (export KEY=VALUE lines)
-include .env.aws
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_DEFAULT_REGION

.PHONY: backend frontend dev stop db seed-questions generate-images generate-characters generate-audios \
        deploy-backend deploy-frontend deploy ssh-connect backfill-hints simulate-class

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

generate-audios:
	@echo "Generating question TTS audio and uploading to S3..."
	cd backend && source .venv/bin/activate && python -m app.plugins.benchmark.generate_question_audios

backfill-correct-answers:
	@echo "Backfilling correct answers for all deterministic questions..."
	cd backend && source .venv/bin/activate && python -m app.scripts.backfill_correct_answers

simulate-class:
	@echo "Simulating class with 8 students (4 archetypes) for Math Sprint..."
	cd backend && source .venv/bin/activate && python -m app.scripts.simulate_class --reset

# ─── Deployment ───────────────────────────────────────────────────────────────

# Push SSH key via EC2 Instance Connect (60s window), then SSH in
ssh-connect:
	@echo "Pushing SSH key via EC2 Instance Connect..."
	aws ec2-instance-connect send-ssh-public-key \
		--instance-id i-0388ab6b80f7f4e31 \
		--availability-zone ap-south-1a \
		--instance-os-user $(EC2_USER) \
		--ssh-public-key file://$(KEY_PATH).pub \
		--region ap-south-1
	@echo "Key pushed. SSH window: 60s"

deploy-backend: ssh-connect
	@echo "=== Deploying backend to EC2 ==="
	rsync -avz --progress \
		--exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
		--exclude='*.pyc' --exclude='.venv' --exclude='dist' --exclude='server.log' \
		-e "ssh -i $(KEY_PATH) -o StrictHostKeyChecking=no" \
		./ $(EC2_USER)@$(EC2_IP):~/groundzero/
	$(SSH) "cd ~/groundzero && docker compose -f deploy/docker-compose.prod.yml up -d --build backend"
	@sleep 3
	$(SSH) "curl -s http://localhost:8000/health"
	@echo "\n=== Backend deployed ==="

deploy-frontend:
	@echo "=== Building frontend ==="
	cd frontend && npm run build
	@echo "=== Uploading to S3 ==="
	aws s3 sync frontend/dist/ s3://$(S3_BUCKET) --delete --region ap-south-1
	@echo "=== Invalidating CloudFront ==="
	aws cloudfront create-invalidation \
		--distribution-id $(CF_DIST_ID) \
		--paths "/*" \
		--region ap-south-1
	@echo "=== Frontend deployed ==="

deploy: deploy-backend deploy-frontend
	@echo "=== Full deployment complete ==="
