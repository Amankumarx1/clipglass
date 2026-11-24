# ==============================================================================
# ClipGlass Production Deployment Script (Windows PowerShell)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "          CLIPGLASS PRODUCTION DEPLOYMENT WIZARD                  " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Check Docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "❌ Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "   Please install Docker Desktop for Windows."
    exit 1
}

# Initialize .env file if missing
if (-not (Test-Path ".env")) {
    Write-Host "📄 Creating .env from .env.production.example..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env"
    Write-Host "⚠️  Please configure your DOMAIN and settings in .env if needed." -ForegroundColor Yellow
}

Write-Host "🚀 Building and starting ClipGlass containers..." -ForegroundColor Green
docker compose -f docker-compose.prod.yml up -d --build

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  ✓ ClipGlass production containers deployed successfully!        " -ForegroundColor Green
Write-Host "  👉 Inspect status:  docker compose -f docker-compose.prod.yml ps"
Write-Host "  👉 View live logs:  docker compose -f docker-compose.prod.yml logs -f"
Write-Host "  👉 Health check:    curl http://localhost:8000/healthz"
Write-Host "==================================================================" -ForegroundColor Cyan
