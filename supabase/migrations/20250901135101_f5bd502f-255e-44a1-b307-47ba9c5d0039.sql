-- Add GST percentage field to company settings
ALTER TABLE public.company_settings 
ADD COLUMN gst_percentage numeric DEFAULT 18.0;