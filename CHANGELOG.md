# Changelog

All notable changes to the ClipGlass project are documented in this file.

## [1.3.0] - 2026-11-22

### Added
- **ClipGlass Auto Clip (Three-Reference Build)**:
  - **Reference A (Clips Kitty - AGPL-3.0) Adopted Concepts (Clean-Room Re-implemented)**:
    - 1-second normalized multimodal temporal signal bins: audio RMS loudness spikes, silence-to-burst transitions, FFmpeg scene change cuts, chapter boundaries, and YouTube community replay heatmap.
    - Deterministic sentence boundary snapping with configurable reach (up to 8.0s) and pause thresholds (2.0s) to prevent clipping dialogue mid-word or mid-sentence.
    - Speaker Cut-vs-Pan heuristic: instantaneous camera cut when speaker center coordinate shifts >25% of frame width to eliminate disorienting camera panning.
    - Natural language edit box parsed into validated non-destructive operations (`extend_end`, `trim_end`, `extend_start`, `trim_start`, `set_duration`, `set_caption_preset`, `set_reframe_mode`, `set_title`, `set_hook`).
    - Head-to-head finalist tournament reranking with duplicate prevention (rejects candidates with >30% temporal overlap against kept clips).
  - **Reference B (SupoClip - Noncommercial Source) Adopted Concepts (Clean-Room Re-implemented)**:
    - Four-subscore virality framework on every clip: **Hook** (0-100), **Engagement** (0-100), **Value** (0-100), and **Shareability** (0-100) alongside composite score.
    - Opening hook title banner burned into the top 20% of the vertical frame for the first 3.5 seconds with smooth ASS fade animations.
    - Six animated ASS caption presets: *Viral Pop*, *Clean Minimalist*, *Neon Cyber*, *Karaoke Bounce*, *Impact Headline*, and *Dynamic Box*.
    - Platform export presets: YouTube Shorts (60s), TikTok (60s), and Instagram Reels (90s).
    - Real-time Server-Sent Events (SSE) telemetry for job pipeline progression.
  - **Reference C (Lemo-Opuscar - MIT Code / CC BY-NC 4.0 Guides) Adopted Concepts**:
    - Pre-rendered design-time **Polish Pack** assets (intro/outro stings at 1080x1920) for 4 visual styles: *Caption News*, *Swiss Motion Graphics*, *Neon Tubes*, and *Dark Tech Keynote*.
    - Asset manifests (`manifest.json`) defining safe zones, durations, text overlay areas, and keying parameters.
    - Ultra-fast FFmpeg overlay and bumper composition.
  - **Evaluation Harness & Benchmarking**:
    - `EVAL.md` benchmarking protocol with 1-to-5 scoring rubric across 5 video archetypes (Podcast, Interview, Gaming VOD, Lecture, Vlog).
    - `apps/api/tests/eval_harness.py` automated evaluation script verifying all 5 performance dimensions.
  - **Liquid-Glass Frontend**:
    - Pure HTML5, CSS3, Vanilla JavaScript, and Tailwind CSS (lightweight, zero Node.js build step).
    - 4 Sub-score bars, evidence badges, "Why this moment" popover, in-card plain-language edit box, thumbs up/down local feedback, and single-click all-clips ZIP bundle download.

## [1.2.0] - 2026-11-22

### Added
- **AI Auto Clip Engine MVP**:
  - Multimodal pipeline converting long YouTube videos into ranked, 9:16 vertical Shorts/TikToks.
  - Ingestion service with 60-minute duration cap, chapter parsing, and community heatmap replay extraction.
  - Dual-mode transcription: YouTube caption fast path and `faster-whisper` (`int8` CPU default / CUDA) fallback.
  - OpenCV YuNet / MediaPipe face tracking with EMA smoothing.
