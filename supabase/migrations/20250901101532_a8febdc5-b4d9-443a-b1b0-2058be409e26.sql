-- Debug and fix admin role detection
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_id uuid)
RETURNS admin_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role public.admin_role;
  user_email TEXT;
  auth_email TEXT;
BEGIN
  -- Check if user has explicit admin role first
  SELECT role INTO user_role 
  FROM public.admin_roles 
  WHERE admin_roles.user_id = get_user_admin_role.user_id;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;

  -- Get email from profiles table
  SELECT company_email INTO user_email
  FROM public.profiles 
  WHERE profiles.user_id = get_user_admin_role.user_id;

  -- If profile email not found, get from auth.users
  IF user_email IS NULL OR user_email = '' THEN
    SELECT email INTO auth_email
    FROM auth.users 
    WHERE id = get_user_admin_role.user_id;
    user_email := auth_email;
  END IF;

  -- Grant autorabit_admin to any @autorabit.com email
  IF user_email IS NOT NULL AND user_email LIKE '%@autorabit.com' THEN
    -- Insert the admin role record
    INSERT INTO public.admin_roles (user_id, role) 
    VALUES (get_user_admin_role.user_id, 'autorabit_admin')
    ON CONFLICT (user_id) DO UPDATE SET 
      role = 'autorabit_admin',
      updated_at = now();
    
    RETURN 'autorabit_admin'::public.admin_role;
  END IF;

  -- Default to employee for other authenticated users
  RETURN 'employee'::public.admin_role;
END;
$function$;