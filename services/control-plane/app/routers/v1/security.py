"""
POST /v1/security — vulnerability scan.

Phase 0: regex-based detector for the obvious patterns (hardcoded secrets,
open security groups, missing encryption, IAM wildcards). Phase 1: layers
in tree-sitter AST checks and Bedrock for unstructured rule matching.
"""

from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, Severity, StrictModel

router = APIRouter(prefix="/security", tags=["security"])


# Pattern registry. Each rule is (id, severity, title, cwe, regex, recommendation).
_RULES: list[tuple[str, Severity, str, str, re.Pattern[str], str]] = [
    (
        "HARDCODED-001",
        Severity.CRITICAL,
        "Hardcoded AWS access key",
        "CWE-798",
        re.compile(r"AKIA[0-9A-Z]{16}"),
        "Move to AWS Secrets Manager or environment variables.",
    ),
    (
        "HARDCODED-002",
        Severity.CRITICAL,
        "Hardcoded password",
        "CWE-798",
        re.compile(r"""(?i)(password|passwd|pwd)\s*=\s*["'][^"']{4,}["']"""),
        "Read credentials from a secret manager at runtime.",
    ),
    (
        "HARDCODED-003",
        Severity.HIGH,
        "Generic secret-looking string",
        "CWE-798",
        re.compile(r"""(?i)(secret|api[_-]?key|token)\s*=\s*["'][A-Za-z0-9+/=_-]{20,}["']"""),
        "Confirm and move to a secret manager.",
    ),
    (
        "NET-001",
        Severity.CRITICAL,
        "Security group open to the world",
        "CWE-284",
        re.compile(r"""0\.0\.0\.0/0"""),
        "Restrict CIDR to known networks or specific IP ranges.",
    ),
    (
        "S3-001",
        Severity.HIGH,
        "Public S3 ACL",
        "CWE-732",
        re.compile(r"""acl\s*=\s*["']public(-read|-read-write)?["']"""),
        "Use private ACL + explicit bucket policy.",
    ),
    (
        "IAM-001",
        Severity.HIGH,
        "Wildcard IAM action or resource",
        "CWE-732",
        re.compile(r'"(Action|Resource)"\s*:\s*"\*"'),
        "Replace * with the minimum set of actions/resources required.",
    ),
    (
        "ENCRYPT-001",
        Severity.MEDIUM,
        "Storage encryption disabled",
        "CWE-311",
        re.compile(r"""(storage_encrypted|encrypted)\s*=\s*false"""),
        "Enable encryption at rest. AWS-managed KMS keys are sufficient for most workloads.",
    ),
]


class SecurityTarget(StrictModel):
    content: str = Field(..., min_length=1, max_length=200_000)
    type: str = "terraform"  # terraform | python | javascript | yaml | ...


class SecurityRequest(StrictModel):
    scan_type: Literal["code", "iac", "config"] = "code"
    target: SecurityTarget


class Finding(StrictModel):
    id: str
    severity: Severity
    title: str
    cwe: str | None
    line: int | None
    snippet: str
    recommendation: str


class SecurityResponse(StrictModel):
    scan_passed: bool
    findings: list[Finding]
    summary: dict[str, int]
    metadata: AnalysisMetadata


@router.post("/scan", response_model=SecurityResponse, summary="Scan for vulnerabilities")
async def scan(
    payload: SecurityRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> SecurityResponse:
    start = time.perf_counter()
    lines = payload.target.content.splitlines()
    findings: list[Finding] = []

    for idx, line in enumerate(lines, start=1):
        for rule_id, sev, title, cwe, pattern, recommendation in _RULES:
            if pattern.search(line):
                findings.append(
                    Finding(
                        id=rule_id,
                        severity=sev,
                        title=title,
                        cwe=cwe,
                        line=idx,
                        snippet=line.strip()[:200],
                        recommendation=recommendation,
                    ),
                )

    summary: dict[str, int] = {s.value: 0 for s in Severity}
    for f in findings:
        summary[f.severity.value] += 1
    # Pass only if zero critical + high
    scan_passed = summary["critical"] == 0 and summary["high"] == 0

    return SecurityResponse(
        scan_passed=scan_passed,
        findings=findings,
        summary=summary,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
