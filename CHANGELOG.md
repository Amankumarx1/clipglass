# Changelog

All notable changes to the ClipGlass project are documented in this file.

## [1.2.0] - 2026-11-22

### Added
- **AI Auto Clip Engine**:
  - Full multimodal pipeline converting long YouTube videos into ranked, 9:16 vertical Shorts/TikToks.
  - Ingestion service with 60-minute duration cap, chapter parsing, and community heatmap replay extraction.
  - Dual-mode transcription: zero-GPU YouTube caption fast path with word alignment, and `faster-whisper` (`int8` CPU default / CUDA) fallback.
  - 1-second normalized signal analysis: audio loudness spikes, silence-to-burst transitions, FFmpeg scene change detection, chapter boundaries, and heatmap intensity.
  - Provider-agnostic LLM scoring (Anthropic Claude 3.5 Sonnet, OpenRouter, local Ollama) with strict JSON output schema and tournament reranking.
  - Heuristic scoring engine fallback when no LLM key is configured.
  - Sentence-boundary snapper ensuring dialogue is never cut mid-word or mid-thought.
  - OpenCV YuNet / MediaPipe face tracking with EMA smoothing and clean camera cuts on speaker transitions (`follow-face`, `center`, `split`).
  - Word-synced ASS (Advanced SubStation Alpha) subtitle generation and burning across 5 viral styling presets.
  - Hardware-accelerated rendering (`h264_nvenc`, `h264_qsv`, `h264_vaapi`) with CPU `libx264` fallback.
  - Companion `.srt` and `metadata.json` (title, hook, hashtags, reason) generation with single-click `.zip` export bundle.
- **Frontend Liquid Glass Studio**:
  - New `ScreenAutoClip.tsx` screen with 3D-tilt glass clip cards (`GlassClipCard.tsx`).
  - Circular SVG viral score ring (0-100) with gradient coloring.
  - Live stage timeline (`GlassStageTimeline.tsx`) showing Ingest -> Transcribe -> Signals -> Scoring -> Ready.
  - Slide-in caption editor drawer (`GlassCaptionEditorDrawer.tsx`) to edit transcript text, timing boundaries, and caption style presets in-browser prior to final burning.
  - Updated dev dock switcher (`ScreenSwitcher.tsx`) with `05 AUTO CLIP`.
  - Auto Clip navigation pill in `GlassHeader.tsx`.
- **Licensing & Guardrails**:
  - `THIRD_PARTY.md` tracking all external dependencies.
  - Clean-room implementation ensuring complete AGPL avoidance (no copied code or prompts from Clips Kitty; no YOLOv8/ultralytics).
  - Lemo-Opuscar design-time polish pack with manifests.
  - 100% test coverage across signals, scoring, ASS generation, security, and synthetic video rendering.

