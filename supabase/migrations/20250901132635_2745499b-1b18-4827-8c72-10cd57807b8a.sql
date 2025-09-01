-- Add more sample profiles first
INSERT INTO profiles (user_id, employee_number, full_name, company_email, department) VALUES
(gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@autorabit.com', 'Engineering'),
(gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@autorabit.com', 'Marketing'), 
(gen_random_uuid(), 'EMP003', 'David Lee', 'david.lee@autorabit.com', 'QA'),
(gen_random_uuid(), 'VEND001', 'Mike Wilson', 'mike@foodservice.com', 'Vendor'),
(gen_random_uuid(), 'VEND002', 'Lisa Brown', 'lisa@catering.com', 'Vendor')
ON CONFLICT (employee_number) DO NOTHING;

-- Get the new user IDs for sample data
WITH new_users AS (
  SELECT user_id, employee_number FROM profiles 
  WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'VEND001', 'VEND002')
)
INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
SELECT 
  nu.user_id,
  nu.employee_number,
  CURRENT_DATE - (days_ago || ' days')::INTERVAL,
  CURRENT_TIMESTAMP - (days_ago || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL
FROM new_users nu
CROSS JOIN (
  VALUES 
    (0, 2),   -- Today, 2 hours ago
    (1, 3),   -- Yesterday, 3 hours ago  
    (2, 1),   -- 2 days ago, 1 hour ago
    (3, 4),   -- 3 days ago, 4 hours ago
    (5, 2),   -- 5 days ago, 2 hours ago
    (7, 3),   -- 1 week ago, 3 hours ago
    (10, 1),  -- 10 days ago, 1 hour ago
    (12, 4),  -- 12 days ago, 4 hours ago
    (15, 2)   -- 15 days ago, 2 hours ago
) AS dates(days_ago, hour_offset)
WHERE NOT EXISTS (
  SELECT 1 FROM meal_redemptions mr 
  WHERE mr.user_id = nu.user_id 
  AND mr.redemption_date = CURRENT_DATE - (days_ago || ' days')::INTERVAL
)
LIMIT 25;