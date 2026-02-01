
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from backend.database import get_supabase

def fix_branding():
    supabase = get_supabase()
    
    # Define the correct branding values
    updates = {
        # App Name (displayed in Sidebar/Header)
        "company_name": "Lunch Break buddy",
        "autorabit_primary_color": "#1E40AF", # Corporate Blue
        
        # Vendor Identity
        "vendor_name": "Go Vindu",
        "vendor_brand_color": "#EA580C", # Orange
        
        # Ensure fallback fields don't confusingly point to Vendor
        "logo_url": None, # Clear this if it was confusing, OR keep it if it's the specific vendor logo upload
    }
    
    # Note: If the user uploaded a logo previously to 'logo_url', we might want to move it to 'vendor_logo_url' 
    # if it was indeed the vendor logo.
    # Looking at the debug output: 
    # "logo_url": "https://.../company-logo-1756735872883.png"
    # "vendor_logo_url": null
    # It seems the previous upload went to 'logo_url'. Let's move it to 'vendor_logo_url' and clear 'logo_url'
    # so the platform falls back to text "AutoRABIT" until a real platform logo is uploaded.
    
    current = supabase.table('company_settings').select('*').single().execute()
    if current.data:
        current_logo = current.data.get('logo_url')
        if current_logo and "company-logo" in current_logo:
             # Move legacy logo to vendor logo
             updates['vendor_logo_url'] = current_logo
        
    try:
        # Update the single row in company_settings
        # We assume there's only one row or we update the row ID we found
        row_id = current.data['id']
        response = supabase.table('company_settings').update(updates).eq('id', row_id).execute()
        print("Successfully updated branding settings.")
        print("Platform Name: AutoRABIT")
        print("Partner Name: Go Vindu")
    except Exception as e:
        print(f"Error updating settings: {e}")

if __name__ == "__main__":
    fix_branding()
