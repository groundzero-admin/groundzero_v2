#!/bin/bash
# Deploy backend to EC2
# Usage: ./deploy/deploy-backend.sh <EC2-IP> [--migrate] [--seed]

set -euo pipefail

EC2_IP="${1:?Usage: $0 <EC2-IP> [--migrate] [--seed]}"
EC2_USER="ubuntu"
REMOTE_DIR="~/groundzero"
SSH="ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP}"

echo "=== Syncing code to EC2 ==="
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  --exclude='__pycache__' --exclude='*.pyc' --exclude='server.log' \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$(dirname "$0")/../" "${EC2_USER}@${EC2_IP}:${REMOTE_DIR}/"

echo "=== Building and restarting backend ==="
$SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml up -d --build"

# Run migrations if requested
if [[ "${2:-}" == "--migrate" || "${3:-}" == "--migrate" ]]; then
  echo "=== Running Alembic migrations ==="
  $SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml exec backend alembic upgrade head"
fi

# Run seed if requested
if [[ "${2:-}" == "--seed" || "${3:-}" == "--seed" ]]; then
  echo "=== Running seed ==="
  $SSH "cd ${REMOTE_DIR} && docker compose -f deploy/docker-compose.prod.yml exec backend python -m seed.seed"
fi

echo "=== Verifying ==="
sleep 3
$SSH "curl -s http://localhost:8000/health"
echo ""
echo "=== Backend deployed! ==="
