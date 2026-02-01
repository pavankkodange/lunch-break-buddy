import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def create_demo_user(email, password, full_name, employee_number, department):
    print(f"Creating demo user: {email}...")
    try:
        # Create user in Auth
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "user_metadata": {
                "full_name": full_name,
                "employee_number": employee_number,
                "department": department
            },
            "email_confirm": True
        })
        
        user_id = auth_response.user.id
        print(f"Successfully created Auth user with ID: {user_id}")
        
    except Exception as e:
        print(f"Error creating user {email}: {e}")

if __name__ == "__main__":
    # Demo Employee
    create_demo_user(
        email="employee.demo@autorabit.com",
        password="Password123!",
        full_name="Demo Employee",
        employee_number="EMP_DEMO_001",
        department="Engineering"
    )
    
    # Demo Vendor
    create_demo_user(
        email="vendor.demo@autorabit.com",
        password="Password123!",
        full_name="Demo Vendor",
        employee_number="VENDOR_DEMO_001",
        department="Vendor"
    )
    
    print("\nDemo users setup complete!")
