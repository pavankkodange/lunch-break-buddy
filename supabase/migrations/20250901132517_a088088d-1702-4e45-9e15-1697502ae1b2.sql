-- Add sample profiles first
INSERT INTO profiles (user_id, employee_number, full_name, company_email, department) VALUES
(gen_random_uuid(), 'EMP001', 'John Smith', 'john.smith@autorabit.com', 'Engineering'),
(gen_random_uuid(), 'EMP002', 'Sarah Johnson', 'sarah.johnson@autorabit.com', 'Marketing'), 
(gen_random_uuid(), 'VEND001', 'Mike Wilson', 'mike@foodservice.com', 'Vendor'),
(gen_random_uuid(), 'VEND002', 'Lisa Brown', 'lisa@catering.com', 'Vendor')
ON CONFLICT (employee_number) DO NOTHING;

-- Add sample redemption data for testing
-- Get user IDs for the new profiles
DO $$
DECLARE
    emp001_id UUID;
    emp002_id UUID; 
    vend001_id UUID;
    vend002_id UUID;
BEGIN
    -- Get user IDs
    SELECT user_id INTO emp001_id FROM profiles WHERE employee_number = 'EMP001' LIMIT 1;
    SELECT user_id INTO emp002_id FROM profiles WHERE employee_number = 'EMP002' LIMIT 1;
    SELECT user_id INTO vend001_id FROM profiles WHERE employee_number = 'VEND001' LIMIT 1;
    SELECT user_id INTO vend002_id FROM profiles WHERE employee_number = 'VEND002' LIMIT 1;
    
    -- Insert sample data if we found the users
    IF emp001_id IS NOT NULL THEN
        -- Today's data
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time) 
        VALUES (emp001_id, 'EMP001', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '1 hour')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- Yesterday's data  
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp001_id, 'EMP001', CURRENT_DATE - 1, CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '2 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 3 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp001_id, 'EMP001', CURRENT_DATE - 3, CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '1 hour')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 1 week ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp001_id, 'EMP001', CURRENT_DATE - 7, CURRENT_TIMESTAMP - INTERVAL '7 days' - INTERVAL '3 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
    END IF;
    
    IF emp002_id IS NOT NULL THEN
        -- Today's data
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp002_id, 'EMP002', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '30 minutes')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 2 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp002_id, 'EMP002', CURRENT_DATE - 2, CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '4 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 5 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (emp002_id, 'EMP002', CURRENT_DATE - 5, CURRENT_TIMESTAMP - INTERVAL '5 days' - INTERVAL '2 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
    END IF;
    
    IF vend001_id IS NOT NULL THEN
        -- Yesterday
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (vend001_id, 'VEND001', CURRENT_DATE - 1, CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '1 hour')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 4 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (vend001_id, 'VEND001', CURRENT_DATE - 4, CURRENT_TIMESTAMP - INTERVAL '4 days' - INTERVAL '3 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
    END IF;
    
    IF vend002_id IS NOT NULL THEN
        -- 6 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (vend002_id, 'VEND002', CURRENT_DATE - 6, CURRENT_TIMESTAMP - INTERVAL '6 days' - INTERVAL '2 hours')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
        
        -- 10 days ago
        INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
        VALUES (vend002_id, 'VEND002', CURRENT_DATE - 10, CURRENT_TIMESTAMP - INTERVAL '10 days' - INTERVAL '1 hour')
        ON CONFLICT (user_id, redemption_date) DO NOTHING;
    END IF;
END $$;