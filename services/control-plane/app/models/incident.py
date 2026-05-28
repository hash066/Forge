"""Incident — a detected Kubernetes problem and its AI diagnosis."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, gen_id, utcnow


class Incident(Base, TimestampMixin):
    """
    One detected cluster incident. Created the moment a detector fires; enriched
    with AI root-cause + a proposed remediation; closed when resolved.
    """

    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=gen_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # What & where
    cluster: Mapped[str] = mapped_column(String(128), default="default")
    namespace: Mapped[str] = mapped_column(String(255), default="default")
    kind: Mapped[str] = mapped_column(String(64), default="Pod")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(String(64), index=True)  # CrashLoopBackOff, OOMKilled, …
    severity: Mapped[str] = mapped_column(String(16), default="high")

    # Lifecycle: detected → diagnosing → remediating → resolved | failed | suggested
    status: Mapped[str] = mapped_column(String(24), default="detected", index=True)

    # AI diagnosis
    summary: Mapped[str] = mapped_column(Text, default="")
    root_cause: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evidence: Mapped[list[Any]] = mapped_column(JSON, default=list)
    remediation: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    raw_context: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    model_used: Mapped[str | None] = mapped_column(String(64), nullable=True)

    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def signature(self) -> str:
        """Stable key for de-duping repeat firings of the same problem."""
        return f"{self.tenant_id}:{self.namespace}:{self.kind}:{self.name}:{self.reason}"
