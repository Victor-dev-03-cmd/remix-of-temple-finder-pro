-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view bookings by booking code" ON public.temple_bookings;

-- Create a secure function to check booking code access
CREATE OR REPLACE FUNCTION public.can_view_booking(booking_id uuid, provided_booking_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.temple_bookings
    WHERE id = booking_id
      AND booking_code = provided_booking_code
  )
$$;

-- Create a new secure SELECT policy that only allows:
-- 1. Admins to view all bookings (existing policy handles this)
-- 2. Authenticated users cannot see other users' bookings by default
-- Note: Booking lookup by code will be done through a secure RPC function
CREATE POLICY "Users cannot view bookings without proper access"
ON public.temple_bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create a secure RPC function for booking lookup by code
CREATE OR REPLACE FUNCTION public.get_booking_by_code(p_booking_code text)
RETURNS SETOF temple_bookings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.temple_bookings
  WHERE booking_code = p_booking_code
  LIMIT 1
$$;