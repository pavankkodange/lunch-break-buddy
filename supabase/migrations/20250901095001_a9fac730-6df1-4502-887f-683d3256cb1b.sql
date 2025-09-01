-- Disable email verification completely at project level
-- This affects the auth.email_confirmations table and auth settings

-- Update the auth configuration to disable email confirmation
UPDATE auth.config 
SET email_confirmations_enabled = false,
    enable_signup = true,
    double_confirm_changes = false
WHERE id = 1;

-- Also ensure company settings has email verification disabled
UPDATE public.company_settings 
SET email_verification_enabled = false
WHERE id = (SELECT id FROM public.company_settings LIMIT 1);

-- If no company settings exist, create one with email verification disabled
INSERT INTO public.company_settings (email_verification_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);