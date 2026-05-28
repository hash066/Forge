"""ClusterSnapshot — periodic health/cost/security posture of a cluster."""

from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, gen_id


class ClusterSnapshot(Base, TimestampMixin):
    __tablename__ = "cluster_snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=gen_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    cluster: Mapped[str] = mapped_column(String(128), default="default", index=True)

    nodes: Mapped[int] = mapped_column(Integer, default=0)
    pods_total: Mapped[int] = mapped_column(Integer, default=0)
    pods_healthy: Mapped[int] = mapped_column(Integer, default=0)
    namespaces: Mapped[int] = mapped_column(Integer, default=0)

    health_score: Mapped[float] = mapped_column(Float, default=100.0)
    monthly_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_waste_usd: Mapped[float] = mapped_column(Float, default=0.0)
    security_findings: Mapped[int] = mapped_column(Integer, default=0)

    detail: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
