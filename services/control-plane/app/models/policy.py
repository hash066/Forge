"""RemediationPolicy — per-tenant governance of the self-healing loop.

This is what makes Settings *real*: the diagnose path consults it to decide
whether a fix auto-applies, waits for approval, or is held — gated by a risk
ceiling and namespace exclusions.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class RemediationPolicy(Base):
    __tablename__ = "remediation_policies"

    tenant_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    # off = propose only, never act · suggest = wait for approval · auto = self-heal within limits
    mode: Mapped[str] = mapped_column(String(16), default="suggest")
    # highest risk allowed to auto-apply (low | medium | high)
    max_auto_risk: Mapped[str] = mapped_column(String(16), default="low")
    excluded_namespaces: Mapped[list[Any]] = mapped_column(JSON, default=list)
    allowed_actions: Mapped[list[Any]] = mapped_column(JSON, default=list)  # empty = all allowed
    notify_webhook: Mapped[str] = mapped_column(String(512), default="")

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
