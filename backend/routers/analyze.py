from fastapi import APIRouter, Request, Depends
from backend.models.requests import AnalyzeRequest
from backend.models.responses import AnalyzeResponse, RiskScores
from backend.middleware.auth import verify_api_key
from backend.services.bedrock_service import BedrockService

router = APIRouter(prefix="/api/v1", tags=["analysis"])
bedrock = BedrockService()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(
    request: AnalyzeRequest,
    api_key: str = Depends(verify_api_key)
):
    """Analyze code for architectural risks using Bedrock"""
    result = await bedrock.analyze_code(request.code, request.language)

    # Extract scores from Bedrock response or use defaults
    if "security" in result:
        risk_scores = RiskScores(
            security=result.get("security", 5),
            scalability=result.get("scalability", 5),
            overengineering=result.get("overengineering", 5),
            cost=result.get("cost", 5)
        )
    else:
        # Fallback to reasonable defaults if Bedrock returns unexpected format
        risk_scores = RiskScores(security=5, scalability=5, overengineering=5, cost=5)

    return AnalyzeResponse(
        tenant_id=request.tenant_id,
        risk_scores=risk_scores,
        feedback=result.get("feedback", []),
        violations=result.get("violations", [])
    )
