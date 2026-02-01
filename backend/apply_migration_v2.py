import os
import sys
from sqlalchemy import create_engine, text

# Hardcoded fallback for now if env fails (based on previous context if available, or ask user)
# Actually, let's try to load .env manually since python-dotenv might not be working right
def load_env_manual(filepath):
    try:
        with open(filepath, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, val = line.strip().split('=', 1)
                    os.environ[key] = val
    except:
        pass

# Try to load from likely locations
load_env_manual('.env')
load_env_manual('../.env')

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # Construct it if we have SUPABASE_URL and key? No, we needed the postgres link.
    # The connection string is usually: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
    # I don't have the password. I can try to use the SUPABASE_URL to infer project ID but not password.
    # Wait! If I run this locally and I have `supabase` CLI logged in, maybe I can get the link?
    # Or checking `supabase/config.toml`?
    print("Error: DATABASE_URL not found in environment.")
    # Attempt to read from a local file if exists?
    # Let's see if we can use the Supabase Python client to run SQL via rpc if possible, 
    # but Standard SQL execution is better.
    # If this fails, I will ask the user for the connection string or password.
    sys.exit(1)

def apply_migration(file_path):
    print(f"Connecting to {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    print(f"Reading migration file: {file_path}")
    try:
        with open(file_path, 'r') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return

    print("Executing SQL...")
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            try:
                # Split commands by semicolon to avoid syntax error in some drivers
                # But for VIEW creation it's often better as one block.
                # Let's try executing as is.
                connection.execute(text(sql_content))
                trans.commit()
                print("Migration applied successfully!")
            except Exception as e:
                trans.rollback()
                print(f"Failed to apply migration: {e}")
                sys.exit(1)
    except Exception as e:
         print(f"Connection error: {e}")
         sys.exit(1)

if __name__ == "__main__":
    migration_file = "/Users/pavankodange/lunch-break-buddy/supabase/migrations/20260130183000_robust_fixes.sql"
    apply_migration(migration_file)
