from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, DefaultDict

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        if limit <= 0:
            raise ValueError("limit must be greater than 0.")
        if window_seconds <= 0:
            raise ValueError("window_seconds must be greater than 0.")

        self.limit = limit
        self.window_seconds = window_seconds
        self._storage: DefaultDict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _now(self) -> float:
        return time.monotonic()

    def _prune_bucket(self, bucket: Deque[float], now: float) -> None:
        threshold = now - self.window_seconds

        while bucket and bucket[0] <= threshold:
            bucket.popleft()

    def _calculate_retry_after(self, oldest_timestamp: float, now: float) -> int:
        retry_after = int(self.window_seconds - (now - oldest_timestamp))
        return max(retry_after, 1)

    def hit(self, key: str) -> None:
        normalized_key = normalize_rate_limit_key(key)
        now = self._now()

        with self._lock:
            bucket = self._storage[normalized_key]
            self._prune_bucket(bucket, now)

            if len(bucket) >= self.limit:
                retry_after = self._calculate_retry_after(bucket[0], now)

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

            if len(self._storage) > 10_000:
                self._cleanup(now)

    def _cleanup(self, now: float) -> None:
        keys_to_delete: list[str] = []

        for key, bucket in self._storage.items():
            self._prune_bucket(bucket, now)

            if not bucket:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            self._storage.pop(key, None)


def normalize_rate_limit_key(value: str) -> str:
    cleaned = " ".join(value.strip().split()).lower()
    return cleaned or "unknown"


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

        if client_ip:
            return client_ip

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        client_ip = real_ip.strip()

        if client_ip:
            return client_ip

    if request.client and request.client.host:
        return request.client.host.strip() or "unknown"

    return "unknown"


def build_rate_limit_key(request: Request, identifier: str | None = None) -> str:
    client_ip = normalize_rate_limit_key(_get_client_ip(request))

    if identifier is None:
        return client_ip

    return normalize_rate_limit_key(f"{client_ip}:{identifier}")


login_rate_limiter = InMemoryRateLimiter(limit=5, window_seconds=60)
resend_verification_rate_limiter = InMemoryRateLimiter(limit=3, window_seconds=600)
forgot_password_rate_limiter = InMemoryRateLimiter(limit=5, window_seconds=900)
reset_password_rate_limiter = InMemoryRateLimiter(limit=10, window_seconds=900)