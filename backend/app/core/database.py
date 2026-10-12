from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Normalize URL and validate dialect (PostgreSQL or MySQL supported; SQLite rejected)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+aiomysql://", 1)
elif db_url.startswith("mysql+pymysql://"):
    db_url = db_url.replace("mysql+pymysql://", "mysql+aiomysql://", 1)

db_url_lower = db_url.lower()
if "sqlite" in db_url_lower or not (
    db_url_lower.startswith("postgresql") or db_url_lower.startswith("mysql")
):
    raise RuntimeError(
        f"Invalid DATABASE_URL: '{settings.DATABASE_URL}'. "
        "EventLens requires PostgreSQL or MySQL (SQLite is not supported)."
    )

# Engine configuration for PostgreSQL / MySQL
engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

def is_postgres() -> bool:
    return engine.dialect.name == "postgresql"

def is_mysql() -> bool:
    return engine.dialect.name == "mysql"

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """
    Initializes database schema:
    - PostgreSQL: Enables uuid-ossp, pgvector extension, and builds HNSW index.
    - MySQL: Migrates all EventLens tables; uses JSON arrays and in-memory cosine matching.
    """
    async with engine.begin() as conn:
        dialect_name = engine.dialect.name
        if dialect_name == "postgresql":
            logger.info("PostgreSQL detected: Configuring extensions ('uuid-ossp', 'vector')...")
            try:
                await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
                await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector;'))
            except Exception as e:
                logger.warning(f"Note on PostgreSQL extension setup: {e}")

        logger.info(f"Migrating EventLens tables to {dialect_name.upper()}...")
        await conn.run_sync(Base.metadata.create_all)

        if dialect_name == "postgresql":
            logger.info("Ensuring HNSW vector cosine index exists on face_embeddings...")
            try:
                await conn.execute(text(
                    'CREATE INDEX IF NOT EXISTS idx_face_embeddings_hnsw '
                    'ON face_embeddings USING hnsw (embedding vector_cosine_ops) '
                    'WITH (m = 16, ef_construction = 64);'
                ))
                logger.info("HNSW pgvector index confirmed.")
            except Exception as e:
                logger.warning(f"Note on HNSW index initialization: {e}")

    logger.info(f"{engine.dialect.name.upper()} database initialized successfully.")

