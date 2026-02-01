import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
db_url: str = os.environ.get("DATABASE_URL", "") # Expecting Postgres connection string

if not url or not key:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY is not set in environment variables")

supabase: Client = create_client(url, key)

if db_url:
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
else:
    engine = None
    SessionLocal = None
    Base = None

def get_supabase():
    return supabase

def get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
