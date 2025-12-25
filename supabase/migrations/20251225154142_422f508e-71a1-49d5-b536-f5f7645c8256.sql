-- Create temple_tickets table for vendors to manage ticket types
CREATE TABLE public.temple_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_id UUID NOT NULL REFERENCES public.temples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temple_tickets ENABLE ROW LEVEL SECURITY;

-- Public can view active tickets for active temples
CREATE POLICY "Active tickets are publicly viewable"
ON public.temple_tickets
FOR SELECT
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM public.temples 
    WHERE temples.id = temple_tickets.temple_id 
    AND temples.is_active = true
  )
);

-- Vendors can manage their own temple's tickets
CREATE POLICY "Vendors can insert tickets for their temple"
ON public.temple_tickets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_tickets.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update their temple tickets"
ON public.temple_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_tickets.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can delete their temple tickets"
ON public.temple_tickets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_tickets.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);

-- Vendors can view their own temple tickets (including inactive)
CREATE POLICY "Vendors can view their temple tickets"
ON public.temple_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_tickets.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.temple_tickets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_temple_tickets_updated_at
BEFORE UPDATE ON public.temple_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add storage policies for temple-images bucket (vendors can upload)
CREATE POLICY "Vendors can upload temple images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'temple-images' AND
  has_role(auth.uid(), 'vendor'::app_role)
);

CREATE POLICY "Vendors can update their temple images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'temple-images' AND
  has_role(auth.uid(), 'vendor'::app_role)
);

CREATE POLICY "Vendors can delete their temple images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'temple-images' AND
  has_role(auth.uid(), 'vendor'::app_role)
);

CREATE POLICY "Temple images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'temple-images');