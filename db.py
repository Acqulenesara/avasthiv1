import os
from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import UniqueConstraint
from databases import Database
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("POSTGRES_URL")

# SQLAlchemy ORM setup
Base = declarative_base()
metadata = MetaData()

# ORM Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    preferences_collected = Column(Integer, default=0)  # 0 = no, 1 = yes


class ChatInteraction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    query = Column(String)
    response = Column(String)
    scenario = Column(String, nullable=True)
    timestamp = Column(String, default=datetime.utcnow().isoformat)


class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    preference_type = Column(String)
    content = Column(String)
    __table_args__ = (
        UniqueConstraint('username', 'preference_type', 'content', name='uix_user_pref'),
    )
from sqlalchemy import Date, Float, DateTime

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    entry_date = Column(Date)  # Use Date for dates
    mood = Column(String)
    entry = Column(String)
    sentiment_score = Column(Float)  # Use Float for sentiment scores
    created_at = Column(DateTime, default=datetime.utcnow)  # Use DateTime

# Async Database (for FastAPI)
database = Database(DATABASE_URL)

# Synchronous engine (for metadata creation)
engine = create_engine(DATABASE_URL.replace("asyncpg", "psycopg2"))

# Session maker (for use in sync utilities or migrations)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if not using Alembic (optional)
Base.metadata.create_all(bind=engine)
