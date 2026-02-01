-- Migration: Add comprehensive branding fields to company_settings
-- Created at: 2026-01-30

ALTER TABLE IF EXISTS public.company_settings 
ADD COLUMN IF NOT EXISTS autorabit_logo_url TEXT,
ADD COLUMN IF NOT EXISTS autorabit_favicon_url TEXT,
ADD COLUMN IF NOT EXISTS autorabit_primary_color TEXT DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS vendor_name TEXT DEFAULT 'AutoRabit Cafeteria',
ADD COLUMN IF NOT EXISTS vendor_email TEXT,
ADD COLUMN IF NOT EXISTS vendor_address TEXT,
ADD COLUMN IF NOT EXISTS vendor_contact TEXT,
ADD COLUMN IF NOT EXISTS vendor_gst_number TEXT,
ADD COLUMN IF NOT EXISTS vendor_gst_percentage NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS vendor_brand_color TEXT DEFAULT '#EA580C',
ADD COLUMN IF NOT EXISTS vendor_description TEXT,
ADD COLUMN IF NOT EXISTS vendor_logo_url TEXT;

-- Update existing row with defaults if necessary
UPDATE public.company_settings 
SET 
    autorabit_primary_color = COALESCE(autorabit_primary_color, '#1E40AF'),
    vendor_name = COALESCE(vendor_name, 'AutoRabit Cafeteria'),
    vendor_gst_percentage = COALESCE(vendor_gst_percentage, 18),
    vendor_brand_color = COALESCE(vendor_brand_color, '#EA580C')
WHERE id = (SELECT id FROM public.company_settings LIMIT 1);
