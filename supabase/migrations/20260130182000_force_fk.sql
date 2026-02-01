-- Force Recreation of Foreign Key for Reports
-- Created at: 2026-01-30 18:20:00

-- Explicitly drop the constraint to ensure we start fresh
ALTER TABLE public.meal_redemptions 
DROP CONSTRAINT IF EXISTS meal_redemptions_user_id_fkey_profiles;

-- Re-add the constraint with the EXACT name we are using in the API hint
ALTER TABLE public.meal_redemptions 
ADD CONSTRAINT meal_redemptions_user_id_fkey_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Ensure RLS is set up (redundant safety check)
ALTER TABLE public.meal_redemptions ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache to ensure it sees the new FK
NOTIFY pgrst, 'reload schema';
