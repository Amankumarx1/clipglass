# COMPARISON.md: Three-Reference Architecture Analysis for ClipGlass Auto Clip

> **Document Purpose:** Systematic comparative analysis of the three architectural references (**Clips Kitty**, **SupoClip**, and **Lemo-Opuscar**) against **ClipGlass**. Evaluates pipeline designs, licensing constraints, strengths, weaknesses, ideas adopted (cleanly re-implemented from scratch), and ideas intentionally skipped.

---

## Executive Summary Matrix

| Metric / Dimension | Reference A: Clips Kitty | Reference B: SupoClip | Reference C: Lemo-Opuscar | ClipGlass (Target Build) |
|---|---|---|---|---|
| **Primary Repository** | `github.com/ColinGPT9/clips-studio` | `github.com/FujiwaraChoki/supoclip` | `github.com/lemomo-ai/lemo-opuscar` | `clipglass` (this repo) |
| **License** | **AGPL-3.0** (Viral Copyleft) | **Noncommercial Source License v1.1** | Code: **MIT** / Guides: **CC BY-NC 4.0** | **MIT / Permissive** |
| **Clean-Room Policy** | **Ideas only.** Zero copied code/prompts. | **Ideas only.** Zero copied code/prompts. | **MIT code reused with attribution.** Zero guide copying. | Strict clean-room implementation. |
| **Core Value** | Deep multimodal signal detection pipeline | Modern SaaS/web architecture & 4-subscore taxonomy | Code-generated visual polish & motion graphics | Fast, private, explainable, zero-install liquid-glass clipper |
| **Runtime Architecture** | Electron + React + Python FastAPI daemon | Next.js + FastAPI + ARQ + Redis + PostgreSQL + Docker | Headless Chrome + Node.js + Python audio + FFmpeg | Single FastAPI service + HTML/CSS/Tailwind UI (in-process queue) |
| **Privacy & Storage** | Local SQLite, persistent clip directories | Cloud PostgreSQL + S3 storage + user accounts | Local folder per film, manual cleanup | **Zero-install, private, 15-minute ephemeral sweeper** |
| **Virality Scoring** | Single 0-100 LLM score + signal timeline | 4 Sub-Scores (Hook, Engagement, Value, Shareability) | N/A (generative scripting, not clipping) | **4 Sub-scores + composite score + explainable evidence badges** |
| **Framing Engine** | YOLOv8-pose (AGPL) + OpenCV + TalkNet | Face detection + center crop | Canvas 2D / WebGL programmatic camera | **MediaPipe / OpenCV YuNet (Apache/BSD)** + Cut-vs-Pan rule |
| **Visual Polish** | Raw crop + ASS subtitles | Subtitles + opening hook title + Pexels B-roll | 99 code-driven graphic styles (Canvas/WebGL) | **Design-time pre-rendered Polish Pack with manifests** |
| **Editor** | Plain-language edit box ("5s longer") | Web timeline trimmer & split/merge | Code timeline scripts | **Interactive trimmer, waveform, & plain-language edit box** |

---

## 1. Reference A: Clips Kitty (`clips-studio`)

### 1.1 What It Does
Clips Kitty is a local-first AI clipping engine with an Electron desktop interface. It ingests long videos from YouTube, Twitch VODs, Kick, or local video files, identifies viral-worthy moments using an LLM combined with multimodal signal analysis, renders vertical 9:16 clips with speaker tracking, burns animated subtitles, and provides a desktop editing and review studio.

### 1.2 How It Works
- **Ingestion:** Uses `yt-dlp` to download source video and fetch metadata, chapters, and the YouTube heatmap (most-replayed curve).
- **Transcription:** Local `faster-whisper` (CPU int8 or CUDA) producing word-level timestamps.
- **Signal Extraction:** Generates 1-second normalized temporal bins across multiple modalities:
  - Audio loudness (RMS audio envelope).
  - Silence-to-burst transitions (sudden volume spikes after quiet periods).
  - Visual scene changes detected via FFmpeg scene filters.
  - Twitch chat replay density and hype score (Twitch streams only).
  - PANNs sound event classification (laughter, applause, screams, game sounds).
  - RapidOCR for on-screen text detection (gaming scoreboards, kill banners).
- **Scoring & Selection:**
  - Formats transcript lines with 1-second signal markers into an LLM prompt.
  - Windowed chunking with overlapping windows to prevent boundary loss.
  - Duplicate prevention: rejects clips if >40% timestamp overlap, >70% transcript similarity, or >40% segment reuse.
  - Sentence boundary snapping: start times snap back to sentence beginnings (`SENTENCE_REACH_SECONDS = 8.0`, `SENTENCE_PAUSE_SECONDS = 2.0`).
  - Head-to-head tournament reranking of top candidate clips.
- **Framing & Reframing:** Uses YOLOv8-pose (`yolov8n-pose.pt`) and OpenCV for speaker tracking. Implements a critical **Cut-vs-Pan Rule**: when the active speaker position jumps >25% of frame width, it executes a hard camera cut rather than a disorienting pan.
- **Editing & Operations:** Edits are stored non-destructively as operational commands. Features a plain-language edit box allowing requests such as *"make it 5 seconds longer"* or *"move start back"*.

### 1.3 Strengths
1. **Deepest Multimodal Signal Pipeline:** Signal fusion (loudness + burst + scene cuts + heatmap) dramatically outperforms text-only clipping.
2. **Deterministic Boundary Snapping:** Eliminates jarring cuts mid-word or mid-sentence by snapping to speech pause boundaries.
3. **Speaker Cut-vs-Pan Logic:** Avoids the motion sickness common in naive tracking algorithms.
4. **Natural Language Operation Parser:** Translates plain-English adjustments into deterministic editing operations.

### 1.4 Weaknesses
1. **Severe Licensing Risk (AGPL-3.0):** Clips Kitty is licensed under AGPL-3.0. No code, prompt templates, configuration schemas, or wording can be copied into ClipGlass.
2. **AGPL-3.0 Dependency Infection:** Clips Kitty relies on `ultralytics` (YOLOv8), which is also AGPL-3.0 and incompatible with permissive commercial distribution.
3. **Massive Dependency Footprint:** Requires gigabytes of deep-learning model weights (`pyannote`, `WeSpeaker`, `PANNs`, `RapidOCR`, `ultralytics`), leading to high memory overhead, complex CUDA setup, and slow initial startup.
4. **Desktop Monolith:** Built as an Electron + SQLite desktop app with channel scrapers and publisher bots, violating ClipGlass's zero-install, lightweight web philosophy.

### 1.5 Ideas We Adopt (Cleanly Re-implemented)
- **1-Second Normalized Temporal Signal Bins:** Normalized [0.0 - 1.0] arrays for loudness RMS, silence-to-burst transitions, scene cuts, chapter transitions, and YouTube heatmap intensity.
- **Multimodal Signal Fusion + LLM Timeline Prompting:** Feeding signal peak evidence alongside timestamped transcript lines into the scoring engine.
- **Deterministic Boundary Snapping:** Snapping clip starts and ends to sentence boundaries with configurable reach (up to 8s) and pause thresholds (2s).
- **Speaker Cut-vs-Pan Heuristic:** When speaker center coordinates jump >25% of frame width, snap immediately instead of smoothing.
- **Head-to-Head Finalist Reranking:** Tournament comparison among candidate clips to pick the top moments.
- **Plain-Language Edit Box:** Validated operation parser mapping phrases like *"extend end by 5 seconds"* or *"make it 10s longer"* to structured patch operations.
- **Editable Pre-Burn Captions:** Ability to adjust word text and timings in the UI prior to FFmpeg burning.

### 1.6 Ideas We Skip and Why
- **Skip `ultralytics` / YOLOv8:** Avoid AGPL-3.0 copyleft infection. Replaced with MediaPipe / OpenCV YuNet (Apache-2.0 / BSD-3-Clause).
- **Skip PANNs, RapidOCR, and pyannote:** Massive model weights (>4 GB) destroy the lightweight, zero-install architecture.
- **Skip SQLite State & Channel Watching Bots:** ClipGlass is an on-demand, privacy-first tool with an ephemeral 15-minute sweeper, not a 24/7 background scraper.

---

## 2. Reference B: SupoClip (`supoclip`)

### 2.1 What It Does
SupoClip is an open-source, AI-powered vertical video clipping platform and self-hostable SaaS. It processes long videos (podcasts, talks, stream VODs) into ready-to-post 9:16 vertical clips with face-centered framing, word-synced subtitles, opening hook titles, B-roll overlays, and direct platform publishing.

### 2.2 How It Works
- **Stack:** Built with a Next.js frontend, FastAPI backend, ARQ worker queue, Redis for task brokers, PostgreSQL database, and Docker Compose orchestration.
- **Transcription:** Primary support for AssemblyAI API with word timestamps; local Whisper as an alternative.
- **Virality Scoring Taxonomy:** Evaluates moments across **four explicit sub-scores (0-100)**:
  1. *Hook Score:* Ability to grab viewer attention in the first 3 seconds.
  2. *Engagement Score:* Emotional pacing, tension, and retention maintenance.
  3. *Value Score:* Density of insight, entertainment, or takeaway knowledge.
  4. *Shareability Score:* Relatability and impulse to forward to others.
- **Hook Title Burning:** AI writes a high-impact headline (max 10 words, 64 chars) that is burned into the top overlay of the clip for the opening 3–5 seconds.
- **Caption Presets:** Configurable typography and animation presets (Viral Pop, Minimalist, Cyberpunk, Karaoke) with custom font support.
- **Platform Presets:** Tailors exports for YouTube Shorts, Instagram Reels, and TikTok (resolution, aspect ratio, max duration limits).
- **Telemetry:** Real-time progress updates streamed to the browser via Server-Sent Events (SSE).

### 2.3 Strengths
1. **Explainable 4-Subscore Taxonomy:** Creators understand exactly *why* a clip was selected and where its strengths lie.
2. **Opening Hook Title:** Dramatically increases short-form video retention by setting instant context during the silent scrolling phase.
3. **Polished Caption Presets:** Visually appealing subtitle designs optimized for social feeds.
4. **Live SSE Streaming:** Keeps the user engaged with granular pipeline status updates.
5. **Platform Presets:** Prevents rejection by social platforms due to invalid dimensions or excessive duration.

### 2.4 Weaknesses
1. **Noncommercial Source License v1.1:** SupoClip's license prohibits commercial hosted or paid use without written permission. All code and prompts must be clean-room re-implemented.
2. **Heavy Multi-Service SaaS Footprint:** Requires PostgreSQL, Redis, ARQ workers, Next.js, and Docker Compose. Cannot run as a simple zero-install single-process Python application.
3. **Reliance on Third-Party Paid APIs:** Defaults to AssemblyAI and Pexels stock B-roll APIs, incurring external per-minute costs.
4. **SaaS Clutter:** Includes user authentication, team billing, social account OAuth, and platform analytics feedback loops that distract from core clipping quality.

### 2.5 Ideas We Adopt (Cleanly Re-implemented)
- **Four-Subscore Virality Framework:** Hook, Engagement, Value, and Shareability (each scored 0-100) alongside composite score.
- **Opening Hook Title Banner:** Burning an AI-generated headline into the top 20% of the vertical frame for the first 3.5 seconds.
- **Animated ASS Caption Presets:** Six distinct styles: *Viral Pop*, *Clean Minimalist*, *Neon Cyber*, *Karaoke Bounce*, *Impact Headline*, and *Dynamic Box*.
- **Platform Export Presets:** Quick targets for YouTube Shorts (60s cap), TikTok (60s cap), and Instagram Reels (90s cap).
- **Live SSE Event Stream:** Real-time stage progression (`queued` → `ingest` → `transcribe` → `signals` → `scoring` → `ready`) with percentage and ETA.
- **Clean REST API:** Streamlined endpoints for jobs, events, clips, patching, rendering, and downloading.

### 2.6 Ideas We Skip and Why
- **Skip PostgreSQL, Redis, Next.js, and Docker:** ClipGlass uses a single-service FastAPI backend with an in-memory job queue and an HTML/CSS/Tailwind liquid-glass UI.
- **Skip User Accounts, Stripe Billing, and Social OAuth:** ClipGlass requires zero signup and maintains zero persistent user data.
- **Skip AssemblyAI and Pexels B-Roll:** ClipGlass prioritizes zero-cost local execution (YouTube captions fast path, `faster-whisper`, and original footage).
- **Skip Platform Analytics Performance Loops:** Replaced with local, private thumbs up/down feedback stored in-memory or in job metadata.

---

## 3. Reference C: Lemo-Opuscar (`lemo-opuscar`)

### 3.1 What It Does
Lemo-Opuscar is an innovative Claude Code skill and film-making engine that creates films entirely in code. It contains no video generation models and uses no stock footage; instead, it renders HTML5 Canvas 2D and WebGL animations frame-by-frame via headless Chrome, synthesizes sound effects and sample-based musical scores, and mixes the final film using FFmpeg.

### 3.2 How It Works
- **Deterministic Rendering:** Each film is defined by an `index.html` exposing `window.DUR` (duration) and `window.render(t)` (a pure function of timestamp `t`).
- **Headless Chrome Capture:** `video.mjs` runs Puppeteer across multiple worker threads to capture frames at 24 or 30 fps.
- **Audio Synthesis:** `mix.py` coordinates speech TTS (`Kokoro` or `edge-tts`), sample library instruments (`freepats`, `salamander`), and procedural sound effects.
- **FFmpeg Muxing:** Combines audio stems and video frames with two-pass EBU R128 `loudnorm` (-14 LUFS).
- **Design Styles:** Catalogs 99 distinct film styles (e.g. *Caption News*, *Swiss Motion Graphics*, *Neon Tubes*, *Dark Tech Keynote*).

### 3.3 Strengths
1. **Flawless Programmatic Polish:** Creates vector-sharp typography, precise motion graphics, and distinctive visual aesthetics without AI video artifacts.
2. **Metadata-Driven Assets:** Cleanly separates visual rendering logic from asset manifests (`manifest.json` with duration, safe zones, and text regions).
3. **MIT Code License:** Core rendering and audio code is permissively licensed under MIT.

### 3.4 Weaknesses
1. **Prohibitive Runtime Latency:** Frame-by-frame Puppeteer rendering takes 30–60 minutes per minute of video and consumes extensive CPU/GPU resources—completely unusable for real-time video clipping jobs.
2. **Not a Clipping Tool:** It is a film generation framework, with no video ingestion, speech recognition, signal analysis, or virality scoring pipelines.
3. **CC BY-NC 4.0 Guides:** The written guides (`DIRECTOR.md`, `STYLE.md`) are licensed under CC BY-NC 4.0 and cannot be copied or paraphrased.

### 3.5 Ideas We Adopt
- **Design-Time Pre-Rendered Polish Pack:** Rather than rendering during clip export, high-aesthetic motion graphic assets (intro/outro stings, hook title cards, looping backgrounds) are created at design time at 1080x1920.
- **Asset Manifest System (`manifest.json`):** Every polish asset includes a manifest specifying name, duration, safe zones, text overlay areas, and keying method (`colorkey`, `overlay`, or `bumper`).
- **FFmpeg Colorkey / Overlay Pipeline:** `clip_render_service.py` efficiently composites pre-rendered polish assets onto 9:16 clips using hardware-accelerated FFmpeg filters in a fraction of a second.
- **Candidate Visual Styles:** *Caption News*, *Swiss Motion Graphics*, *Neon Tubes*, and *Dark Tech Keynote*.

### 3.6 Ideas We Skip and Why
- **Skip Runtime Puppeteer Frame-by-Frame Rendering:** Would introduce severe latency and require Node.js + browser binaries in the backend server.
- **Skip Synthetic Audio Scoring & TTS Narration:** Clips already possess original speaker dialogue and music; adding synthetic music would clash with source audio.
- **Skip Guide/Prompt Paraphrasing:** Adhere strictly to CC BY-NC 4.0 boundaries; only code is reused under MIT attribution.

---

## 4. Synthesis: Where ClipGlass Wins

By combining the best architectural concepts of the three references while discarding their weaknesses, ClipGlass establishes clear competitive advantages:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIPGLASS WINNING ADVANTAGES                              │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. Zero-Install & Private│ 2. Ultra-Fast Ingestion     │ 3. Deep Explainability        │
│ • No account required    │ • YouTube captions fast path│ • 4 Sub-Scores (0-100)        │
│ • No database dependency │ • Heatmap curve extraction  │ • Evidence badges             │
│ • 15-min ephemeral sweep │ • CPU int8 / CUDA Whisper   │ • "Why this moment" popovers  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 4. Superior Selection    │ 5. Signature Aesthetics     │ 6. Lightweight Architecture   │
│ • 5-modality signal bins │ • Liquid-glass dark/light UI│ • Single FastAPI service      │
│ • Sentence snapping (8s) │ • 3D tilt cards & waveform  │ • In-process async job queue  │
│ • LLM tournament rerank  │ • Pre-rendered polish pack  │ • Clean Redis-swappable API   │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

1. **Zero-Install, Private, and Clean:** Unlike SupoClip (Postgres/Redis/Docker) and Clips Kitty (SQLite/channel scrapers), ClipGlass requires zero setup. A 15-minute background sweeper permanently purges all downloaded media, transcripts, and rendered clips.
2. **Fast-Path Ingest & SSE Streaming:** If YouTube captions and heatmaps exist, clips are identified within seconds without waiting for Whisper. Clip cards stream to the browser via SSE the instant they are discovered and rendered.
3. **Complete Explainability:** Users never guess why an AI picked a segment. Every card displays composite score, Hook, Engagement, Value, and Shareability bars, along with evidence tags (*Heatmap Peak*, *Audio Burst*, *Scene Cut*, *Key Quote*).
4. **Multimodal Selection Accuracy:** Clips Kitty's signal fusion + sentence snapping + tournament reranking ensures speech begins and ends on clean sentence boundaries, avoiding fragmented clips.
5. **Distinctive Visual Polish:** Lemo-Opuscar-inspired pre-rendered graphic stings and hook banners deliver high production value without runtime rendering overhead.
6. **Unified Lightweight Stack:** Pure Python 3.12/3.13 FastAPI backend with an HTML5/CSS3/Tailwind liquid-glass frontend. Zero React build steps, zero Docker requirements.
