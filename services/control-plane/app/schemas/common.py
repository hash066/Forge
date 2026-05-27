"""
Shared Pydantic models — used as building blocks across routers.

Keep these small and composable. Router-specific request/response shapes live
in `app/schemas/<domain>.py`.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    """Base model — forbids extra fields, freezes after construction."""

    model_config = ConfigDict(extra="forbid", frozen=False, populate_by_name=True)


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


Language = Literal[
    "python",
    "javascript",
    "typescript",
    "rust",
    "go",
    "solidity",
    "terraform",
    "yaml",
    "json",
    "unknown",
]


class Violation(StrictModel):
    """A single rule/constraint violation surfaced by any analyser."""

    severity: Severity
    category: str = Field(..., description="e.g. security, drift, cost, scalability")
    title: str
    description: str
    file: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    recommendation: str | None = None
    auto_fix_available: bool = False


class RiskScores(StrictModel):
    """Four-dimensional risk score returned by /v1/risk and embedded in others."""

    scalability: int = Field(..., ge=0, le=100)
    over_engineering: int = Field(..., ge=0, le=100)
    security: int = Field(..., ge=0, le=100)
    consistency: int = Field(..., ge=0, le=100)


class AnalysisMetadata(StrictModel):
    """Boilerplate metadata returned on every analysis-like endpoint."""

    request_id: str
    tenant_id: str
    model_used: str | None = None
    latency_ms: float
    created_at: datetime
    cached: bool = False
