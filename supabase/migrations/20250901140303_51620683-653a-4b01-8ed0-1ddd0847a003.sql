-- Create vendor settings table  
CREATE TABLE public.vendor_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL DEFAULT 'Food Service Provider',
  vendor_address TEXT,
  vendor_email TEXT,
  vendor_contact TEXT,
  vendor_gst_number TEXT,
  vendor_gst_percentage NUMERIC DEFAULT 18.0,
  vendor_logo_url TEXT,
  vendor_primary_color TEXT DEFAULT '#059669',
  service_description TEXT DEFAULT 'Professional meal coupon services for corporate employees',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own settings
CREATE POLICY "Vendors can view their own settings"
ON public.vendor_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own settings"
ON public.vendor_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert their own settings"
ON public.vendor_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- AutoRABIT admins can view all vendor settings
CREATE POLICY "Admins can view all vendor settings"
ON public.vendor_settings
FOR SELECT
USING (public.get_user_admin_role(auth.uid()) = 'autorabit_admin'::admin_role);

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_settings_updated_at
BEFORE UPDATE ON public.vendor_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();