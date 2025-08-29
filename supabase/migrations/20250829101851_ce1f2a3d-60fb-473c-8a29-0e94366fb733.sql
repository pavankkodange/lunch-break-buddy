-- Delete all profile records to start fresh
DELETE FROM public.profiles;

-- Also clear any meal redemptions and admin roles
DELETE FROM public.meal_redemptions;
DELETE FROM public.admin_roles;