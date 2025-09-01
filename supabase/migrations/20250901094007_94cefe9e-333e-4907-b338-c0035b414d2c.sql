-- Insert default company settings if table is empty
INSERT INTO public.company_settings (email_verification_enabled) 
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);