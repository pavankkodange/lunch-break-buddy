-- Fix security issue: Set search_path for the function with correct type reference
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_id UUID)
RETURNS public.admin_role AS $$
DECLARE
  user_role public.admin_role;
  user_email TEXT;
BEGIN
  -- Check if user has explicit admin role
  SELECT role INTO user_role 
  FROM public.admin_roles 
  WHERE admin_roles.user_id = get_user_admin_role.user_id;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Check if user is Autorabit employee (auto grant autorabit_admin)
  SELECT company_email INTO user_email 
  FROM public.profiles 
  WHERE profiles.user_id = get_user_admin_role.user_id;
  
  IF user_email LIKE '%@autorabit.com' THEN
    -- Auto-grant autorabit_admin role and insert record
    INSERT INTO public.admin_roles (user_id, role) 
    VALUES (get_user_admin_role.user_id, 'autorabit_admin')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 'autorabit_admin'::public.admin_role;
  END IF;
  
  -- Default to view_only for other authenticated users
  RETURN 'view_only_admin'::public.admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';