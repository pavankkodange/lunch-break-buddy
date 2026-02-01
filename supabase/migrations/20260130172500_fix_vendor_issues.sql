-- Fix Vendor App Issues
-- Created at: 2026-01-30 17:25:00

-- 1. Add "Broadcast" columns to company_settings
ALTER TABLE IF EXISTS public.company_settings 
ADD COLUMN IF NOT EXISTS todays_special TEXT,
ADD COLUMN IF NOT EXISTS active_offers TEXT;

-- 2. Add Foreign Key for Reports (Enable joining profiles in meal_redemptions)
-- Ensure profiles.user_id is unique (it should be, but let's be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add FK from meal_redemptions.user_id to profiles.user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'meal_redemptions_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.meal_redemptions 
        ADD CONSTRAINT meal_redemptions_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- 3. RLS Permissions
-- Allow Vendors (authenticated users) to update company_settings (for Broadcast)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow update for authenticated' AND tablename = 'company_settings'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON public.company_settings
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Allow Vendors to view all meal_redemptions (for Reports)
-- Assuming currently they might be restricted to their own?
-- For now, let's open it up to authenticated users for the demo
ALTER TABLE public.meal_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow view all for authenticated' AND tablename = 'meal_redemptions'
    ) THEN
        CREATE POLICY "Allow view all for authenticated" ON public.meal_redemptions
        FOR SELECT TO authenticated
        USING (true);
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
