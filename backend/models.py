from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ProfileBase(BaseModel):
    full_name: str
    company_email: EmailStr
    employee_number: str
    department: Optional[str] = None
    is_vegetarian: bool = False
    lunch_timer_reminder: bool = True
    dark_mode_enabled: bool = False

class ProfileCreate(ProfileBase):
    user_id: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    is_vegetarian: Optional[bool] = None
    lunch_timer_reminder: Optional[bool] = None
    dark_mode_enabled: Optional[bool] = None

class Profile(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MealRedemptionBase(BaseModel):
    employee_number: str
    redemption_date: str
    redemption_time: str

class MealRedemptionCreate(MealRedemptionBase):
    user_id: str

class MealRedemption(MealRedemptionBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class VendorSettingsBase(BaseModel):
    vendor_name: str
    vendor_email: Optional[EmailStr] = None
    vendor_contact: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_gst_number: Optional[str] = None
    vendor_gst_percentage: Optional[float] = None
    service_description: Optional[str] = None

class VendorSettings(VendorSettingsBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanySettingsBase(BaseModel):
    # AutoRabit (Platform) Identity
    company_name: str = "AutoRabit Lunch Break Buddy"
    email: EmailStr = "support@autorabit.com"
    
    autorabit_logo_url: Optional[str] = None
    autorabit_favicon_url: Optional[str] = None
    autorabit_primary_color: str = "#1E40AF"
    autorabit_website: Optional[str] = None
    autorabit_gst_number: Optional[str] = None
    autorabit_contact_primary: Optional[str] = None
    autorabit_contact_secondary: Optional[str] = None
    autorabit_official_address: Optional[str] = None
    autorabit_support_hours: Optional[str] = None

    # Vendor (Cafeteria) Identity
    vendor_name: str = "Vendor Cafeteria"
    vendor_email: Optional[EmailStr] = None
    vendor_address: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_gst_number: Optional[str] = None
    vendor_gst_percentage: float = 18.0
    vendor_brand_color: str = "#EA580C"
    vendor_description: Optional[str] = None
    vendor_logo_url: Optional[str] = None
    
    # Generic / Legacy (Keep for backward compatibility)
    company_address: Optional[str] = None
    contact_number: Optional[str] = None
    gst_number: Optional[str] = None
    gst_percentage: float = 18.0
    logo_url: Optional[str] = None
    primary_color: str = "#3b82f6"
    currency: str = "₹"
    coupon_value: float = 160.0
    office_latitude: Optional[float] = None
    office_longitude: Optional[float] = None
    office_radius_meters: float = 200.0
    todays_special: Optional[str] = None
    todays_special_media_url: Optional[str] = None
    todays_special_media_type: Optional[str] = None  # 'image' or 'pdf'
    
    active_offers: Optional[str] = None
    active_offers_media_url: Optional[str] = None
    active_offers_media_type: Optional[str] = None # 'image' or 'pdf'

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    
    autorabit_logo_url: Optional[str] = None
    autorabit_favicon_url: Optional[str] = None
    autorabit_primary_color: Optional[str] = None
    autorabit_website: Optional[str] = None
    autorabit_gst_number: Optional[str] = None
    autorabit_contact_primary: Optional[str] = None
    autorabit_contact_secondary: Optional[str] = None
    autorabit_official_address: Optional[str] = None
    autorabit_support_hours: Optional[str] = None

    vendor_name: Optional[str] = None
    vendor_email: Optional[EmailStr] = None
    vendor_address: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_gst_number: Optional[str] = None
    vendor_gst_percentage: Optional[float] = None
    vendor_brand_color: Optional[str] = None
    vendor_description: Optional[str] = None
    vendor_logo_url: Optional[str] = None

    company_address: Optional[str] = None
    contact_number: Optional[str] = None
    gst_number: Optional[str] = None
    gst_percentage: Optional[float] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    currency: Optional[str] = None
    coupon_value: Optional[float] = None
    office_latitude: Optional[float] = None
    office_longitude: Optional[float] = None
    office_radius_meters: Optional[float] = None
    
    todays_special: Optional[str] = None
    todays_special_media_url: Optional[str] = None
    todays_special_media_type: Optional[str] = None
    
    active_offers: Optional[str] = None
    active_offers_media_url: Optional[str] = None
    active_offers_media_type: Optional[str] = None

class CompanySettings(CompanySettingsBase):
    id: str  # Changed from UUID to str to match Supabase response usually
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
