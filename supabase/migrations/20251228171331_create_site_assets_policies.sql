-- Allow public read access to all objects
CREATE POLICY "Public read access for site assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Allow admins to insert new objects
CREATE POLICY "Admins can insert site assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role) );

-- Allow admins to update existing objects
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role) );

-- Allow admins to delete objects
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role) );