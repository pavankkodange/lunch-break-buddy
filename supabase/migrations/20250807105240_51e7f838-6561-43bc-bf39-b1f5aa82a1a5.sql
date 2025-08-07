-- Fix the trigger to handle empty employee numbers properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, employee_number, full_name, company_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'employee_number', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_email', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a duplicate, just update the existing record
    UPDATE public.profiles 
    SET 
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      company_email = COALESCE(NEW.raw_user_meta_data->>'company_email', NEW.email)
    WHERE user_id = NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;