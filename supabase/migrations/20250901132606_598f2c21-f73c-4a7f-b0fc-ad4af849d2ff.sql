-- Add sample meal redemption data using existing users
-- First, let's see what users we have and create redemptions for them on different dates

WITH existing_users AS (
    SELECT user_id, employee_number FROM profiles LIMIT 2
),
date_variations AS (
    SELECT 
        CURRENT_DATE as date_val,
        'today' as period_label
    UNION ALL
    SELECT 
        CURRENT_DATE - 1,
        'yesterday'
    UNION ALL  
    SELECT 
        CURRENT_DATE - 2,
        '2_days_ago'
    UNION ALL
    SELECT 
        CURRENT_DATE - 3, 
        '3_days_ago'
    UNION ALL
    SELECT 
        CURRENT_DATE - 5,
        '5_days_ago'
    UNION ALL
    SELECT 
        CURRENT_DATE - 7,
        '1_week_ago'
    UNION ALL
    SELECT 
        CURRENT_DATE - 10,
        '10_days_ago'
    UNION ALL
    SELECT 
        CURRENT_DATE - 14,
        '2_weeks_ago'
)
INSERT INTO meal_redemptions (user_id, employee_number, redemption_date, redemption_time)
SELECT 
    u.user_id,
    u.employee_number,
    d.date_val,
    d.date_val::timestamp + INTERVAL '12 hours' + (RANDOM() * INTERVAL '4 hours') - INTERVAL '2 hours'
FROM existing_users u
CROSS JOIN date_variations d
ON CONFLICT (user_id, redemption_date) DO NOTHING;