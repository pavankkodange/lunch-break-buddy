-- First, let's add some additional sample profiles
INSERT INTO profiles (user_id, employee_number, full_name, company_email, department) VALUES
(gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@autorabit.com', 'Engineering'),
(gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@autorabit.com', 'Marketing'), 
(gen_random_uuid(), 'VEND001', 'Mike Wilson', 'mike@foodservice.com', 'Vendor'),
(gen_random_uuid(), 'VEND002', 'Lisa Brown', 'lisa@catering.com', 'Vendor')
ON CONFLICT (employee_number) DO NOTHING;

-- Now insert redemption data using the new profiles and avoiding duplicates
WITH new_users AS (
  SELECT user_id, employee_number FROM profiles WHERE employee_number IN ('EMP001', 'EMP002', 'VEND001', 'VEND002')
)
INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
SELECT 
  user_id, 
  employee_number,
  CURRENT_DATE - INTERVAL (days_back || ' days')::INTERVAL,
  CURRENT_TIMESTAMP - INTERVAL (days_back || ' days')::INTERVAL - INTERVAL (hours_back || ' hours')::INTERVAL
FROM new_users
CROSS JOIN (
  VALUES 
    (0, 1),   -- Today
    (1, 2),   -- Yesterday  
    (2, 3),   -- 2 days ago
    (3, 4),   -- 3 days ago
    (5, 1),   -- 5 days ago
    (7, 2),   -- 1 week ago
    (10, 3),  -- 10 days ago
    (14, 4)   -- 2 weeks ago
) AS dates(days_back, hours_back)
ON CONFLICT (user_id, redemption_date) DO NOTHING;