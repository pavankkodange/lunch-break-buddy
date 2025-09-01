-- Add foreign key relationship between meal_redemptions and profiles
ALTER TABLE public.meal_redemptions 
ADD CONSTRAINT fk_meal_redemptions_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;