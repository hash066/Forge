"""
POST /v1/patterns — algorithmic pattern detection + LeetCode mapping.

Phase 0: heuristic detectors for the high-signal patterns (nested loops,
recursion, sorting, binary search). Phase 1: tree-sitter-backed accurate
detection across more languages.
"""

from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, Language, Severity, StrictModel

router = APIRouter(prefix="/patterns", tags=["student"])


class PatternRequest(StrictModel):
    code: str = Field(..., min_length=1, max_length=50_000)
    language: Language = "javascript"


class LeetCodeRef(StrictModel):
    title: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    url: str


class Pattern(StrictModel):
    pattern: str
    complexity: str
    severity: Severity
    description: str
    suggestion: str
    leetcode: list[LeetCodeRef]


class PatternResponse(StrictModel):
    patterns: list[Pattern]
    metadata: AnalysisMetadata


def _max_loop_depth(code: str) -> int:
    """Crude indent-balanced loop depth counter — enough for hot-path detection."""
    depth = 0
    max_depth = 0
    for line in code.splitlines():
        stripped = line.lstrip()
        if re.match(r"^(for|while)\b", stripped):
            depth += 1
            max_depth = max(max_depth, depth)
        if stripped.startswith("}"):
            depth = max(0, depth - 1)
    return max_depth


@router.post("/detect", response_model=PatternResponse, summary="Detect algorithmic patterns")
async def detect(
    payload: PatternRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> PatternResponse:
    start = time.perf_counter()
    patterns: list[Pattern] = []
    code = payload.code

    depth = _max_loop_depth(code)
    if depth >= 2:
        complexity = "O(n²)" if depth == 2 else f"O(n^{depth})"
        patterns.append(
            Pattern(
                pattern="nested_loops",
                complexity=complexity,
                severity=Severity.HIGH if depth >= 3 else Severity.MEDIUM,
                description=f"Detected {depth} nested loops — likely {complexity}.",
                suggestion="Consider a hash map for O(n) lookup or sorted two-pointer.",
                leetcode=[
                    LeetCodeRef(title="Two Sum", difficulty="Easy", url="https://leetcode.com/problems/two-sum/"),
                    LeetCodeRef(title="3Sum", difficulty="Medium", url="https://leetcode.com/problems/3sum/"),
                    LeetCodeRef(
                        title="Container With Most Water",
                        difficulty="Medium",
                        url="https://leetcode.com/problems/container-with-most-water/",
                    ),
                ],
            ),
        )

    if re.search(r"\.sort\(|sorted\(|Arrays\.sort", code):
        patterns.append(
            Pattern(
                pattern="sorting",
                complexity="O(n log n)",
                severity=Severity.INFO,
                description="Code uses a sorting algorithm.",
                suggestion="Confirm that the input size justifies O(n log n).",
                leetcode=[
                    LeetCodeRef(title="Merge Intervals", difficulty="Medium", url="https://leetcode.com/problems/merge-intervals/"),
                    LeetCodeRef(title="Sort Colors", difficulty="Medium", url="https://leetcode.com/problems/sort-colors/"),
                ],
            ),
        )

    if re.search(r"\b(mid|middle)\b.*\b(left|right|lo|hi)\b", code):
        patterns.append(
            Pattern(
                pattern="binary_search",
                complexity="O(log n)",
                severity=Severity.INFO,
                description="Looks like a binary search.",
                suggestion="Good — verify input is sorted and check off-by-one bounds.",
                leetcode=[
                    LeetCodeRef(title="Binary Search", difficulty="Easy", url="https://leetcode.com/problems/binary-search/"),
                    LeetCodeRef(
                        title="Search in Rotated Sorted Array",
                        difficulty="Medium",
                        url="https://leetcode.com/problems/search-in-rotated-sorted-array/",
                    ),
                ],
            ),
        )

    if re.search(r"def\s+(\w+).*\1\s*\(", code) or re.search(r"function\s+(\w+).*\1\s*\(", code):
        patterns.append(
            Pattern(
                pattern="recursion",
                complexity="varies",
                severity=Severity.INFO,
                description="Recursive call detected.",
                suggestion="Add memoization if the recursion overlaps subproblems.",
                leetcode=[
                    LeetCodeRef(title="Fibonacci Number", difficulty="Easy", url="https://leetcode.com/problems/fibonacci-number/"),
                    LeetCodeRef(title="Climbing Stairs", difficulty="Easy", url="https://leetcode.com/problems/climbing-stairs/"),
                ],
            ),
        )

    return PatternResponse(
        patterns=patterns,
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )
