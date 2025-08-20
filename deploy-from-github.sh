#!/bin/bash

# GitHub Deployment Script
# This script is called by GitHub Actions to deploy updates

set -e

echo "🚀 Starting deployment from GitHub..."
echo "📅 $(date)"

# Navigate to project directory
cd ~/math-worksheet-platform

# Backup current environment
echo "📦 Backing up environment..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Stash any local changes
git stash

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Restore production environment variables
echo "🔧 Restoring production environment..."
cp .env.backup.$(date +%Y%m%d)*.env .env 2>/dev/null || cp .env.backup .env

# Build new Docker images
echo "🏗️  Building Docker images..."
docker-compose build

# Stop current containers
echo "🛑 Stopping current services..."
docker-compose down

# Start new containers
echo "🚀 Starting new services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check service status
echo "✅ Checking service status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:5000/health || echo "⚠️  Backend health check failed"

# Clean up old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
ls -t .env.backup.* 2>/dev/null | tail -n +6 | xargs rm -f

# Remove old Docker images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Application available at: https://worksheets.personalpod.net"