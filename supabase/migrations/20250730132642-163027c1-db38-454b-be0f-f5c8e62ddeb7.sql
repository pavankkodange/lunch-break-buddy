-- Create profiles table for employee authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create meal redemptions table
CREATE TABLE public.meal_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number TEXT NOT NULL,
  redemption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  redemption_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, redemption_date)
);

-- Enable Row Level Security on meal_redemptions
ALTER TABLE public.meal_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for meal redemptions
CREATE POLICY "Users can view their own redemptions" 
ON public.meal_redemptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert redemptions" 
ON public.meal_redemptions 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_meal_redemptions_user_date ON public.meal_redemptions(user_id, redemption_date);
CREATE INDEX idx_meal_redemptions_employee_date ON public.meal_redemptions(employee_number, redemption_date);