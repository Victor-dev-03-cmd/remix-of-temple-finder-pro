-- Create temple_gallery_images table for vendor temple galleries
CREATE TABLE public.temple_gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID NOT NULL REFERENCES public.temples(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temple_gallery_images ENABLE ROW LEVEL SECURITY;

-- Public can view active gallery images for active temples
CREATE POLICY "Active gallery images are publicly viewable"
ON public.temple_gallery_images
FOR SELECT
USING (
  is_active = true AND 
  EXISTS (SELECT 1 FROM temples WHERE temples.id = temple_gallery_images.temple_id AND temples.is_active = true)
);

-- Admins can manage all gallery images
CREATE POLICY "Admins can manage all gallery images"
ON public.temple_gallery_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Vendors can manage their own temple's gallery images
CREATE POLICY "Vendors can manage their temple gallery images"
ON public.temple_gallery_images
FOR ALL
USING (
  EXISTS (SELECT 1 FROM temples WHERE temples.id = temple_gallery_images.temple_id AND temples.owner_user_id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_temple_gallery_images_updated_at
BEFORE UPDATE ON public.temple_gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_temple_gallery_images_temple_id ON public.temple_gallery_images(temple_id);
CREATE INDEX idx_temple_gallery_images_display_order ON public.temple_gallery_images(temple_id, display_order);