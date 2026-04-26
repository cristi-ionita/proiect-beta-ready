from __future__ import annotations

import asyncio
import os
from getpass import getpass

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.models.user import User
from app.schemas.user import UserStatus

engine = create_async_engine(settings.database_url, future=True)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def _read_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None

    cleaned = value.strip()
    return cleaned or None


def _validate_username(username: str) -> str:
    cleaned = username.strip()

    if not cleaned:
        raise ValueError("ADMIN_USERNAME is required.")

    if len(cleaned) < 3 or len(cleaned) > 50:
        raise ValueError("ADMIN_USERNAME must be between 3 and 50 characters.")

    return cleaned


def _validate_email(email: str) -> str:
    cleaned = email.strip().lower()

    if not cleaned:
        raise ValueError("ADMIN_EMAIL is required.")

    if "@" not in cleaned:
        raise ValueError("ADMIN_EMAIL must be a valid email address.")

    return cleaned


def _validate_password(password: str) -> str:
    cleaned = password.strip()

    if not cleaned:
        raise ValueError("ADMIN_PASSWORD is required.")

    if len(cleaned) < 12:
        raise ValueError("ADMIN_PASSWORD must be at least 12 characters long.")

    has_lower = any(char.islower() for char in cleaned)
    has_upper = any(char.isupper() for char in cleaned)
    has_digit = any(char.isdigit() for char in cleaned)
    has_special = any(not char.isalnum() for char in cleaned)

    if not (has_lower and has_upper and has_digit and has_special):
        raise ValueError(
            "ADMIN_PASSWORD must contain uppercase, lowercase, digit, and special character."
        )

    weak_values = {
        "admin",
        "administrator",
        "password",
        "123456",
        "admin123",
        "changeme",
    }
    if cleaned.lower() in weak_values:
        raise ValueError("ADMIN_PASSWORD is too weak.")

    return cleaned


def _build_unique_code(username: str) -> str:
    return f"ADMIN_{username.strip().upper()}"


async def create_admin() -> None:
    username = _read_env("ADMIN_USERNAME")
    email = _read_env("ADMIN_EMAIL")
    password = _read_env("ADMIN_PASSWORD")

    if username is None:
      username = input("Admin username: ").strip()

    if email is None:
      email = input("Admin email: ").strip()

    if password is None:
      password = getpass("Admin password: ").strip()

    username = _validate_username(username)
    email = _validate_email(email)
    password = _validate_password(password)

    async with SessionLocal() as db:
        existing_admin_by_role = (
            await db.execute(select(User).where(User.role == "admin"))
        ).scalar_one_or_none()

        if existing_admin_by_role is not None:
            print("Admin already exists.")
            return

        existing_user = (
            await db.execute(
                select(User).where(
                    or_(
                        User.username == username,
                        User.email == email,
                    )
                )
            )
        ).scalar_one_or_none()

        if existing_user is not None:
            raise ValueError("Username or email is already in use.")

        unique_code = _build_unique_code(username)

        existing_user_by_code = (
            await db.execute(select(User).where(User.unique_code == unique_code))
        ).scalar_one_or_none()

        if existing_user_by_code is not None:
            raise ValueError("Generated admin unique code is already in use.")

        admin = User(
            full_name="Administrator",
            email=email,
            username=username,
            unique_code=unique_code,
            password_hash=get_password_hash(password),
            shift_number=None,
            role="admin",
            status=UserStatus.APPROVED.value,
            is_active=True,
        )

        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        print("Admin created successfully.")
        print(f"Username: {username}")
        print(f"Email: {email}")


if __name__ == "__main__":
    asyncio.run(create_admin())