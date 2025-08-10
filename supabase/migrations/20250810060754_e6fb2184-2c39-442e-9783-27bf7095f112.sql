-- Force correct return structure by dropping and recreating the function with explicit column aliasing
DROP FUNCTION IF EXISTS public.create_or_get_profile(UUID, TEXT, TEXT, TEXT);

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
  SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Return existing profile with explicit column aliasing and order
    RETURN QUERY 
      SELECT 
        p.id::uuid,
        p.user_id::uuid,
        p.employee_number::text,
        p.full_name::text,
        p.company_email::text,
        p.department::text,
        p.created_at::timestamptz,
        p.updated_at::timestamptz
      FROM public.profiles AS p
      WHERE p.user_id = p_user_id;
    RETURN;
  END IF;
  
  -- Generate unique employee number if not provided or if it already exists
  new_employee_number := p_employee_number;
  
  IF new_employee_number IS NULL OR new_employee_number = '' OR 
     EXISTS(SELECT 1 FROM public.profiles p WHERE p.employee_number = new_employee_number) THEN
    new_employee_number := 'EMP' || EXTRACT(EPOCH FROM NOW())::BIGINT || LPAD((RANDOM() * 999)::INT::TEXT, 3, '0');
  END IF;
  
  -- Insert new profile
  INSERT INTO public.profiles (user_id, employee_number, full_name, company_email)
  VALUES (p_user_id, new_employee_number, p_full_name, p_company_email);
  
  -- Return the new profile with explicit column aliasing and order
  RETURN QUERY 
    SELECT 
      p.id::uuid,
      p.user_id::uuid,
      p.employee_number::text,
      p.full_name::text,
      p.company_email::text,
      p.department::text,
      p.created_at::timestamptz,
      p.updated_at::timestamptz
    FROM public.profiles AS p
    WHERE p.user_id = p_user_id;
END;
$$;