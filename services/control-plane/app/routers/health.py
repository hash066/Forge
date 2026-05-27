"""Health + readiness endpoints — used by load balancers and uptime monitors."""

from fastapi import APIRouter, status
from pydantic import BaseModel

from app import __version__

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness probe",
)
async def health() -> HealthResponse:
    """
    Returns 200 as long as the process is up. Does not check downstream
    dependencies — use `/v1/auth/ready` for full readiness.
    """
    return HealthResponse(status="ok", version=__version__)
