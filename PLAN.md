# PLAN.md: ClipGlass Auto Clip Architecture & Implementation Plan

> **Feature Goal:** Add an "Auto Clip" system to ClipGlass that ingests a YouTube URL, analyzes transcripts and multimodal signals, scores viral moments with an LLM (with heuristic fallback), reframes to 9:16 using face tracking, burns word-synced animated ASS captions, polishes with design-time visual assets, and exports ready-to-post vertical clips with metadata and ZIP packaging.

---

## 1. System Architecture & Pipeline Design

The Auto Clip pipeline runs asynchronously as a background task managed by FastAPI with real-time SSE telemetry, strict duration caps, in-memory queue management, and automatic 15-minute ephemeral file deletion.

```
YouTube URL
    │
    ▼
[Stage 1: Ingest] ───────► yt-dlp metadata first (dur <= 60m)
    │                      Download 1080p H.264 + audio; extract chapters & heatmap
    ▼
[Stage 2: Transcribe] ───► Fast Path: YouTube official / auto-captions with word alignment
    │                      Fallback: faster-whisper (CPU int8 / CUDA, cached per job)
    ▼
[Stage 3: Signals] ──────► 1-second bins normalized [0.0 - 1.0]:
    │                      - Loudness spikes (EBU R128 / RMS audio envelope)
    │                      - Silence-to-burst transitions (dramatic audio shifts)
    │                      - Scene changes (FFmpeg scene detection threshold)
    │                      - Chapter boundaries (thematic transitions)
    │                      - Heatmap replay intensity (YouTube community retention peaks)
    ▼
[Stage 4: Scoring] ──────► LLM Interface (Anthropic API / OpenRouter / local Ollama)
    │                      - Clean-room prompts sending transcript + signal timeline
    │                      - Strict JSON output schema {start, end, score, hook, title, hashtags, reason}
    │                      - Head-to-head tournament reranking of top N candidates
    │                      - Word-accurate boundary snapping to sentence ends
    │                      - Heuristic Scorer Fallback (composite signal weights when no LLM key)
    ▼
[Stage 5: Reframe 9:16] ──► OpenCV YuNet / MediaPipe Face Tracking (Apache 2.0 / BSD)
    │                      - Modes: center, follow-face (EMA smoothed), split (speaker + content)
    │                      - Speaker cuts (clean camera switching on speaker change, no jarring pans)
    ▼
[Stage 6: Captions] ─────► Word-synced ASS (Advanced SubStation Alpha) generation
    │                      - 5 Presets: Viral Pop Yellow, Clean Minimalist, Neon Cyber,
    │                        Karaoke Bounce, Impact Headline
    │                      - Pre-render editing drawer allowing text & time adjustment
    ▼
[Stage 7: Polish] ───────► Overlay pre-rendered Lemo-Opuscar design-time assets:
    │                      - 3-5s intro/outro stings, animated hook title cards, looping backgrounds
    ▼
[Stage 8: Export] ───────► 1080x1920 MP4 (NVENC/VAAPI/CPU fallback), .srt, metadata.json,
                           and bundle .zip with single-click download
```

---

## 2. Licensing Decisions & Clean-Room Guardrails

| Reference / Component | License | Policy & Guardrail Implementation |
|---|---|---|
| **Clips Kitty** (`ColinGPT9/clips-studio`) | **AGPL-3.0** | **Design Reference Only.** Strict clean-room implementation. **Zero copied code, zero copied prompt templates.** All schemas, signal extraction algorithms, scoring prompts, and reframing logic are newly written from original principles using MIT/Apache/BSD libraries. |
| **Object / Face Detection** | **Strict NO to YOLOv8** (`ultralytics` is AGPL-3.0) | Use **MediaPipe** (Apache-2.0) and **OpenCV YuNet** (BSD-3-Clause) for face detection and tracking. Completely compliant with commercial and permissive use. |
| **Lemo-Opuscar** (`lemomo-ai/lemo-opuscar`) | Code: **MIT**<br>Guides: **CC BY-NC 4.0** | **Design-Time Asset Generator Only.** Never executed at runtime in the app. Visual assets (bumpers, stings, looping backgrounds) are pre-rendered at 1080x1920 during design phase and bundled with manifests. MIT code attribution recorded in `THIRD_PARTY.md`. Zero copying or paraphrasing of CC BY-NC guide text. |
| **faster-whisper** / **CTranslate2** | **MIT** | Permissive, local-first inference with CPU int8 quantization and optional CUDA. |
| **FFmpeg / yt-dlp** | **LGPL / Unlicense** | Standard permissive CLI and library use via sanitized subprocesses without static linking issues. |
| **Clips Kitty Local Adapter** (Stretch) | **Local API call** | Off by default. If enabled by user flag (`ENABLE_LOCAL_CLIPS_KITTY_ADAPTER=true`), communicates purely over loopback HTTP to a user-run daemon on `127.0.0.1:8765`. |

---

## 3. Detailed File List & Module Organization

### A. Backend (`apps/api/`)
```
apps/api/
├── schemas/
│   ├── clip.py                     # ClipJobCreateRequest, ClipMoment, ClipRenderConfig, CaptionStyleConfig
│   └── (existing schemas preserved: inspect.py, jobs.py, explainer.py)
├── services/
│   ├── clip_ingest_service.py      # yt-dlp download, 60m cap, YouTube caption extraction, heatmap parsing
│   ├── transcription_service.py    # YouTube caption parser + faster-whisper word-timestamp engine & cache
│   ├── signal_analysis_service.py  # 1-sec bin analysis: loudness, silence-burst, FFmpeg scene cuts, heatmap
│   ├── clip_scoring_service.py     # LLM provider interface (Anthropic/OpenRouter/Ollama), JSON validation,
│   │                               # tournament reranker, sentence boundary snapper, heuristic fallback
│   ├── face_tracking_service.py    # MediaPipe/OpenCV YuNet face tracking, EMA smoothing, speaker cut logic
│   ├── ass_caption_service.py      # Word-synced ASS subtitle compiler with 5 style presets
│   ├── clip_render_service.py      # 9:16 crop, ASS burning, polish overlays, hardware/CPU encoder fallback
│   ├── clip_queue_service.py       # ClipJobManager, 1 active job/IP limiter, progress events, cancel handling
│   └── clips_kitty_adapter.py      # Optional local adapter for 127.0.0.1:8765 (off by default)
├── routers/
│   ├── clip.py                     # Endpoints: POST /api/clip/jobs, GET .../events, GET .../clips,
│   │                               # PATCH .../clips/{cid}, POST .../clips/{cid}/render, GET .../download
│   └── (existing routers preserved: health.py, inspect.py, jobs.py, explainer.py)
├── app/
│   └── config.py                   # Extended with CLIP_DURATION_CAP, WHISPER_MODEL, LLM keys, etc.
└── tests/
    ├── test_clip_signals.py        # Unit tests for signal binning and normalization
    ├── test_clip_scoring.py        # Sentence boundary snapping, LLM response parsing, heuristic scorer
    ├── test_ass_captions.py        # ASS subtitle generation and style presets
    ├── test_clip_security.py       # SSRF validation, rate limiting, and 15-min sweeper deletion
    └── test_clip_pipeline_e2e.py   # Synthetic video end-to-end integration test
```

### B. Frontend (`apps/web/`)
```
apps/web/
├── components/
│   ├── ScreenAutoClip.tsx          # Main Auto Clip screen: URL bar, preset options, live timeline, clip grid
│   ├── GlassClipCard.tsx           # 3D-tilt liquid glass card with score ring, hook preview, play/pause
│   ├── GlassCaptionEditorDrawer.tsx# Slide-in glass drawer to edit words, timings, and ASS style presets
│   ├── GlassStageTimeline.tsx      # Multi-stage live progress bar (Ingest -> Transcribe -> Signals -> Score -> Render)
│   ├── ScreenSwitcher.tsx          # Updated dev dock switcher adding "05 AUTO CLIP"
│   └── (existing components preserved: Screen01-04, GlassAudioPreview, GlassTrimmer, GlassPresets, etc.)
├── lib/
│   ├── clipStore.ts                # Zustand store slice for Auto Clip state, clip candidate list, active edits
│   ├── clipApi.ts                  # Typed client for /api/clip/* endpoints and SSE streaming
│   └── (existing lib preserved: store.ts, api.ts, soundEffects.ts, validation.ts)
└── public/
    └── polish/                     # Pre-rendered Lemo-Opuscar polish assets and manifest.json files
```

### C. Root & Repository Level
```
├── PLAN.md                         # This architecture and plan specification
├── THIRD_PARTY.md                  # Comprehensive dependency & license inventory
├── README.md                       # Auto Clip documentation, workflow guide, and configuration
├── .env.example                    # Added LLM, Whisper, and Auto Clip config variables
└── polish_pack/                    # Source directory of pre-generated design-time visual assets
    ├── manifests/                  # manifest.json for bumpers, hook title cards, looping backgrounds
    └── assets/                     # 1080x1920 MP4/WebM pre-rendered code animations
```

---

## 4. API Endpoints Specification

All endpoints enforce SSRF validation, rate limits, and sanitize all parameters:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/clip/jobs` | Creates a new Auto Clip job. Accepts `{ url, minLength, maxLength, clipCount, language, reframeMode, captionPreset, polishStyle, consent }`. Returns `{ jobId }`. |
| `GET` | `/api/clip/jobs/{id}/events` | Server-Sent Events (SSE) streaming live stage (`ingest`, `transcribe`, `signals`, `scoring`, `ready`), percent, and telemetry. |
| `GET` | `/api/clip/jobs/{id}/clips` | Returns array of candidate clips `{ clipId, start, end, score, hook, title, hashtags, reason, reframeMode, captionPreset, previewUrl }`. |
| `PATCH` | `/api/clip/jobs/{id}/clips/{cid}` | Allows user to update clip boundaries (`start`, `end`), transcript text/timings, hook title, or caption style before final burn. |
| `POST` | `/api/clip/jobs/{id}/clips/{cid}/render` | Triggers final 1080x1920 9:16 rendering with burned ASS subtitles, face tracking, and polish overlays. |
| `GET` | `/api/clip/jobs/{id}/clips/{cid}/download` | Direct file stream supporting HTTP Range requests (`206 Partial Content`) for instant save. |
| `GET` | `/api/clip/jobs/{id}/export-all` | Packages all rendered clips, .srt files, and metadata.json into an ephemeral `.zip`. |

---

## 5. Algorithmic Detail & Core Logic

### 2.1 Ingest & YouTube Data
- Validate URL using SSRF-safe DNS resolver (blocks private CIDRs, 127.0.0.1, 169.254.169.254).
- Fetch metadata with `yt-dlp --dump-json`. Reject video if `duration > CLIP_DURATION_CAP` (default 3600s / 60 min).
- Extract YouTube automatic or manual captions (`vtt` / `json3`) for immediate zero-GPU transcription.
- Parse `heatmap` array from yt-dlp metadata representing viewer replay density.

### 2.2 Transcription & Word Timestamps
- **Fast Path:** If YouTube captions contain word-level markers, parse them into uniform `TranscriptWord(word, start, end)`.
- **Fallback:** Run `faster-whisper` (`base` / `small`, `int8` quantization). Model runs in a worker thread. Cache transcript to disk per job ID so re-edits never re-transcribe.

### 2.3 Multimodal Signal Processing (1-Second Bins)
For a video of $T$ seconds, construct an array of length $T$ where each second $t \in [0, T-1]$ has normalized features:
- **Loudness ($L_t$):** FFmpeg `ebur128` or short-term RMS normalized relative to the video average.
- **Silence-to-Burst ($B_t$):** $\max(0, L_t - \bar{L}_{t-3..t-1})$. Detects punchlines, shouts, sudden laughter.
- **Scene Change ($S_t$):** Frame difference metric via FFmpeg `select='gt(scene,0.3)'`.
- **Chapter Boundary ($C_t$):** $1.0$ at chapter start $\pm 3\text{s}$, decaying outward.
- **Heatmap ($H_t$):** YouTube replay intensity normalized $0.0 \to 1.0$.

### 2.4 LLM Scoring & Boundary Snapping
- **Prompt:** Provider-agnostic format sent to Anthropic Claude 3.5 Sonnet, OpenRouter, or local Ollama:
  - Input: System prompt instructing viral Short curation, chronological transcript with timestamps, and high-signal moments flagged.
  - Output: Strict JSON schema validated by Pydantic.
- **Head-to-head Reranking:** If top candidates exceed target count, prompt conducts a pairwise comparison to keep the most engaging, self-contained hooks.
- **Boundary Snapping:** Clip start and end timestamps are snapped to the nearest preceding sentence start and following sentence end from `TranscriptWord` list. Minimum clip duration: 15s; maximum: 60s.
- **Heuristic Fallback:** If LLM is unreachable or unconfigured:
  $$\text{Score}_t = 0.30 H_t + 0.25 L_t + 0.20 B_t + 0.15 S_t + 0.10 C_t$$
  Sliding window aggregator finds peak candidate segments with non-maximum suppression (NMS) to eliminate overlaps.

### 2.5 9:16 Face Tracking & Reframing
- Detect face bounding boxes using **OpenCV YuNet** (lightweight 300KB model) or **MediaPipe**.
- Apply Exponential Moving Average (EMA) smoothing to crop center $X_c$:
  $$X_{\text{smooth}}(t) = \alpha X_{\text{detected}}(t) + (1 - \alpha) X_{\text{smooth}}(t-1)$$
- **Speaker Cut Rule:** If detected face position shifts by $> 25\%$ frame width or disappears and reappears on the other side, perform an instantaneous camera cut (reset $X_c$) rather than an unnatural pan.
- **Modes:**
  - `center`: Fixed 9:16 crop from middle.
  - `follow-face`: Dynamic crop tracking active speaker.
  - `split`: Vertical stack (top 50% speaker close-up, bottom 50% widescreen content or procedural visualizer).

### 2.6 Word-Synced ASS Captions
- Generate `.ass` file with styling tags:
  - `{\k<duration_cs>}` or `{\c&H00FFFF&}` for syllable/word active color switching.
- 5 Styles:
  1. *Viral Pop:* Bold Impact / Montserrat, primary color #00FFFF / #FFD700, heavy black border (4px), bounce scale.
  2. *Clean Minimalist:* Inter / Helvetica, white text, subtle semi-transparent dark box background.
  3. *Neon Cyber:* Cyan / Magenta glowing borders with uppercase font.
  4. *Karaoke Bounce:* White text turning electric yellow word-by-word with small scale pop.
  5. *Impact Headline:* Top-third sticky hook title card with bottom active captions.
- Burned via FFmpeg filter `ass=subtitles.ass` with font fallback.

### 2.7 Polish Pack (Lemo-Opuscar Design-Time Assets)
- Pre-generated at design time at 1080x1920:
  - 3-second hook title card animation overlays with green/black colorkey or transparent alpha.
  - Looping bottom visualizers for split mode.
  - 2-second outro follow-up bumper.
- Manifest defines safe margins, key color, and overlay duration.

### 2.8 Export Engine
- Auto-detects hardware acceleration:
  - NVIDIA: `h264_nvenc`
  - Intel/AMD: `h264_qsv` or `h264_vaapi`
  - Fallback: `libx264 -preset fast -crf 22`
- Produces final `.mp4`, `.srt`, `metadata.json` (title, description, viral hashtags), and `.zip` archive.

---

## 6. Frontend Liquid Glass Design

- New `ScreenAutoClip.tsx` adhering to Section 18 liquid glass system:
  - Frosted liquid glass panels: `backdrop-filter: blur(24px) saturate(165%)`, `.glass-rim`.
  - 3D-tilt glass clip cards (`Glass3DCard.tsx`) tilting up to 8 degrees with cursor-following glare.
  - Interactive SVG score gauge (0-100) with color gradient (emerald for 90+, cyan for 75-89, amber for <75).
  - Integrated waveform audio preview and segment trimmer for instant manual adjustments.
  - Slide-in Caption Editor Drawer (`GlassCaptionEditorDrawer.tsx`) to edit word timestamps, correct transcript typos, and toggle caption style presets before rendering.
  - Dev Screen-Switcher dock updated with `05 AUTO CLIP` shortcut.

---

## 7. Testing & Quality Bar

1. **Unit Tests:**
   - Word boundary snapping edge cases (empty timestamps, punctuation handling).
   - Signal normalization (zero variance handling, spike detection).
   - LLM JSON parser and schema validator with broken/malformed LLM mock inputs.
   - ASS subtitle syntax generation with special characters escaping.
   - URL validation and SSRF boundary testing.
2. **Integration Test:**
   - 10-second synthetic test video end-to-end run: Ingest -> Signals -> Heuristic Score -> Face Crop -> ASS Burn -> Export.
3. **Benchmarks:**
   - Benchmark throughput per 10 minutes of video: Ingest (~15s), Fast-path Captions (~0.5s), Whisper CPU (~45s), Signal analysis (~8s), Face tracking & ASS burn (~35s).
4. **Degradation Verification:**
   - Verify graceful fallback when no GPU is present.
   - Verify fallback to heuristic scorer when no LLM API key is present.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **AGPL License Infection** | High | Strictly zero code or prompt copying from Clips Kitty. Use Apache-2.0 MediaPipe / BSD OpenCV YuNet instead of AGPL YOLOv8. Maintain `THIRD_PARTY.md`. |
| **High CPU usage on Transcription** | Medium | Prioritize YouTube auto-captions/subtitles first (zero CPU). Use `faster-whisper` with `int8` quantization on CPU, limit to 60m max video duration. |
| **Face Tracking Jitter / Stutter** | Medium | Apply Exponential Moving Average (EMA) smoothing to crop coordinates. Perform clean speaker camera cuts when face shifts $> 25\%$ instead of rapid panning. |
| **LLM Output Formatting Errors** | Medium | Use Pydantic schema validation with automatic JSON repair, fallback to heuristic scoring if LLM fails. |
| **Ephemeral Disk Exhaustion** | High | 15-minute background sweeper automatically unlinks temporary files. Limit concurrent jobs to 1 per IP and 10 total on the server. |
| **FFmpeg ASS Missing Fonts** | Low | Bundle cross-platform OpenType/TrueType fonts (Inter, Montserrat) and specify `fontsdir` in FFmpeg filter chain. |

---

## 9. Implementation Phases & Commit Roadmap

- **Phase 1 (Current Step):** PLAN.md & Architecture review. **STOP and wait for user approval.**
- **Phase 2.1:** Backend Data Models, Config & Ingestion (`schemas/clip.py`, `services/clip_ingest_service.py`, `app/config.py`).
- **Phase 2.2:** Transcription & Signal Processing (`services/transcription_service.py`, `services/signal_analysis_service.py`).
- **Phase 2.3:** Scoring Engine & Boundary Snapper (`services/clip_scoring_service.py` with LLM + heuristic fallback).
- **Phase 2.4:** Face Tracking & 9:16 Reframe Engine (`services/face_tracking_service.py` with OpenCV YuNet / MediaPipe).
- **Phase 2.5:** ASS Word-Synced Captions & Render Engine (`services/ass_caption_service.py`, `services/clip_render_service.py`).
- **Phase 2.6:** Background Queue Manager & API Router (`services/clip_queue_service.py`, `routers/clip.py`, `apps/api/app/main.py`).
- **Phase 2.7:** Lemo-Opuscar Design-Time Polish Pack & Manifests (`polish_pack/`).
- **Phase 2.8:** Frontend Liquid Glass Auto Clip Studio (`ScreenAutoClip.tsx`, `GlassClipCard.tsx`, `GlassCaptionEditorDrawer.tsx`, `GlassStageTimeline.tsx`, `ScreenSwitcher.tsx`, `clipStore.ts`, `clipApi.ts`).
- **Phase 2.9:** Test Suite, Benchmarks, Documentation (`tests/`, `THIRD_PARTY.md`, `README.md`, `.env.example`).

