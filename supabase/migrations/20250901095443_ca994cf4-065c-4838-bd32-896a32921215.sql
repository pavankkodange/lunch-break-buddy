-- Extend the admin_role enum to include HR and Employee roles
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'hr_admin';
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'employee';

-- Update the get_user_admin_role function to handle new roles
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_id uuid)
RETURNS admin_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_role public.admin_role;
  user_email TEXT;
  user_department TEXT;
BEGIN
  -- Check if user has explicit admin role
  SELECT role INTO user_role 
  FROM public.admin_roles 
  WHERE admin_roles.user_id = get_user_admin_role.user_id;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Check if user is HR department employee (auto grant hr_admin)
  SELECT company_email, department INTO user_email, user_department
  FROM public.profiles 
  WHERE profiles.user_id = get_user_admin_role.user_id;
  
  IF user_email LIKE '%@autorabit.com' AND LOWER(user_department) = 'hr' THEN
    -- Auto-grant hr_admin role and insert record
    INSERT INTO public.admin_roles (user_id, role) 
    VALUES (get_user_admin_role.user_id, 'hr_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'hr_admin';
    RETURN 'hr_admin'::public.admin_role;
  END IF;
  
  -- Default to employee for authenticated users
  RETURN 'employee'::public.admin_role;
END;
$function$