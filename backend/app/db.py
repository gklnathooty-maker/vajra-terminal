from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine=create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=1800
)

SessionLocal=sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

Base=declarative_base()

def db_session():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
