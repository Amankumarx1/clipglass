from fastapi import APIRouter, Request, HTTPException, status
from schemas.explainer import ExplainerGenerateRequest, ExplainerGenerateResponse
from services.explainer_service import generate_explainer_short

router = APIRouter(prefix="/api/v1/explainer", tags=["Explainer"])

@router.post("/generate", response_model=ExplainerGenerateResponse)
async def create_explainer_short(request: Request, body: ExplainerGenerateRequest):
    client_ip = request.client.host if request.client else "127.0.0.1"
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

