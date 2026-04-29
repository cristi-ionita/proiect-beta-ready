from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import request_id_ctx

logger = logging.getLogger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        incoming_request_id = request.headers.get("X-Request-ID")
        request_id = (
            incoming_request_id.strip()
            if incoming_request_id and incoming_request_id.strip()
            else uuid.uuid4().hex[:8]
        )

        token = request_id_ctx.set(request_id)
        start = time.perf_counter()

        request.state.request_id = request_id

        response: Response | None = None

        try:
            response = await call_next(request)
            return response
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)

            logger.exception(
                "Failed %s %s in %sms",
                request.method,
                request.url.path,
                duration_ms,
            )

            raise
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)

            if response is not None:
                response.headers["X-Request-ID"] = request_id

                logger.info(
                    "Completed %s %s -> %s in %sms",
                    request.method,
                    request.url.path,
                    response.status_code,
                    duration_ms,
                )

            request_id_ctx.reset(token)