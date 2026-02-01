-- Migration: Add Broadcast feature columns to company_settings
-- Created at: 2026-01-30 14:00:00

ALTER TABLE IF EXISTS public.company_settings 
ADD COLUMN IF NOT EXISTS todays_special TEXT,
ADD COLUMN IF NOT EXISTS active_offers TEXT;
