import asyncio
import json
import logging
from typing import Set
from backend.app.models.domain import TelemetryEvent

logger = logging.getLogger("sentinel.sse_hub")

class SSEHub:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SSEHub, cls).__new__(cls)
            cls._instance._subscribers: Set[asyncio.Queue] = set()
        return cls._instance

    def subscribe(self, max_buffer: int = 100) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=max_buffer)
        self._subscribers.add(q)
        logger.info(f"New SSE client subscribed. Total active: {len(self._subscribers)}")
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)
            logger.info(f"SSE client unsubscribed. Total active: {len(self._subscribers)}")

    async def broadcast(self, event) -> None:
        if hasattr(event, "model_dump"):
            payload_data = event.model_dump()
        elif isinstance(event, dict):
            payload_data = dict(event)
        else:
            payload_data = {"node_id": "unknown", "status": str(event), "message": ""}
        if "timestamp" not in payload_data or payload_data["timestamp"] is None:
            from datetime import datetime
            payload_data["timestamp"] = datetime.utcnow().isoformat()
        if hasattr(payload_data["timestamp"], "isoformat"):
            payload_data["timestamp"] = payload_data["timestamp"].isoformat()

        msg_str = f"data: {json.dumps(payload_data)}\n\n"
        for q in list(self._subscribers):
            try:
                # If queue is full, drop oldest item to maintain sliding window
                if q.full():
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                q.put_nowait(msg_str)
            except Exception as e:
                logger.warning(f"Failed to push message to SSE subscriber: {e}")

sse_hub = SSEHub()
