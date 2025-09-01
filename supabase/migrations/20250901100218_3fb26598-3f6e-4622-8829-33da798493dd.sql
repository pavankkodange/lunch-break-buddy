-- Fix the get_user_admin_role function to properly detect Autorabit admins
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_id uuid)
RETURNS admin_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  
  -- Check if user is Autorabit employee (auto grant autorabit_admin)
  SELECT company_email, department INTO user_email, user_department
  FROM public.profiles 
  WHERE profiles.user_id = get_user_admin_role.user_id;
  
  -- Grant autorabit_admin to any @autorabit.com email
  IF user_email LIKE '%@autorabit.com' THEN
    -- Auto-grant autorabit_admin role and insert record
    INSERT INTO public.admin_roles (user_id, role) 
    VALUES (get_user_admin_role.user_id, 'autorabit_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'autorabit_admin';
    RETURN 'autorabit_admin'::public.admin_role;
  END IF;
  
  -- Default to employee for authenticated users
  RETURN 'employee'::public.admin_role;
END;
$function$