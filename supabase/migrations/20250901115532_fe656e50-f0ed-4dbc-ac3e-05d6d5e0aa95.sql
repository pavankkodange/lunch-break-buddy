-- Update the get_user_admin_role function to support HR admin assignment
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

  -- Grant autorabit_admin to any @autorabit.com email (for backward compatibility)
  IF user_email IS NOT NULL AND user_email LIKE '%@autorabit.com' THEN
    -- Check if it's a specific HR email pattern or admin email
    IF user_email LIKE '%hr@autorabit.com' OR user_email LIKE '%hr.%@autorabit.com' OR user_email LIKE '%human.resources%@autorabit.com' THEN
      -- Insert the HR admin role record
      INSERT INTO public.admin_roles (user_id, role) 
      VALUES (get_user_admin_role.user_id, 'hr_admin')
      ON CONFLICT (user_id) DO UPDATE SET 
        role = 'hr_admin',
        updated_at = now();
      
      RETURN 'hr_admin'::public.admin_role;
    ELSE
      -- Insert the autorabit admin role record for other @autorabit.com emails
      INSERT INTO public.admin_roles (user_id, role) 
      VALUES (get_user_admin_role.user_id, 'autorabit_admin')
      ON CONFLICT (user_id) DO UPDATE SET 
        role = 'autorabit_admin',
        updated_at = now();
      
      RETURN 'autorabit_admin'::public.admin_role;
    END IF;
  END IF;

  -- Default to employee for other authenticated users
  RETURN 'employee'::public.admin_role;
END;
$function$;

-- Create a helper function to manually assign HR roles (for admin use)
CREATE OR REPLACE FUNCTION public.assign_hr_role(target_user_id uuid, assigner_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  assigner_role public.admin_role;
BEGIN
  -- Check if the assigner has permission (must be autorabit_admin)
  SELECT public.get_user_admin_role(assigner_user_id) INTO assigner_role;
  
  IF assigner_role != 'autorabit_admin' THEN
    RAISE EXCEPTION 'Only Autorabit administrators can assign HR roles';
  END IF;
  
  -- Assign HR role to target user
  INSERT INTO public.admin_roles (user_id, role, granted_by) 
  VALUES (target_user_id, 'hr_admin', assigner_user_id)
  ON CONFLICT (user_id) DO UPDATE SET 
    role = 'hr_admin',
    granted_by = assigner_user_id,
    updated_at = now();
    
  RETURN true;
END;
$function$;

-- Insert a comment to track this migration
INSERT INTO public.admin_roles (user_id, role, granted_by) 
SELECT 
  u.id,
  'hr_admin'::admin_role,
  u.id
FROM auth.users u 
WHERE u.email LIKE '%hr@autorabit.com' 
   OR u.email LIKE '%hr.%@autorabit.com'
   OR u.email LIKE '%human.resources%@autorabit.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'hr_admin',
  updated_at = now();