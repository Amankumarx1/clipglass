import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    MAX_DURATION_SECONDS: int = 10800  # 3 hours
    MAX_FILE_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024  # 2 GB
    FILE_TTL_SECONDS: int = 900  # 15 minutes
    MAX_CONCURRENT_JOBS: int = 10
    MAX_JOBS_PER_IP: int = 5
    RATE_LIMIT_INSPECT_PER_MINUTE: int = 10
    RATE_LIMIT_JOBS_PER_10_MINUTES: int = 5

    TEMP_STORAGE_DIR: str = str(Path(__file__).resolve().parent.parent / "temp_storage")

    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS: bool = False

    TURNSTILE_SECRET_KEY: str = ""
    TURNSTILE_ENABLED: bool = False

    YOUTUBE_PROXY: str = ""
    YOUTUBE_COOKIES_FILE: str = ""

    # Auto Clip Engine Settings
    CLIP_DURATION_CAP: int = 3600  # 60 minutes cap for Auto Clip
    WHISPER_MODEL: str = "base"     # tiny, base, small, medium
    WHISPER_DEVICE: str = "cpu"     # cpu or cuda
    WHISPER_COMPUTE_TYPE: str = "int8" # int8, float16, float32
    ANTHROPIC_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3.2"
    ENABLE_LOCAL_CLIPS_KITTY_ADAPTER: bool = False

    SENTRY_DSN: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure temp storage directory exists
os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
