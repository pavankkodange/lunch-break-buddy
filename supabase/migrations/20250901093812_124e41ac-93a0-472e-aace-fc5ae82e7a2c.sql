-- Add email verification toggle to company settings
ALTER TABLE public.company_settings 
ADD COLUMN email_verification_enabled boolean DEFAULT false;