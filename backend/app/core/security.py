from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

UserRole = Literal["admin", "employee", "mechanic"]

VALID_USER_ROLES: set[str] = {"admin", "employee", "mechanic"}
ACCESS_TOKEN_TYPE = "access"


def _normalize_plain_value(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"{field_name} cannot be empty.")
    return cleaned


def _get_token_expiration_minutes(expires_minutes: int | None = None) -> int:
    ttl_minutes = (
        expires_minutes
        if expires_minutes is not None
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    if ttl_minutes <= 0:
        raise ValueError("expires_minutes must be greater than 0.")

    return ttl_minutes


def hash_password(password: str) -> str:
    return pwd_context.hash(_normalize_plain_value(password, "Password"))


def get_password_hash(password: str) -> str:
    return hash_password(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False

    try:
        normalized_password = _normalize_plain_value(password, "Password")
    except ValueError:
        return False

    return pwd_context.verify(normalized_password, password_hash)


def create_access_token(
    user_id: int,
    role: UserRole,
    expires_minutes: int | None = None,
) -> str:
    if user_id <= 0:
        raise ValueError("user_id must be a positive integer.")

    if role not in VALID_USER_ROLES:
        raise ValueError("Invalid token role.")

    now = datetime.now(UTC)
    ttl_minutes = _get_token_expiration_minutes(expires_minutes)
    expires_at = now + timedelta(minutes=ttl_minutes)

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": ACCESS_TOKEN_TYPE,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    return jwt.encode(
        payload,
        settings.ACCESS_TOKEN_SECRET,
        algorithm=settings.ACCESS_TOKEN_ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    normalized_token = _normalize_plain_value(token, "Token")

    try:
        payload = jwt.decode(
            normalized_token,
            settings.ACCESS_TOKEN_SECRET,
            algorithms=[settings.ACCESS_TOKEN_ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid access token.") from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise ValueError("Invalid token type.")

    role = payload.get("role")
    if role not in VALID_USER_ROLES:
        raise ValueError("Invalid token role.")

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise ValueError("Invalid token subject.")

    try:
        user_id = int(sub)
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid token subject.") from exc

    if user_id <= 0:
        raise ValueError("Invalid token subject.")

    return payload