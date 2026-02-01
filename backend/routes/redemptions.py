from fastapi import APIRouter, HTTPException, Depends
from database import get_supabase
from models import MealRedemption, MealRedemptionCreate
from typing import List
from datetime import date

router = APIRouter(prefix="/redemptions", tags=["redemptions"])

@router.get("/user/{user_id}", response_model=List[MealRedemption])
async def get_user_redemptions(user_id: str):
    supabase = get_supabase()
    response = supabase.table("meal_redemptions").select("*").eq("user_id", user_id).execute()
    return response.data

@router.get("/today/{user_id}", response_model=List[MealRedemption])
async def get_today_redemption(user_id: str):
    supabase = get_supabase()
    today = date.today().isoformat()
    response = supabase.table("meal_redemptions").select("*").eq("user_id", user_id).eq("redemption_date", today).execute()
    return response.data

@router.post("/", response_model=MealRedemption)
async def create_redemption(redemption: MealRedemptionCreate):
    supabase = get_supabase()
    
    # Check if already redeemed today
    today = date.today().isoformat()
    existing = supabase.table("meal_redemptions").select("*").eq("user_id", redemption.user_id).eq("redemption_date", today).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already redeemed for today")
    
    response = supabase.table("meal_redemptions").insert(redemption.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create redemption")
    
    return response.data[0]
