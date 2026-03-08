"""SQLAlchemy async database engine and session management."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Handle Postgres SSL and Driver
db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Ensure Postgres URL uses the async driver
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # asyncpg doesn't support certain parameters like 'sslmode' or 'channel_binding' in the URL
    if "postgresql" in db_url:
        import urllib.parse as urlparse
        url_parts = list(urlparse.urlparse(db_url))
        query = dict(urlparse.parse_qsl(url_parts[4]))
        
        # Handle sslmode
        if "sslmode" in query:
            if query.pop("sslmode") in ("require", "prefer", "allow"):
                connect_args["ssl"] = True
        
        # Strip other incompatible parameters often found in Neon/hosted URLs
        query.pop("channel_binding", None)
            
        url_parts[4] = urlparse.urlencode(query)
        db_url = urlparse.urlunparse(url_parts)

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Initialize database: create extension and tables."""
    if "postgresql" in db_url:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    
    # Tables are usually created via main.py using Base.metadata.create_all
    # But for async we often do it here or via migrations.
    # In this project main.py calls a helper.

