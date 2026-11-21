# ClipGlass 🪟✨
**Liquid Glass YouTube Media Extraction & Processing Engine**  
*Built for Aman Kumar*

ClipGlass is a fast, clean, and ephemeral web application where users paste a YouTube link, inspect video metadata, pick an exact video or audio quality, and download the processed file.

The user interface matches the Apple-style **liquid glass** design language: thick translucent frosted glass surfaces, bright specular edges, iridescent conic-gradient rim refractions, soft diffused shadows, fluid springs, and glowing pill components.

---

## 🎨 Liquid Glass Design System
The UI implements the exact materials, component shapes, and color tokens from the reference design:
- **Canvas**: `#E9ECF3` with soft radial ambient blobs (lavender `#E4E1F7` top-left, ice blue `#DDEBFA` bottom-right). Dark mode `#0B0E1A`.
- **Primary Action (Download Video)**: Red-orange pill gradient (`#FF5A3C` to `#E8301F` to `#FF9A3C`) with glossy specular highlight and colored glow shadow.
- **Info Action (Fetch)**: Blue pill gradient (`#2F6BFF` to `#2AA8FF` to `#5CE1FF`).
- **Audio Action (Extract Audio)**: Purple pill gradient (`#7C4DFF` to `#B36BFF`).
- **Liquid Search Bar**: Clear glass pill with link icon, URL input, Paste action button, and a dynamic check circle indicator (grey outline idle, blue checkmark valid, red warning on invalid).
- **Text Fields**: Includes chevron dropdown variant and sparkle action variant (auto-fills clean title).
- **Icon Switches**: Star (embed thumbnail/cover art), Plus (subtitles), and Sliders (embed metadata tags).
- **Design Showcase Page**: Available at [`/design`](http://localhost:3000/design) to inspect every component in every state on the glass canvas.

---

## 📋 Sensible Defaults Recorded (Section 1)
Where requirements permitted discretion, sensible defaults were selected and recorded:
1. **Video Height**: Defaults to `1080p` (or the highest standard resolution offered by the video if below 1080p).
2. **Video Container**: Defaults to `MP4` for maximum universal playback across Apple, Android, Windows, and web players; `WebM` recommended for 1440p and 4K streams.
3. **Audio Quality**: Defaults to `Original (Opus/M4A)` as recommended choice with a helpful explanation that YouTube streams audio at 128–160 kbps, and `MP3 320 kbps` for legacy MP3 player compatibility.
4. **File Retention TTL**: Strictly **15 minutes** (`900` seconds). The automated background sweeper unlinks and deletes all downloaded files after 15 minutes.
5. **Limits**: 3 hours maximum duration, 2 GB maximum file size cap per job.
6. **Rate Limiting**: 10 inspect queries per minute per IP; 5 download jobs per 10 minutes per IP.
7. **Worker Queue**: Operates in dual mode:
   - **In-Memory Async Queue** (default): Zero external database requirement; ultra-fast for local development, single VPS, or container setups.
   - **Redis / RQ Worker**: Configurable via `USE_REDIS=true` for horizontally scaled multi-worker deployments.

---

## 🗺️ Roadmap (Out of Scope for MVP)
- [ ] Playlist and batch URL processing
- [ ] Timeline trimming and timestamp-based clipping (e.g. `00:15 - 02:40`)
- [ ] Optional user accounts and persistent download history
- [ ] Multi-platform support (SoundCloud, Vimeo, Twitter/X, TikTok)
- [ ] Browser extension for one-click downloading from YouTube tabs

---

## ⚡ Quickstart: Run Everything with a Single Command

From the `clipglass` root folder, you can run any of these single commands to start both the **FastAPI backend** and **Next.js frontend** simultaneously and auto-launch your browser:

### Using Python:
```bash
python start.py
```

### Using npm:
```bash
npm run dev
# or
npm start
```

### Using Double-Click / Batch Script (Windows):
```cmd
run.bat
```

### Using PowerShell:
```powershell
.\run.ps1
```

### Using Docker:
```bash
docker compose up --build
```

---

## 🏗️ Repository Architecture
```
clipglass/
├── apps/
│   ├── web/                     # Next.js 14 App Router, Tailwind CSS, Framer Motion
│   │   ├── app/                 # Routes: /, /design, /terms, /privacy, /copyright, /faq
│   │   ├── components/          # Glass components matching reference specification
│   │   │   └── ui/              # GlassButton, GlassCard, GlassChips, GlassTabs, etc.
│   │   ├── lib/                 # Validation schemas, Zustand store, API client
│   │   └── tests/               # Vitest unit tests & Playwright E2E configuration
│   └── api/                     # FastAPI backend (Python 3.12+)
│       ├── app/                 # Main application, config, CORS, security headers
│       ├── routers/             # /inspect, /jobs, /healthz endpoints
│       ├── services/            # yt-dlp service, queue manager, cleanup sweeper
│       ├── schemas/             # Pydantic schemas and friendly error definitions
│       ├── workers/             # Distributed worker daemon
│       └── tests/               # Pytest suite (SSRF, allowlist, validation, consent)
├── docker/                      # Production Dockerfiles (API with ffmpeg, Worker, Web)
├── docker-compose.yml           # One-command full-stack container orchestration
├── .env.example                 # Environment configuration reference
└── README.md                    # Documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **Python** 3.10+ (tested on Python 3.13)
- **ffmpeg** installed and available in system `PATH`

### 1. Start the FastAPI Backend
```bash
cd clipglass/apps/api

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start API server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
API docs available at: `http://localhost:8000/docs`  
Health check: `http://localhost:8000/healthz`

### 2. Start the Next.js Frontend
```bash
cd clipglass/apps/web

# Install npm dependencies
npm install

# Start Next.js development server on port 3000
npm run dev
```
Open **http://localhost:3000** in your browser.  
Design system showcase: **http://localhost:3000/design**

---

## 🧪 Running Tests

### Backend Unit Tests (Pytest)
```bash
cd clipglass/apps/api
pytest
```
*Validates URL hostname allowlist, SSRF protection, friendly error mapping, and legal consent enforcement.*

### Frontend Unit Tests (Vitest)
```bash
cd clipglass/apps/web
npm run test
```
*Tests client-side URL validation, duration formatting, and byte size calculation.*

### Playwright End-to-End Tests
```bash
cd clipglass/apps/web
npx playwright test
```
*Tests responsive viewports (iPhone SE, iPhone 15 Pro Max, Pixel 7, iPad, 4K Desktop) and verifies zero horizontal overflow.*

---

## 🐳 Docker Deployment
To launch the complete production stack (Web + API with ffmpeg + Redis) with a single command:
```bash
docker compose up --build
```
- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Redis: `localhost:6379`

---

## 🛡️ Security & Responsible Use
- **Hostname Allowlist**: Only `youtube.com`, `m.youtube.com`, `music.youtube.com`, and `youtu.be` are accepted. All external IP addresses and domains are blocked upfront, preventing SSRF and open-proxy abuse.
- **Command Injection Prevention**: yt-dlp is executed strictly via Python library API calls with argument arrays; shell strings are never evaluated.
- **Legal Consent Gate**: Every download requires the user to explicitly certify copyright ownership or reuse permission. Requests without consent are rejected with HTTP 400.
- **Zero Retention**: All processed media files are automatically removed after 15 minutes by the background sweeper.

