-- Add public read access for site_settings so the frontend can display site name, colors, hero, footer etc.
-- Keep admin-only access for INSERT and UPDATE

CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Drop the admin-only select policy since we now have public read access
DROP POLICY IF EXISTS "Admins can view site settings" ON public.site_settings;