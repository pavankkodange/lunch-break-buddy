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
    company_name: str
    company_address: str
    email: EmailStr
    contact_number: str
    gst_number: Optional[str] = None
    gst_percentage: float = 18.0
    logo_url: Optional[str] = None
    primary_color: str = "#3b82f6"
    currency: str = "₹"
    coupon_value: float = 160.0
    office_latitude: Optional[float] = None
    office_longitude: Optional[float] = None
    office_radius_meters: float = 200.0

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    email: Optional[EmailStr] = None
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

class CompanySettings(CompanySettingsBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
