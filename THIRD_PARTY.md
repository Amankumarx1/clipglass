# THIRD_PARTY.md - Licenses & Dependency Inventory

This document tracks all external open-source libraries, models, and reference designs used in the **ClipGlass Auto Clip** project to ensure strict compliance with open-source licenses and commercial-friendly distribution.

---

## 1. Reference Repositories & Clean-Room Boundaries

| Reference | Repository License | Usage & Clean-Room Implementation Policy |
|---|---|---|
| **Clips Kitty** (`ColinGPT9/clips-studio`) | **AGPL-3.0** | **Design concepts and architectural ideas only.**<br>• Zero copied code, zero copied prompt files, zero derivative works.<br>• Clean-room re-implementation of multimodal signal extraction (1-second temporal bins), LLM tournament reranking, and word boundary snapping.<br>• Avoids AGPL license infection completely. |
| **Lemo-Opuscar** (`lemomo-ai/lemo-opuscar`) | Code: **MIT**<br>Guides: **CC BY-NC 4.0** | **Design-Time Asset Generator Only.**<br>• Never called or run at runtime within the application.<br>• Visual assets (bumpers, intro/outro stings, looping backgrounds) are pre-rendered at design time using code tools.<br>• MIT code attribution recorded; CC BY-NC 4.0 guide text is strictly excluded from codebase. |

---

## 2. Core Backend Dependencies

| Package / Tool | License | Purpose | AGPL Cleanliness Notes |
|---|---|---|---|
| **FastAPI** | MIT | Async web framework | Permissive |
| **Uvicorn** | BSD-3-Clause | ASGI web server | Permissive |
| **Pydantic / Pydantic-Settings** | MIT | Data validation and settings management | Permissive |
| **yt-dlp** | The Unlicense | Media metadata and stream ingestion | Permissive |
| **FFmpeg** | LGPL 2.1+ / GPL (build-dependent) | Video transcoding, filtering, and ASS subtitle burning | Permissive CLI invocation (no static linking) |
| **faster-whisper** | MIT | Word-level speech-to-text transcription engine | Permissive local Whisper inference |
| **CTranslate2** | MIT | Fast inference engine for Whisper on CPU/CUDA | Permissive |
| **OpenCV (`opencv-python-headless`)** | Apache-2.0 | Computer vision and YuNet face detection | **Replaces AGPL YOLOv8 (`ultralytics`)** |
| **MediaPipe** | Apache-2.0 | Alternate fast face detection and landmarking | Permissive |
| **NumPy / SciPy** | BSD-3-Clause | Numerical signal analysis and smoothing | Permissive |
| **edge-tts** | LGPL-3.0 | Lightweight neural text-to-speech fallback | CLI / library invocation |
| **sse-starlette** | BSD-3-Clause | Server-Sent Events streaming | Permissive |
| **httpx** | BSD-3-Clause | Async HTTP client for provider-agnostic LLMs | Permissive |

---

## 3. Strict Prohibitions & Replacements

1. **`ultralytics` / `YOLOv8` (AGPL-3.0):**
   - **STRICTLY FORBIDDEN.**
   - **Replacement:** OpenCV YuNet (`face_detection_yunet`) and Google MediaPipe Face Detection under Apache-2.0 / BSD-3-Clause.
2. **Clips Kitty Prompts / Source Code:**
   - **STRICTLY FORBIDDEN to copy.**
   - **Replacement:** Original prompts designed specifically for viral vertical hook detection, validated against Pydantic schemas.

---

## 4. Frontend Dependencies

| Package | License | Purpose |
|---|---|---|
| **Next.js** | MIT | React framework (App Router) |
| **React / React-DOM** | MIT | UI rendering engine |
| **Zustand** | MIT | Client state management |
| **Framer Motion** | MIT | Liquid glass animations and 3D card tilt |
| **Lucide React** | ISC | UI iconography |
| **Tailwind CSS** | MIT | Utility-first styling system |

