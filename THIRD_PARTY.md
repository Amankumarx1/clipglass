# THIRD_PARTY.md: Dependency & Licence Compliance Ledger

This document maintains a complete, auditable ledger of all third-party dependencies, libraries, models, and tools used by ClipGlass, confirming strict adherence to open-source licensing guardrails.

---

### 1. Licence Compliance Guardrails

- **Zero AGPL Code or Libraries**: Clips Kitty is licensed under AGPL-3.0. Zero lines of code, prompts, configs, or assets from Clips Kitty are copied or included in ClipGlass. All concepts are re-implemented from first principles. Ultralytics YOLO (AGPL) is strictly prohibited.
- **Zero Noncommercial Source License Code**: SupoClip is licensed under a noncommercial source-available license. Zero lines of code, schemas, or templates are copied from SupoClip.
- **Lemo-Opuscar Attribution**: Lemo-Opuscar code is MIT licensed; documentation/guides are CC BY-NC 4.0. Only clean code-driven motion graphic concepts and custom pre-rendered visual assets authored at design time are utilized.
- **Permissive Licences Only**: Every runtime dependency is strictly MIT, Apache-2.0, BSD-3-Clause, or Python Software Foundation (PSF).

---

### 2. Runtime Python Dependencies

| Package | Version | Licence | Purpose | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | `>=0.115.0` | MIT | Core async HTTP & SSE API framework | ✅ Compliant (MIT) |
| **Starlette** | `>=0.40.0` | BSD-3-Clause | ASGI framework underlying FastAPI | ✅ Compliant (BSD-3) |
| **Uvicorn** | `>=0.32.0` | BSD-3-Clause | Production ASGI web server | ✅ Compliant (BSD-3) |
| **Pydantic** | `>=2.10.0` | MIT | Strict data validation & schema definitions | ✅ Compliant (MIT) |
| **yt-dlp** | `>=2024.12.0` | Unlicense / Public Domain | YouTube metadata probe & JIT byte-range slice | ✅ Compliant (Unlicense) |
| **opencv-python-headless** | `>=4.10.0` | Apache-2.0 | YuNet neural face detection & visual cut diffing | ✅ Compliant (Apache-2.0) |
| **mediapipe** | `>=0.10.14` | Apache-2.0 | Face mesh & active-speaker landmark detection | ✅ Compliant (Apache-2.0) |
| **numpy** | `>=1.26.0` | BSD-3-Clause | Fast signal array normalization & fusion | ✅ Compliant (BSD-3) |
| **faster-whisper** | `>=1.0.0` | MIT | Word-level speech timestamping (fallback only) | ✅ Compliant (MIT) |
| **anthropic** | `>=0.40.0` | MIT | Optional provider for LLM scoring | ✅ Compliant (MIT) |
| **openai** | `>=1.55.0` | Apache-2.0 | Optional provider for OpenRouter / Ollama | ✅ Compliant (Apache-2.0) |
| **httpx** | `>=0.28.0` | BSD-3-Clause | Async HTTP client for streaming & probes | ✅ Compliant (BSD-3) |
| **sse-starlette** | `>=2.1.0` | BSD-3-Clause | Live Server-Sent Events progressive streaming | ✅ Compliant (BSD-3) |
| **jinja2** | `>=3.1.4` | BSD-3-Clause | Template rendering for Liquid Glass UI | ✅ Compliant (BSD-3) |
| **pytest** | `>=8.3.0` | MIT | Automated test suite execution | ✅ Compliant (MIT) |
| **pytest-asyncio** | `>=0.24.0` | Apache-2.0 | Async test fixtures & test runner | ✅ Compliant (Apache-2.0) |

---

### 3. System & External Binaries

| Binary | Version | Licence | Purpose | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **FFmpeg** | `>=6.0` (7.x recommended) | LGPL-2.1+ / GPL-2.0+ | JIT slicing, filtergraph composition, encoding | Invoked strictly via subprocess; zero internal linking |
| **FFprobe** | `>=6.0` | LGPL-2.1+ / GPL-2.0+ | Frame-accurate duration & stream inspection | Invoked strictly via subprocess |

---

### 4. Computer Vision Models

| Model | Source | Licence | Execution Engine | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **OpenCV YuNet** | OpenCV Model Zoo | Apache-2.0 | OpenCV DNN (CPU/GPU) | High-speed face detection & bounding box tracking |
| **MediaPipe Face Detection** | Google MediaPipe | Apache-2.0 | MediaPipe C++ runtime | Landmark tracking for active-speaker mouth motion |

---

### 5. Third-Party Code Prohibition Audit

- [x] No `ultralytics` or YOLO packages present in dependencies.
- [x] No copied code, prompts, or text from `ColinGPT9/clips-studio`.
- [x] No copied code, schemas, or text from `FujiwaraChoki/supoclip`.
- [x] No CC BY-NC 4.0 documentation copied from `lemomo-ai/lemo-opuscar`.
- [x] All visual polish assets authored independently as design-time templates with explicit `manifest.json`.
