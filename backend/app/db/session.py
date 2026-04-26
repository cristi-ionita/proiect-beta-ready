from __future__ import annotations

from collections.abc import AsyncGenerator
from functools import lru_cache

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


@lru_cache
def get_engine():
    return create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
        future=True,
    )

@lru_cache
def get_session_local():
    return async_sessionmaker(
        bind=get_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


async def get_db(
    request: Request,
) -> AsyncGenerator[AsyncSession, None]:
    session_local = get_session_local()

    async with session_local() as session:
        request.state.db = session
        try:
            yield session
        finally:
            await session.close()