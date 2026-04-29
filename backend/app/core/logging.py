from __future__ import annotations

import logging
import sys
from contextvars import ContextVar

from app.core.config import settings


request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def configure_logging() -> None:
    root_logger = logging.getLogger()

    # evită dublarea handlerelor (reload, tests, etc.)
    if root_logger.handlers:
        return

    level = getattr(logging, settings.LOG_LEVEL, logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | [%(request_id)s] | %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root_logger.setLevel(level)
    root_logger.addHandler(handler)

    # --- tuning loggers externe ---

    # Uvicorn
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    # SQLAlchemy (important pentru prod)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)

    # httpx / urllib (dacă vei folosi)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    # evită propagare excesivă în unele cazuri
    for name in ["uvicorn.access", "uvicorn.error"]:
        logging.getLogger(name).propagate = False