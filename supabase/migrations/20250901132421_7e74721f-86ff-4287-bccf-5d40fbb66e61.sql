-- Insert sample meal redemption data for testing invoices
INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time) VALUES
-- Today's data (for daily invoice testing)
('25bf96d6-dda1-4f67-9188-ce75120c3d89', '284', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('3dc02071-f02d-45fb-9787-b8b3911e3b7a', 'VENDOR_1756728850099', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- Yesterday's data
('25bf96d6-dda1-4f67-9188-ce75120c3d89', '284', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '3 hours'),

-- This week's data (Monday to today)
('3dc02071-f02d-45fb-9787-b8b3911e3b7a', 'VENDOR_1756728850099', CURRENT_DATE - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '4 hours'),
('25bf96d6-dda1-4f67-9188-ce75120c3d89', '284', CURRENT_DATE - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '2 hours'),

-- This month's data (spread across the month)
('3dc02071-f02d-45fb-9787-b8b3911e3b7a', 'VENDOR_1756728850099', CURRENT_DATE - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' - INTERVAL '1 hour'),
('25bf96d6-dda1-4f67-9188-ce75120c3d89', '284', CURRENT_DATE - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' - INTERVAL '3 hours'),
('3dc02071-f02d-45fb-9787-b8b3911e3b7a', 'VENDOR_1756728850099', CURRENT_DATE - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days' - INTERVAL '2 hours'),
('25bf96d6-dda1-4f67-9188-ce75120c3d89', '284', CURRENT_DATE - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days' - INTERVAL '4 hours'),
('3dc02071-f02d-45fb-9787-b8b3911e3b7a', 'VENDOR_1756728850099', CURRENT_DATE - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days' - INTERVAL '1 hour');

-- Let's also add some additional sample profiles for more realistic data
INSERT INTO profiles (user_id, employee_number, full_name, company_email, department) VALUES
(gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@autorabit.com', 'Engineering'),
(gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@autorabit.com', 'Marketing'), 
(gen_random_uuid(), 'VEND001', 'Mike Wilson', 'mike@foodservice.com', 'Vendor'),
(gen_random_uuid(), 'VEND002', 'Lisa Brown', 'lisa@catering.com', 'Vendor')
ON CONFLICT (employee_number) DO NOTHING;