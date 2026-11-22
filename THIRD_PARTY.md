# THIRD_PARTY.md - Licenses & Dependency Inventory

This document tracks all external open-source libraries, models, and reference designs used in the **ClipGlass Auto Clip** project to ensure strict compliance with open-source licenses and commercial-friendly distribution.

---

## 1. Reference Repositories & Clean-Room Boundaries

| Reference | Repository License | Usage & Clean-Room Implementation Policy |
|---|---|---|
| **Clips Kitty** (`ColinGPT9/clips-studio`) | **AGPL-3.0** | **Design concepts and architectural ideas only.**<br>• Zero copied code, zero copied prompt templates, zero derivative snippets.<br>• Clean-room re-implementation of multimodal signal extraction (1-second temporal bins), sentence boundary snapping, speaker cut-vs-pan heuristic, and plain-language edit operation parsing.<br>• Strictly isolates ClipGlass from AGPL-3.0 copyleft infection. |
| **SupoClip** (`FujiwaraChoki/supoclip`) | **Noncommercial Source License v1.1** | **Design concepts and architectural ideas only.**<br>• Zero copied code, zero copied prompt templates, zero config files.<br>• Clean-room re-implementation of the 4-subscore virality framework (Hook, Engagement, Value, Shareability), opening hook title burning, caption style presets, and live SSE telemetry.<br>• Complies with noncommercial licensing restrictions by avoiding code duplication. |
| **Lemo-Opuscar** (`lemomo-ai/lemo-opuscar`) | Code: **MIT**<br>Guides: **CC BY-NC 4.0** | **Design-Time Asset Reference Only.**<br>• Never called or run at runtime within the application.<br>• Visual polish assets (stings, animated title cards, looping 9:16 backgrounds) are pre-rendered at design time.<br>• Permissive MIT code attribution maintained; CC BY-NC 4.0 guide text is strictly excluded. |

---

## 2. Core Backend Dependencies

| Package / Tool | License | Purpose | Cleanliness Notes |
|---|---|---|---|
| **FastAPI** | MIT | Async web framework & REST routing | Permissive |
| **Uvicorn** | BSD-3-Clause | ASGI web server | Permissive |
| **Pydantic / Pydantic-Settings** | MIT | Data validation and settings management | Permissive |
| **yt-dlp** | The Unlicense | Media metadata, audio/video ingestion, and heatmap extraction | Permissive public domain |
| **FFmpeg** | LGPL-2.1+ / GPL | Video transcoding, 9:16 cropping, ASS subtitle burning, audio analysis | Permissive CLI invocation (no static linking) |
| **faster-whisper** | MIT | Word-level speech-to-text transcription engine | Permissive local Whisper inference |
| **CTranslate2** | MIT | Fast inference engine for Whisper on CPU/CUDA | Permissive |
| **OpenCV (`opencv-python-headless`)** | Apache-2.0 | Computer vision and YuNet face detection | **Permissive replacement for AGPL YOLOv8** |
| **MediaPipe** | Apache-2.0 | Fast face detection and facial landmarking | Permissive |
| **NumPy / SciPy** | BSD-3-Clause | Numerical signal analysis and smoothing | Permissive |
| **sse-starlette** | BSD-3-Clause | Server-Sent Events streaming for pipeline progress | Permissive |
| **httpx** | BSD-3-Clause | Async HTTP client for provider-agnostic LLM calls | Permissive |

---

## 3. Strict Prohibitions & Architectural Replacements

1. **`ultralytics` / `YOLOv8` (AGPL-3.0):**
   - **STRICTLY FORBIDDEN.**
   - **Replacement:** OpenCV YuNet (`cv2.FaceDetectorYN`) and Google MediaPipe Face Detection under Apache-2.0 / BSD-3-Clause.
2. **Third-Party Prompts / Source Code:**
   - **STRICTLY FORBIDDEN to copy from AGPL or noncommercial sources.**
   - **Replacement:** Original, clean-room prompt templates designed specifically for structured JSON virality scoring and validation via Pydantic schemas.
3. **Persistent Cloud Storage / Database Services:**
   - **STRICTLY EXCLUDED.**
   - **Architecture:** Zero-install in-process job queue and ephemeral 15-minute file sweeper.

---

## 4. Frontend Dependencies

The ClipGlass front end runs as a lightweight, zero-build client rendered by FastAPI:

| Component / Library | License | Purpose |
|---|---|---|
| **HTML5 / CSS3 / Vanilla JavaScript** | N/A (Standard) | Browser native UI execution without bundlers or node runtime |
| **Tailwind CSS (CDN)** | MIT | Utility-first responsive styling |
| **Phosphor Icons / Lucide SVG** | MIT / ISC | Clean visual iconography |
| **Web Audio API** | W3C Standard | Client-side waveform visualization and preview |
