from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from database import get_supabase
from typing import List, Dict
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    supabase = get_supabase()
    
    # Ensure bucket exists
    try:
        supabase.storage.get_bucket("branding")
    except Exception:
        supabase.storage.create_bucket("branding", options={"public": True})
        
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_content = await file.read()
    
    # Upload to Supabase Storage
    path = f"assets/{file_name}"
    response = supabase.storage.from_("branding").upload(
        path=path,
        file=file_content,
        file_options={"content-type": file.content_type}
    )
    
    # Get public URL
    public_url = supabase.storage.from_("branding").get_public_url(path)
    
    return {"url": public_url}

@router.get("/stats/overview")
async def get_overview_stats():
    supabase = get_supabase()
    
    # Total redemptions
    redemptions = supabase.table("meal_redemptions").select("id", count="exact").execute()
    total_redemptions = redemptions.count if redemptions.count is not None else 0
    
    # Total employees
    employees = supabase.table("profiles").select("id", count="exact").execute()
    total_employees = employees.count if employees.count is not None else 0
    
    # Today's redemptions
    today = datetime.now().date().isoformat()
    today_redemptions = supabase.table("meal_redemptions").select("id", count="exact").eq("redemption_date", today).execute()
    today_count = today_redemptions.count if today_redemptions.count is not None else 0
    
    return {
        "total_redemptions": total_redemptions,
        "total_employees": total_employees,
        "today_redemptions": today_count
    }

@router.get("/analytics/weekly")
async def get_weekly_analytics():
    supabase = get_supabase()
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=7)
    
    response = supabase.table("meal_redemptions").select("redemption_date").gte("redemption_date", start_date.isoformat()).execute()
    
    # Simple grouping by date
    counts = {}
    for item in response.data:
        date_str = item["redemption_date"]
        counts[date_str] = counts.get(date_str, 0) + 1
        
    return counts

@router.get("/settings")
async def get_company_settings():
    supabase = get_supabase()
    response = supabase.table("company_settings").select("*").limit(1).execute()
    if not response.data:
        # Return default settings if none found
        return {
            "company_name": "Lunch buddy",
            "company_address": "Hyderabad Office",
            "email": "admin@lunchbuddy.com",
            "contact_number": "+91 000 000 0000",
            "coupon_value": 160.0,
            "office_radius_meters": 200.0
        }
    return response.data[0]

@router.post("/settings")
async def update_company_settings(settings: Dict):
    supabase = get_supabase()
    # Check if settings exist
    existing = supabase.table("company_settings").select("id").limit(1).execute()
    
    # Resilient update: Retry on missing column errors
    max_retries = 10
    import re
    
    for _ in range(max_retries):
        try:
            if existing.data:
                response = supabase.table("company_settings").update(settings).eq("id", existing.data[0]["id"]).execute()
            else:
                response = supabase.table("company_settings").insert(settings).execute()
            return response.data[0]
        except Exception as e:
            # Check for PostgREST error code PGRST204 (Column not found)
            # Accessing 'code' attribute safely as it might be nested or on the exception object
            error_code = getattr(e, 'code', None) or (e.args[0].get('code') if e.args and isinstance(e.args[0], dict) else None)
            error_message = getattr(e, 'message', str(e)) or (e.args[0].get('message') if e.args and isinstance(e.args[0], dict) else str(e))

            # The python client might wrap the error in a specific way, matching string for safety
            if 'PGRST204' in str(e) or error_code == 'PGRST204':
                # Extract column name from message: "Could not find the 'col_name' column..."
                match = re.search(r"Could not find the '(\w+)' column", error_message)
                if match:
                    bad_col = match.group(1)
                    print(f"Warning: Dropping missing column '{bad_col}' and retrying...")
                    if bad_col in settings:
                        del settings[bad_col]
                    else:
                        # Should not happen if regex matches, but break to avoid infinite loop
                        break 
                    if not settings:
                        raise HTTPException(status_code=400, detail="No valid settings to save.")
                    continue
            
            # Re-raise other errors
            raise e

@router.get("/employees")
async def list_employees():
    supabase = get_supabase()
    response = supabase.table("profiles").select("*").execute()
    return response.data
