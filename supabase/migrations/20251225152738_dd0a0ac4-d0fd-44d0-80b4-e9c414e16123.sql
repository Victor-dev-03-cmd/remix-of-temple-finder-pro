-- Add RLS policy for vendors to view bookings for their temple
CREATE POLICY "Vendors can view bookings for their temple"
ON public.temple_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_bookings.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);

-- Add RLS policy for vendors to update bookings for their temple
CREATE POLICY "Vendors can update bookings for their temple"
ON public.temple_bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.temples
    WHERE temples.id = temple_bookings.temple_id
    AND temples.owner_user_id = auth.uid()
  )
);