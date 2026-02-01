from fastapi import APIRouter, HTTPException, Depends
from database import get_supabase
from models import VendorSettings, VendorSettingsBase
from typing import List

router = APIRouter(prefix="/vendor", tags=["vendor"])

@router.get("/{user_id}", response_model=VendorSettings)
async def get_vendor_settings(user_id: str):
    supabase = get_supabase()
    response = supabase.table("vendor_settings").select("*").eq("user_id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Vendor settings not found")
    
    return response.data[0]

@router.put("/{user_id}", response_model=VendorSettings)
async def update_vendor_settings(user_id: str, settings: VendorSettingsBase):
    supabase = get_supabase()
    response = supabase.table("vendor_settings").update(settings.model_dump()).eq("user_id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not update vendor settings")
    
    return response.data[0]
