import logging
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("unischedule.database")

def init_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("mysql"):
        try:
            # Auto-create MySQL database if it doesn't exist in XAMPP
            parsed = urlparse(db_url)
            db_name = parsed.path.lstrip("/").split("?")[0]
            server_url = f"{parsed.scheme}://{parsed.netloc}/"
            
            temp_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            temp_engine.dispose()
            
            engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"✓ Connected to MySQL XAMPP database: {db_name}")
            return engine
        except Exception as e:
            logger.warning(f"⚠ Could not connect to MySQL on XAMPP ({e}). Falling back to SQLite local database.")
            return create_engine(
                settings.SQLITE_FALLBACK_URL,
                connect_args={"check_same_thread": False},
                echo=False
            )
    elif db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
    else:
        return create_engine(db_url, pool_pre_ping=True)

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

