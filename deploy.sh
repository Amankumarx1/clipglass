#!/usr/bin/env bash
# ==============================================================================
# ClipGlass Production Deployment Script (Linux / macOS / VPS)
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "          CLIPGLASS PRODUCTION DEPLOYMENT WIZARD                  "
echo "=================================================================="

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and Docker Compose."
    echo "   Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check Docker Compose (plugin or standalone)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Initialize .env file if missing
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.production.example..."
    cp .env.production.example .env
    echo "⚠️  Please configure your DOMAIN and settings in .env if needed."
fi

echo "🚀 Building and starting ClipGlass containers..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d --build

echo ""
echo "=================================================================="
echo "  ✓ ClipGlass production containers deployed successfully!        "
echo "  👉 Inspect status:  $DOCKER_COMPOSE -f docker-compose.prod.yml ps"
echo "  👉 View live logs:  $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
echo "  👉 Health check:    curl http://localhost:8000/healthz"
echo "=================================================================="
