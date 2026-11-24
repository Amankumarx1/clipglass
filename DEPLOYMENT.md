# 🚀 ClipGlass Production Deployment & Hosting Guide

ClipGlass is a pure Python + HTML + CSS + Tailwind media processing workspace designed for high-concurrency, zero-data-retention, and seamless deployment on any cloud provider, virtual private server (VPS), or bare-metal machine.

---

## 📋 System Requirements

| Resource | Minimum | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **CPU** | 1 vCPU | 2–4 vCPU | Media transcoding (FFmpeg) scales with core count |
| **RAM** | 1 GB | 2–4 GB | In-memory processing & concurrent jobs |
| **Disk** | 10 GB SSD | 25+ GB NVMe | Ephemeral storage automatically pruned after 15m |
| **OS** | Linux / Windows / macOS | Ubuntu 22.04 / 24.04 LTS | Debian / Alpine container compatible |
| **Dependencies** | Python 3.10+ or Docker | Docker & Docker Compose | FFmpeg included in Docker image |

---

## ⚡ Option 1: One-Click Docker Deployment with Automatic HTTPS (Recommended)

This setup uses **Caddy** to automatically obtain and renew free Let's Encrypt / ZeroSSL HTTPS certificates, handle HTTP/2 & HTTP/3, and reverse-proxy to the ClipGlass multi-worker backend.

### 1. Clone & Enter Directory
```bash
git clone <your-repo-url> clipglass
cd clipglass
```

### 2. Configure Environment
```bash
cp .env.production.example .env
```
Edit `.env` and configure your domain and email:
```env
DOMAIN=clipglass.yourdomain.com
ACME_EMAIL=admin@yourdomain.com
ALLOWED_ORIGINS=https://clipglass.yourdomain.com
WORKERS=4
```

### 3. Launch with Automated Script
On Linux / macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually with Docker Compose:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify Status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
curl -f https://clipglass.yourdomain.com/healthz
```

---

## 🐧 Option 2: Bare-Metal Linux VPS Deployment (Systemd + Nginx)

If you prefer running directly on a Linux host without Docker:

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv ffmpeg nginx certbot python3-certbot-nginx
```

### 2. Setup Application Directory
```bash
sudo mkdir -p /var/www/clipglass
sudo chown -R $USER:$USER /var/www/clipglass
cp -r clipglass/* /var/www/clipglass/
cd /var/www/clipglass/apps/api

# Create virtual environment and install requirements
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
```

### 3. Create Systemd Service
Create `/etc/systemd/system/clipglass.service`:
```ini
[Unit]
Description=ClipGlass Media Engine
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/clipglass/apps/api
Environment="PATH=/var/www/clipglass/apps/api/venv/bin:/usr/bin"
Environment="PYTHONPATH=/var/www/clipglass/apps/api"
Environment="ENVIRONMENT=production"
Environment="TEMP_STORAGE_DIR=/tmp/clipglass_downloads"
ExecStart=/var/www/clipglass/apps/api/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4 --proxy-headers --forwarded-allow-ips "*"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo mkdir -p /tmp/clipglass_downloads
sudo chown -R www-data:www-data /tmp/clipglass_downloads
sudo systemctl daemon-reload
sudo systemctl enable --now clipglass
```

### 4. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/clipglass`:
```nginx
server {
    server_name clipglass.yourdomain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for Server-Sent Events (SSE) progress streams
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
```

Enable site and request SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/clipglass /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d clipglass.yourdomain.com
```

---

## ☁️ Option 3: Cloud PaaS (Railway, Render, Fly.io)

### Railway
1. Click **New Project** → **Deploy from GitHub repo**.
2. Railway detects `clipglass/docker/Dockerfile.api` automatically.
3. Under **Variables**, add:
   - `ENVIRONMENT=production`
   - `PORT=8000`
   - `TEMP_STORAGE_DIR=/tmp/clipglass_downloads`
4. Set health check path to `/healthz`.

### Render
1. Create a **Web Service** from your repository.
2. Select **Docker** environment (pointing to `clipglass/docker/Dockerfile.api`).
3. Set Disk mount at `/tmp/clipglass_downloads` (Optional, 10 GB ephemeral).
4. Set Health Check Path to `/healthz`.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | Set to `production` for strict HSTS, caching, and security headers |
| `PORT` | `8000` | Port for the HTTP application server |
| `WORKERS` | `2` | Number of Uvicorn worker processes (recommend: `2 * vCPU`) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed CORS domains |
| `MAX_DURATION_SECONDS` | `10800` (3 hours) | Maximum allowed media source length |
| `MAX_FILE_SIZE_BYTES` | `2147483648` (2 GB) | Hard ceiling on single-job output size |
| `FILE_TTL_SECONDS` | `900` (15 mins) | Ephemeral file lifetime before background sweeper deletion |
| `RATE_LIMIT_INSPECT_PER_MINUTE` | `10` | Maximum metadata inspect calls per minute per IP |
| `RATE_LIMIT_JOBS_PER_10_MINUTES` | `5` | Maximum job downloads per 10 minutes per IP |
| `USE_REDIS` | `false` | Enable distributed Redis queue for multi-node worker clusters |
| `REDIS_URL` | `redis://localhost:6379/0` | Connection string for Redis |
| `YOUTUBE_PROXY` | `""` | Optional HTTP/SOCKS5 proxy for YouTube extraction |
| `YOUTUBE_COOKIES_FILE` | `""` | Optional path to Netscape cookies.txt |
| `TURNSTILE_ENABLED` | `false` | Enable Cloudflare Turnstile anti-bot verification |
| `TURNSTILE_SECRET_KEY` | `""` | Cloudflare Turnstile private secret key |

---

## 🛡️ Security & Privacy Guarantees

1. **Zero User Accounts & Ephemeral Storage**: Files and jobs expire and are permanently purged after 15 minutes (`FILE_TTL_SECONDS`). No user accounts, passwords, or tracking cookies exist.
2. **Reverse Proxy & Cloudflare IP Safety**: Client IP resolution securely parses `CF-Connecting-IP`, `X-Forwarded-For`, and `X-Real-IP`, preventing IP collisions under load balancers.
3. **Strict SSRF & Injection Defense**: Hostnames are restricted strictly to official YouTube domains, userinfo (`@`) tricks are blocked, private/cloud-metadata IPs are resolved and rejected, and video IDs are sanitized against regex `^[a-zA-Z0-9_-]{11}$`.
4. **Sandboxed File Paths**: Path traversal attacks (`../`) are blocked with `os.path.commonpath` verification against the storage root.
5. **Hardened HTTP Headers**: Strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and Server banner suppression are enabled by default.
