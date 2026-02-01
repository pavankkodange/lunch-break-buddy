-- Migration: Add missing AutoRABIT corporate identity fields
-- Created at: 2026-01-30 15:55:00

ALTER TABLE IF EXISTS public.company_settings 
ADD COLUMN IF NOT EXISTS autorabit_contact_primary TEXT,
ADD COLUMN IF NOT EXISTS autorabit_contact_secondary TEXT,
ADD COLUMN IF NOT EXISTS autorabit_official_address TEXT,
ADD COLUMN IF NOT EXISTS autorabit_support_hours TEXT,
ADD COLUMN IF NOT EXISTS autorabit_website TEXT DEFAULT 'https://www.autorabit.com',
ADD COLUMN IF NOT EXISTS autorabit_gst_number TEXT;

-- Reload schema cache to ensure PostgREST sees the new columns
NOTIFY pgrst, 'reload schema';
