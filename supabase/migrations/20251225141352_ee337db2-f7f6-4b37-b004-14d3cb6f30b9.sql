-- Add country column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN country text DEFAULT 'LK';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.country IS 'User selected country code (e.g., LK, MY, IN)';