-- Add country column to temples table
ALTER TABLE public.temples ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'LK';

-- Add preferred_language column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Create index for faster country filtering
CREATE INDEX IF NOT EXISTS idx_temples_country ON public.temples(country);

-- Update existing temples to have LK as default country (Sri Lanka)
UPDATE public.temples SET country = 'LK' WHERE country IS NULL;