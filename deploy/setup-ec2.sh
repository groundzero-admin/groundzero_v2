#!/bin/bash
# One-time EC2 bootstrap script
# Run as: ssh ubuntu@<EC2-IP> 'bash -s' < deploy/setup-ec2.sh

set -euo pipefail

echo "=== Installing Docker ==="
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu

echo "=== Installing CloudWatch agent ==="
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

echo "=== Creating app directory ==="
mkdir -p ~/groundzero

echo "=== Done! Log out and back in for docker group to take effect ==="
echo "Then: cd ~/groundzero && docker compose -f deploy/docker-compose.prod.yml up -d --build"
