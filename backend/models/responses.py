from pydantic import BaseModel
from typing import Optional


class RiskScores(BaseModel):
    security: int
    scalability: int
    overengineering: int
    cost: int


class AnalyzeResponse(BaseModel):
    tenant_id: str
    risk_scores: RiskScores
    feedback: list[str]
    violations: list[dict] = []


class DiagnoseResponse(BaseModel):
    tenant_id: str
    diagnosis: str
    suggested_fix: Optional[str] = None
    confidence: float = 0.0


class HealthResponse(BaseModel):
    status: str
    version: str = "0.1.0"
