from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL_SYNC = os.getenv("DATABASE_URL_SYNC")

engine = create_engine(DATABASE_URL_SYNC)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)