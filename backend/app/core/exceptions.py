from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.db_error_map import extract_integrity_error_message, map_integrity_error
from app.core.i18n import get_language_from_headers, translate

logger = logging.getLogger("app")


def make_json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, dict):
        return {str(key): make_json_safe(item) for key, item in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [make_json_safe(item) for item in value]

    return str(value)


def normalize_validation_errors(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [make_json_safe(error) for error in errors]


async def rollback_request_db_session(request: Request) -> None:
    db = getattr(request.state, "db", None)

    if db is None:
        return

    try:
        await db.rollback()
    except Exception:
        logger.exception(
            "Failed to rollback DB session for %s %s",
            request.method,
            request.url.path,
        )


def build_error_response(
    *,
    error: str,
    code: str,
    message: str,
    details: list[dict[str, Any]] | None = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload: dict[str, Any] = {
        "error": error,
        "code": code,
        "message": message,
    }

    if details:
        payload["details"] = make_json_safe(details)

    return JSONResponse(
        status_code=status_code,
        content=payload,
        headers=headers,
    )


def _map_http_exception(exc: HTTPException) -> tuple[str, str]:
    mapping = {
        status.HTTP_400_BAD_REQUEST: ("BAD_REQUEST", "errors.http.bad_request"),
        status.HTTP_401_UNAUTHORIZED: ("UNAUTHORIZED", "errors.http.unauthorized"),
        status.HTTP_403_FORBIDDEN: ("FORBIDDEN", "errors.http.forbidden"),
        status.HTTP_404_NOT_FOUND: ("NOT_FOUND", "errors.http.not_found"),
        status.HTTP_409_CONFLICT: ("CONFLICT", "errors.http.conflict"),
        status.HTTP_422_UNPROCESSABLE_ENTITY: (
            "VALIDATION_ERROR",
            "errors.validation.invalid_request",
        ),
        status.HTTP_429_TOO_MANY_REQUESTS: (
            "RATE_LIMITED",
            "errors.http.too_many_requests",
        ),
    }

    return mapping.get(exc.status_code, ("HTTP_ERROR", "errors.http.bad_request"))


def _extract_http_exception_details(
    detail: Any,
    default_code: str,
) -> tuple[str, list[dict[str, Any]] | None]:
    details: list[dict[str, Any]] | None = None
    fallback_message = default_code

    if isinstance(detail, str):
        fallback_message = detail
    elif isinstance(detail, list):
        details = normalize_validation_errors(detail)
    elif isinstance(detail, dict):
        details = [make_json_safe(detail)]

    return fallback_message, details


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        log_level = logging.WARNING

        if exc.status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_429_TOO_MANY_REQUESTS,
        }:
            log_level = logging.INFO

        logger.log(
            log_level,
            "HTTPException %s %s -> status=%s",
            request.method,
            request.url.path,
            exc.status_code,
        )

        language = get_language_from_headers(request.headers)
        error, code = _map_http_exception(exc)
        fallback_message, details = _extract_http_exception_details(exc.detail, code)
        message = translate(code, language, fallback=fallback_message)

        return build_error_response(
            error=error,
            code=code,
            message=message,
            details=details,
            status_code=exc.status_code,
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        raw_errors = exc.errors()

        logger.warning(
            "Validation error %s %s",
            request.method,
            request.url.path,
        )

        language = get_language_from_headers(request.headers)
        code = "errors.validation.invalid_request"

        return build_error_response(
            error="VALIDATION_ERROR",
            code=code,
            message=translate(code, language),
            details=normalize_validation_errors(raw_errors),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        request: Request,
        exc: IntegrityError,
    ) -> JSONResponse:
        logger.warning(
            "IntegrityError %s %s -> %s",
            request.method,
            request.url.path,
            extract_integrity_error_message(exc),
        )

        await rollback_request_db_session(request)

        language = get_language_from_headers(request.headers)
        error, code, status_code = map_integrity_error(exc)

        return build_error_response(
            error=error,
            code=code,
            message=translate(code, language),
            status_code=status_code,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception(
            "Unhandled exception on %s %s",
            request.method,
            request.url.path,
        )

        await rollback_request_db_session(request)

        language = get_language_from_headers(request.headers)
        code = "errors.internal"

        return build_error_response(
            error="INTERNAL_SERVER_ERROR",
            code=code,
            message=translate(code, language),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )