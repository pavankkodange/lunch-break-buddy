-- Create a direct admin role assignment for your user
-- First, let's ensure your profile exists
INSERT INTO public.profiles (user_id, employee_number, full_name, company_email, department)
SELECT 
  u.id,
  'EMP' || EXTRACT(EPOCH FROM NOW())::BIGINT,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  u.email,
  'HR'
FROM auth.users u
WHERE u.email LIKE '%@autorabit.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT (user_id) DO UPDATE SET
  company_email = EXCLUDED.company_email,
  department = COALESCE(EXCLUDED.department, profiles.department);

-- Now assign admin role directly
INSERT INTO public.admin_roles (user_id, role)
SELECT u.id, 'autorabit_admin'::admin_role
FROM auth.users u
WHERE u.email LIKE '%@autorabit.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'autorabit_admin',
  updated_at = now();