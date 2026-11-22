# PLAN.md: ClipGlass Auto Clip Architecture & Implementation Plan

> **Goal:** Deliver a high-performance, explainable, zero-install "Auto Clip" system for ClipGlass. Users paste a YouTube URL (or import media), and the system generates ranked 9:16 vertical clips with word-synced animated captions, opening hook titles, hashtags, and evidence-backed virality scores.
>
> Combines the best design principles of three open-source references (**Clips Kitty**, **SupoClip**, and **Lemo-Opuscar**) using clean-room re-implementation, while outperforming them in privacy, speed, explainability, and single-process simplicity.

---

## 1. System Architecture & End-to-End Pipeline

The Auto Clip pipeline runs asynchronously as a background task inside FastAPI, communicating via Server-Sent Events (SSE), strictly enforcing a 15-minute ephemeral lifecycle, and maintaining zero permanent database storage.

```
                  ┌───────────────────────────────────────────┐
                  │          YouTube URL / PC Media           │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: INGEST (clip_ingest_service.py)                                                  │
│ • yt-dlp metadata inspection (duration cap: 60 minutes)                                   │
│ • Download up to 1080p H.264 video + AAC audio                                            │
│ • Extract official YouTube captions, chapter markers, and most-replayed heatmap data       │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: TRANSCRIBE (transcription_service.py)                                            │
│ • Fast Path: If YouTube official/auto-captions exist, parse word timings immediately     │
│ • Fallback Path: faster-whisper (CPU int8 / CUDA) with word-level timestamps              │
│ • Per-job transcript caching with deduplication                                           │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: MULTIMODAL SIGNALS (signal_analysis_service.py)                                  │
│ • 1-second normalized temporal bins [0.0 - 1.0]:                                          │
│   - Loudness spikes (RMS audio envelope)                                                  │
│   - Silence-to-burst transitions (sudden volume spikes after quieter baseline)             │
│   - Visual scene changes (FFmpeg scene detection threshold > 0.35)                        │
│   - Chapter boundaries (thematic topic transitions)                                       │
│   - YouTube heatmap intensity (community audience retention curve)                        │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: SCORING & SELECTION (clip_scoring_service.py)                                     │
│ • Provider-agnostic LLM interface (Anthropic API, OpenRouter, local Ollama)               │
│ • Strict JSON output schema: {start, end, score, hook_score, engagement_score,            │
│   value_score, shareability_score, hook_title, hashtags, reason, evidence[]}              │
│ • Sentence boundary snapping: reach up to 8.0s, pause threshold 2.0s                      │
│ • Tournament head-to-head reranking of top candidate finalists                            │
│ • Heuristic Fallback Scorer: composite signal weighting when no LLM key is configured     │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: 9:16 REFRAME & SPEAKER TRACKING (face_tracking_service.py)                       │
│ • MediaPipe / OpenCV YuNet face detection (Apache-2.0 / BSD-3-Clause)                      │
│ • Framing modes: center, follow-face (EMA smoothed), split-screen                         │
│ • Cut-vs-Pan Rule: instantaneous cut when speaker shifts >25% of frame width              │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: WORD-SYNCED CAPTIONS & HOOK TITLE (ass_caption_service.py)                       │
│ • Word-synced ASS (Advanced SubStation Alpha) subtitle generation                         │
│ • 6 Animated style presets: Viral Pop, Clean Minimalist, Neon Cyber, Karaoke Bounce,      │
│   Impact Headline, Dynamic Box                                                            │
│ • Opening hook title banner burned into top 20% of frame for first 3.5 seconds            │
│ • Interactive pre-burn editing drawer in UI                                               │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: DESIGN POLISH PACK (clip_render_service.py)                                      │
│ • Design-time pre-rendered assets: intro/outro stings, animated hook cards, backgrounds   │
│ • Asset manifests (`manifest.json`) defining safe zones, durations, and keying modes     │
│ • Fast FFmpeg overlay / colorkey composition                                              │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 8: EXPORT & BUNDLING (clip_render_service.py)                                       │
│ • Hardware encoder auto-detection (NVENC, QSV, VAAPI) with CPU libx264 fallback           │
│ • 1080x1920 MP4 video + companion .srt + metadata.json                                    │
│ • Platform export presets: YouTube Shorts (60s), TikTok (60s), Instagram Reels (90s)       │
│ • Single-click all-clips ZIP bundle export                                                │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Licensing Decisions & Clean-Room Boundaries

| Dependency / Reference | License | Clean-Room Implementation & Safety Policy |
|---|---|---|
| **Clips Kitty** (`ColinGPT9/clips-studio`) | **AGPL-3.0** | **Design reference only.** Zero copied code, zero prompt files, zero config schemas. Clean-room re-implementation of 1s signal bins, sentence boundary snapping, cut-vs-pan heuristic, and plain-language edit operation parsing. |
| **Object / Face Detection** | **Strict NO to YOLOv8** (`ultralytics` is AGPL-3.0) | **Permissive replacement:** Use **MediaPipe** (Apache-2.0) and **OpenCV YuNet** (`face_detection_yunet`, BSD-3-Clause) for face detection and tracking. Completely compliant with commercial and permissive distribution. |
| **SupoClip** (`FujiwaraChoki/supoclip`) | **Noncommercial Source License v1.1** | **Design reference only.** Zero copied code, zero prompt text. Re-implement the 4-subscore taxonomy, hook title banner, animated caption presets, and SSE streaming natively in Python/FastAPI. |
| **Lemo-Opuscar** (`lemomo-ai/lemo-opuscar`) | Code: **MIT**<br>Guides: **CC BY-NC 4.0** | **Design-time asset reference only.** Visual assets (intro stings, bumpers, looping 9:16 backgrounds) are pre-rendered at design time at 1080x1920 and bundled with manifests. MIT code attribution recorded in `THIRD_PARTY.md`. Zero copying of CC BY-NC guide text. |
| **faster-whisper / CTranslate2** | **MIT** | Permissive local speech recognition with CPU int8 quantization and optional CUDA. |
| **FFmpeg / yt-dlp** | **LGPL / Unlicense** | Permissive CLI invocation via sanitized subprocesses without static linking. |
| **Optional Clips Kitty Local Adapter** | **Loopback HTTP** | Off by default. Communicates strictly over loopback HTTP to a user-run engine at `127.0.0.1:8765` without embedding AGPL code. |

---

## 3. Detailed File List & Module Organization

### 3.1 Backend Modules (`apps/api/`)
```
apps/api/
├── app/
│   ├── config.py                   # Extended settings (CLIP_DURATION_CAP, WHISPER_MODEL, LLM API keys)
│   └── main.py                     # FastAPI app with sweeper startup, CORS, and router registrations
├── schemas/
│   ├── clip.py                     # ClipJobCreateRequest, ClipMoment, MultimodalSignals, 4-Subscores,
│   │                               # EditBoxCommandRequest, FeedbackRequest, PlatformPreset
│   └── (existing schemas preserved: inspect.py, jobs.py, explainer.py)
├── services/
│   ├── clip_ingest_service.py      # yt-dlp ingestion, duration cap check, captions and heatmap parser
│   ├── transcription_service.py    # YouTube caption fast path + faster-whisper fallback with cache
│   ├── signal_analysis_service.py  # 1s temporal bins: RMS loudness, silence-burst, scene cuts, heatmap
│   ├── clip_scoring_service.py     # LLM provider interface (Anthropic/OpenRouter/Ollama), strict JSON,
│   │                               # sentence boundary snapping, tournament reranker, heuristic fallback
│   ├── face_tracking_service.py    # MediaPipe/OpenCV YuNet face tracker, EMA smoothing, Cut-vs-Pan logic
│   ├── ass_caption_service.py      # Word-synced ASS subtitle compiler with 6 animation styles & hook title
│   ├── clip_render_service.py      # FFmpeg 9:16 render, ASS burning, polish overlay, NVENC/CPU encoder
│   ├── clip_queue_service.py       # In-process job queue, 1-job/IP limiter, SSE listener broadcasting
│   ├── edit_box_service.py         # Plain-language edit parser ("make it 5s longer" -> validated ops)
│   ├── polish_pack_service.py      # Manifest loader & FFmpeg colorkey/overlay filter chain generator
│   └── sweeper_service.py          # 15-minute ephemeral job directory cleaner
├── routers/
│   ├── clip.py                     # Endpoints: POST /jobs, GET /events, GET /clips, PATCH /clips/{cid},
│   │                               # POST /render, GET /download, POST /feedback, GET /export-all
│   └── (existing routers preserved: health.py, inspect.py, jobs.py, web_pages.py)
├── static/
│   └── polish_pack/                # Pre-rendered 1080x1920 design-time assets & manifest.json files
└── tests/
    ├── test_clip_signals.py        # Signal binning, normalization, and heatmap extraction
    ├── test_clip_scoring.py        # Sentence boundary snapping, LLM JSON validation, 4 sub-scores
    ├── test_ass_captions.py        # ASS generator, karaoke tags, and hook title banners
    ├── test_edit_box.py            # Natural language command parser and operation validation
    ├── test_face_tracking.py       # OpenCV YuNet/MediaPipe tracking and cut-vs-pan snapping
    ├── test_clip_security.py       # SSRF prevention, rate limiting, and 15-min sweeper purge
    └── test_clip_pipeline_e2e.py   # Synthetic video end-to-end integration test
```

### 3.2 Frontend & UI Templates (`apps/api/`)
```
apps/api/
├── templates/
│   ├── auto_clip.html              # Auto Clip screen: URL input, consent check, option controls,
│   │                               # live stage timeline, streaming clip cards, sub-score bars,
│   │                               # "why this moment" popovers, inline preview, lightbox modal, edit box
│   └── recent.html                 # Session history drawer backed by localStorage/sessionStorage
└── static/
    ├── js/app.js                   # Client controller: SSE listener, card streaming, edit-box dispatcher,
    │                               # preview audio/video sync, thumbs up/down feedback handler
    └── css/style.css               # Liquid-glass design tokens, 3D tilt effects, dark/light themes
```

---

## 4. Key Engineering Implementations

### 4.1 Sub-Score Taxonomy & Explainability
Every candidate moment produces:
- **Composite Score (0-100):** Weighted combination of signals and virality sub-scores.
- **Hook Score (0-100):** Strength of opening 3 seconds in arresting scroll.
- **Engagement Score (0-100):** Dynamic speech pacing, audio energy, and tension.
- **Value Score (0-100):** Informational or entertainment takeaway density.
- **Shareability Score (0-100):** Relatability and impulse to share.
- **Evidence Tags:** Specific multimodal justification (e.g. `Heatmap Peak at 01:24`, `Audio Energy Spike +14dB`, `Scene Cut Transition`, `Key Quotable Hook`).
- **"Why This Moment":** A concise, one-sentence plain-English justification for the creator.

### 4.2 Plain-Language Edit Box
The edit box translates creator commands into safe, non-destructive operations:
- *"Make it 5 seconds longer"* ➔ `{op: "extend_end", delta: 5.0}`
- *"Start 3 seconds earlier"* ➔ `{op: "extend_start", delta: -3.0}`
- *"Switch caption style to Neon Cyber"* ➔ `{op: "set_caption_preset", preset: "neon_cyber"}`
- *"Change reframe to split screen"* ➔ `{op: "set_reframe_mode", mode: "split"}`
- Commands are strictly validated against duration caps and never generate raw shell strings.

### 4.3 Polish Pack Integration (Design Time Only)
Visual styles (*Caption News*, *Swiss Motion Graphics*, *Neon Tubes*, *Dark Tech Keynote*) are pre-rendered at design time as 1080x1920 video assets. Each style directory contains:
- `manifest.json`: Defines asset type (`intro_sting`, `outro_sting`, `hook_card`, `looping_background`), duration, safe zones, text bounding boxes, and FFmpeg keying parameters (`colorkey=0x00FF00:0.3:0.1`).
- Clean FFmpeg filter graph application without requiring a headless browser at runtime.

### 4.4 Hardware-Accelerated Export
- `get_best_h264_encoder()` dynamically probes for NVIDIA NVENC (`h264_nvenc`), Intel QuickSync (`h264_qsv`), and AMD AMF (`h264_amf`), with automatic graceful fallback to CPU `libx264`.
- Produces optimized MP4 containers (`-movflags +faststart`) for instant streaming playback.

---

## 5. Security, Privacy & Rate-Limiting Guarantees

1. **Mandatory Rights Confirmation:** `consent: true` required on `POST /api/clip/jobs`.
2. **SSRF Guardrails:** URL parser restricts inputs strictly to valid YouTube domains (`youtube.com`, `youtu.be`); blocks local hostnames, private IPs, loopback, and cloud metadata endpoints.
3. **In-Memory Rate Limiting:** 1 active job per client IP; job requests exceeding concurrency limits enter a FIFO queue or receive HTTP 429.
4. **15-Minute Ephemeral Sweeper:** Background sweeper thread deletes all downloaded media, transcripts, ASS subtitle files, and rendered MP4s 15 minutes after creation. Zero persistent server storage.
5. **No Shell Injection:** All FFmpeg and yt-dlp calls use list-based arguments with `shell=False`, sanitized filenames, and strict process timeouts.

---

## 6. Evaluation Harness (`EVAL.md` & Script)

An evaluation script (`apps/api/tests/eval_harness.py`) and protocol (`EVAL.md`) will benchmark 5 representative test video categories:
1. Podcast / Two-Speaker Discussion
2. Single-Subject Interview / Monologue
3. Gaming Stream VOD
4. Lecture / Technical Presentation
5. Fast-Paced Vlog

**Metrics Scored (1 to 5 scale):**
- Hook Strength (0-3s retention viability)
- Boundary Cleanliness (sentence start/end precision)
- Framing Accuracy (speaker centered, no cut-off faces)
- Caption Sync (word timestamp alignment)
- Time-to-First-Clip (seconds from ingest to rendered card)
- Job Failure Rate (%)

---

## 7. Delivery Plan & Verification Checkpoints

- **Phase 0:** Complete comparative analysis (`COMPARISON.md`). *(Done)*
- **Phase 1:** Architectural plan (`PLAN.md`) and license inventory (`THIRD_PARTY.md`). *(Done - Awaiting User Approval)*
- **Phase 2:** Implementation in modular steps:
  - Step 1: Extended schemas & plain-language edit operation validator.
  - Step 2: Signal fusion & LLM 4-subscore scoring engine with heuristic fallback.
  - Step 3: Face tracking with MediaPipe/OpenCV YuNet & cut-vs-pan heuristic.
  - Step 4: ASS caption compiler with 6 styles & hook title banners.
  - Step 5: Polish pack asset manifests & FFmpeg overlay integration.
  - Step 6: REST API extensions (feedback, edit box, export presets).
  - Step 7: Frontend liquid-glass UI enhancements (evidence badges, edit box, sub-score bars).
  - Step 8: Comprehensive test suite & evaluation harness (`EVAL.md`).
