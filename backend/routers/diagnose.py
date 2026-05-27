from fastapi import APIRouter, Depends
from backend.models.requests import DiagnoseRequest
from backend.models.responses import DiagnoseResponse
from backend.middleware.auth import verify_api_key
from backend.services.bedrock_service import BedrockService

router = APIRouter(prefix="/api/v1", tags=["diagnosis"])
bedrock = BedrockService()


@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_failure(
    request: DiagnoseRequest,
    api_key: str = Depends(verify_api_key)
):
    """Diagnose build/runtime failures using git history and logs"""
    result = await bedrock.diagnose_failure(
        request.git_log,
        request.git_diff,
        request.stack_trace,
        request.local_logs
    )

    return DiagnoseResponse(
        tenant_id=request.tenant_id,
        diagnosis=result.get("diagnosis", result.get("raw_response", "Unable to diagnose")),
        suggested_fix=result.get("suggested_fix"),
        confidence=result.get("confidence", 0.0)
    )
