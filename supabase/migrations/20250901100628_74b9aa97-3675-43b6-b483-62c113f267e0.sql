-- Enhance get_user_admin_role to fallback to auth.users email when profile missing
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_id uuid)
RETURNS admin_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role public.admin_role;
  user_email TEXT;
BEGIN
  -- If explicit admin role exists, return it
  SELECT role INTO user_role 
  FROM public.admin_roles 
  WHERE admin_roles.user_id = get_user_admin_role.user_id;
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;

  -- Try to get email from profiles
  SELECT p.company_email INTO user_email
  FROM public.profiles p
  WHERE p.user_id = get_user_admin_role.user_id;

  -- If not found, fallback to auth.users email
  IF user_email IS NULL THEN
    SELECT u.email INTO user_email
    FROM auth.users u
    WHERE u.id = get_user_admin_role.user_id;
  END IF;

  -- Grant Autorabit admin if email matches domain
  IF user_email LIKE '%@autorabit.com' THEN
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (get_user_admin_role.user_id, 'autorabit_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'autorabit_admin';
    RETURN 'autorabit_admin'::public.admin_role;
  END IF;

  RETURN 'employee'::public.admin_role;
END;
$function$;

-- RLS: allow admins to view all redemptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='meal_redemptions' AND policyname='Admins can view all redemptions'
  ) THEN
    CREATE POLICY "Admins can view all redemptions"
    ON public.meal_redemptions
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM get_user_admin_role(auth.uid()) r(role)
      WHERE r.role = 'autorabit_admin'::admin_role
    ));
  END IF;
END $$;

-- RLS: allow admins to view all profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM get_user_admin_role(auth.uid()) r(role)
      WHERE r.role = 'autorabit_admin'::admin_role
    ));
  END IF;
END $$;