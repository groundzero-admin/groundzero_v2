#!/bin/bash
# Deploy backend to EC2
# Usage: ./deploy/deploy-backend.sh [--migrate] [--seed]

set -euo pipefail

SSH_HOST="gz-ec2"
REMOTE_DIR="~/groundzero"
SSH="ssh ${SSH_HOST}"

echo "=== Syncing code to EC2 ==="
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  --exclude='__pycache__' --exclude='*.pyc' --exclude='server.log' \
  "$(dirname "$0")/../" "${SSH_HOST}:${REMOTE_DIR}/"

echo "=== Building and restarting backend ==="
$SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml up -d --build"

# Run migrations if requested
if [[ "${1:-}" == "--migrate" || "${2:-}" == "--migrate" ]]; then
  echo "=== Running Alembic migrations ==="
  $SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head"
fi

# Run seed if requested
if [[ "${1:-}" == "--seed" || "${2:-}" == "--seed" ]]; then
  echo "=== Running seed ==="
  $SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml exec backend python -m seed.seed"
fi

echo "=== Verifying ==="
sleep 3
$SSH "curl -s http://localhost:8000/health"
echo ""
echo "=== Backend deployed! ==="
