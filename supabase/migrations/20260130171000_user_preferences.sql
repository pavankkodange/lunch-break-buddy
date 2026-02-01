-- Migration: Add user preference fields to profiles table
-- Created at: 2026-01-30 17:10:00

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lunch_timer_reminder BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT FALSE;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
