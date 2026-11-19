
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# Database URL
db_url = settings.DATABASE_URL.strip()

# Convert PostgreSQL URL to asyncpg format
if db_url.startswith("postgres://"):
    db_url = db_url.replace(
        "postgres://",
        "postgresql+asyncpg://",
        1,
    )
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    )

# SQLite configuration
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
