-- Create a dummy vendor user for testing
-- Insert a test vendor profile (non-autorabit email)
INSERT INTO public.profiles (user_id, employee_number, full_name, company_email, department)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'VENDOR001',
  'Test Vendor User', 
  'vendor@testcompany.com',
  'Vendor Services'
) ON CONFLICT (user_id) DO UPDATE SET
  employee_number = EXCLUDED.employee_number,
  full_name = EXCLUDED.full_name,
  company_email = EXCLUDED.company_email,
  department = EXCLUDED.department;