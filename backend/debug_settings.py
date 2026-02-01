import sys
import os

# Add the parent directory to sys.path to allow importing backend modules
sys.path.append(os.getcwd())

from backend.database import get_supabase
import json

def debug_settings():
    supabase = get_supabase()
    try:
        response = supabase.table('company_settings').select('*').execute()
        if response.data:
            print(json.dumps(response.data[0], indent=2))
        else:
            print("No settings found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_settings()
