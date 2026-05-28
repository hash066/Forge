"""
In-process async pub/sub for live dashboard updates.

The control plane is a single process (App Runner / one Fargate task), so an
in-memory fan-out bus is enough to push incident + remediation events to every
connected WebSocket client in real time. For a multi-replica deployment this
seam swaps for Redis pub/sub without touching publishers or subscribers.
"""

from __future__ import annotations

import asyncio
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class EventBus:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()

    def subscribe(self, maxsize: int = 1000) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=maxsize)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        self._subscribers.discard(queue)

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

    async def publish(self, event: dict[str, Any]) -> None:
        """Best-effort fan-out. A slow/full subscriber is skipped, never blocks."""
        dead: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning("eventbus.subscriber_full_dropped_event")
            except Exception:
                dead.append(queue)
        for queue in dead:
            self._subscribers.discard(queue)


_bus = EventBus()


def get_event_bus() -> EventBus:
    return _bus
