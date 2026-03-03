#!/bin/bash
# Deploy frontend to S3 + invalidate CloudFront
# Usage: ./deploy/deploy-frontend.sh <S3_BUCKET> [CLOUDFRONT_DIST_ID]

set -euo pipefail

S3_BUCKET="${1:?Usage: $0 <S3_BUCKET> [CLOUDFRONT_DIST_ID]}"
CF_DIST_ID="${2:-}"
FRONTEND_DIR="$(dirname "$0")/../frontend"

echo "=== Building frontend ==="
cd "$FRONTEND_DIR"
npm run build

echo "=== Uploading to S3 ==="
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete --region ap-south-1

if [ -n "$CF_DIST_ID" ]; then
  echo "=== Invalidating CloudFront ==="
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --region ap-south-1
fi

echo "=== Frontend deployed! ==="
