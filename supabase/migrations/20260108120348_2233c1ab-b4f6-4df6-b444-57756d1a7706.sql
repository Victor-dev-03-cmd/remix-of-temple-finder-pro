-- Add dark mode logo and logo size columns to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 40;