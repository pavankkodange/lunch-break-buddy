-- Robust Fix: Use a View for Reports and Ensure Settings Exist
-- Created at: 2026-01-30 18:30:00

-- 1. Create a View for Vendor Reports
-- This abstracts the join complexity away from the API client
create or replace view public.vendor_reports_view as
select 
    mr.id as redemption_id,
    mr.redemption_date,
    mr.redemption_time,
    mr.employee_number as scanned_employee_id,
    p.full_name as employee_name,
    p.department,
    p.employee_number as profile_employee_id
from public.meal_redemptions mr
left join public.profiles p on mr.user_id = p.user_id;

-- 2. Grant permissions on the view
alter view public.vendor_reports_view owner to postgres;
grant select on public.vendor_reports_view to authenticated;
grant select on public.vendor_reports_view to service_role;

-- 3. Ensure company_settings has a row (FIX for Broadcast update failing if empty)
insert into public.company_settings (company_name, coupon_value, gst_percentage)
select 'Lunch Buddy', 160, 18
where not exists (select 1 from public.company_settings);

-- Reload schema
notify pgrst, 'reload schema';
