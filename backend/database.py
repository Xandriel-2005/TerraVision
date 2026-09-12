from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# SQLite database file for prototype
DATABASE_URL = "sqlite+aiosqlite:///./terravision_prototype.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True to log SQL queries
    connect_args={"check_same_thread": False},  # Needed for SQLite in FastAPI
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Create all tables. Useful for prototype startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("[Database] Initialized tables")
