"""Remediation — a concrete fix proposed or applied for an incident."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, gen_id


class Remediation(Base, TimestampMixin):
    __tablename__ = "remediations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=gen_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    incident_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # restart_pod | rollback | set_resources | scale | patch_image | cordon | none
    action: Mapped[str] = mapped_column(String(48), nullable=False)
    target: Mapped[str] = mapped_column(String(255), default="")
    mode: Mapped[str] = mapped_column(String(16), default="suggest")  # auto | suggest

    # proposed → approved → applied | failed | skipped
    status: Mapped[str] = mapped_column(String(24), default="proposed", index=True)
    rationale: Mapped[str] = mapped_column(Text, default="")
    patch: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    risk: Mapped[str] = mapped_column(String(16), default="low")

    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
