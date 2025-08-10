-- Fix create_or_get_profile to explicitly return columns in the correct order
CREATE OR REPLACE FUNCTION public.create_or_get_profile(
  p_user_id UUID,
  p_employee_number TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT '',
  p_company_email TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  employee_number TEXT,
  full_name TEXT,
  company_email TEXT,
  department TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_employee_number TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists for this user
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE profiles.user_id = p_user_id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Return existing profile with explicit column order
    RETURN QUERY 
      SELECT id, user_id, employee_number, full_name, company_email, department, created_at, updated_at
      FROM public.profiles 
      WHERE profiles.user_id = p_user_id;
    RETURN;
  END IF;
  
  -- Generate unique employee number if not provided or if it already exists
  new_employee_number := p_employee_number;
  
  IF new_employee_number IS NULL OR new_employee_number = '' OR 
     EXISTS(SELECT 1 FROM public.profiles WHERE profiles.employee_number = new_employee_number) THEN
    new_employee_number := 'EMP' || EXTRACT(EPOCH FROM NOW())::BIGINT || LPAD((RANDOM() * 999)::INT::TEXT, 3, '0');
  END IF;
  
  -- Insert new profile
  INSERT INTO public.profiles (user_id, employee_number, full_name, company_email)
  VALUES (p_user_id, new_employee_number, p_full_name, p_company_email);
  
  -- Return the new profile with explicit column order
  RETURN QUERY 
    SELECT id, user_id, employee_number, full_name, company_email, department, created_at, updated_at
    FROM public.profiles 
    WHERE profiles.user_id = p_user_id;
END;
$$;