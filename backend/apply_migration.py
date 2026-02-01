import os
import sys
from sqlalchemy import text
from database import get_db, engine

def apply_migration(file_path):
    print(f"Reading migration file: {file_path}")
    try:
        with open(file_path, 'r') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return

    # Split by statements if necessary, but robust_fixes.sql is mostly DDL which can run in block
    # However, SQLAlchemy might prefer separate execution or raw connection.
    # Let's use the engine directly.
    
    print("Executing SQL...")
    try:
        with engine.connect() as connection:
            # We use text() to wrap the raw SQL
            # Note: SQLAlchemy might struggle with 'notify pgrst' or complex blocks if not committed.
            # We need to ensure autocommit or commit.
            trans = connection.begin()
            try:
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
