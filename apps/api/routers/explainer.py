import time
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, status
from schemas.explainer import ExplainerGenerateRequest, ExplainerGenerateResponse
from services.explainer_service import generate_explainer_short
from services.security_service import get_real_client_ip
from app.config import settings

router = APIRouter(prefix="/api/v1/explainer", tags=["Explainer"])

ip_explainer_timestamps = defaultdict(list)

@router.post("/generate", response_model=ExplainerGenerateResponse)
async def create_explainer_short(request: Request, body: ExplainerGenerateRequest):
    client_ip = get_real_client_ip(request)

    # Rate Limiting: Prevent CPU/GPU worker exhaustion
    now = time.time()
    cutoff = now - 600.0
    timestamps = [t for t in ip_explainer_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_JOBS_PER_10_MINUTES:
        ip_explainer_timestamps[client_ip] = timestamps
        retry_after = int(600.0 - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(max(1, retry_after))},
            detail={
                "code": "rate-limited",
                "title": "Explainer Rate Limit Reached",
                "explanation": f"You can generate at most {settings.RATE_LIMIT_JOBS_PER_10_MINUTES} explainer videos per 10 minutes.",
                "suggestedAction": "Please wait a few minutes before starting a new generation."
            }
        )
    timestamps.append(now)
    ip_explainer_timestamps[client_ip] = timestamps

    try:
        job_id, duration, script = await generate_explainer_short(body, client_ip)
        return ExplainerGenerateResponse(
            jobId=job_id,
            topic=body.topic,
            style=body.style,
            script=script,
            duration=duration,
            message="Viral explainer short generated successfully!"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainer video generation failed: {str(e)}"
        )

