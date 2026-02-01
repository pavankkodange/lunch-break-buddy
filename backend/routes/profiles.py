from fastapi import APIRouter, HTTPException, Depends
from database import get_supabase
from models import Profile, ProfileCreate
from typing import List

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.get("/", response_model=List[Profile])
async def list_profiles():
    supabase = get_supabase()
    response = supabase.table("profiles").select("*").execute()
    return response.data

@router.get("/{user_id}", response_model=Profile)
async def get_profile(user_id: str):
    supabase = get_supabase()
    response = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return response.data[0]

@router.post("/", response_model=Profile)
async def create_profile(profile: ProfileCreate):
    supabase = get_supabase()
    response = supabase.table("profiles").insert(profile.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create profile")
    
    return response.data[0]
