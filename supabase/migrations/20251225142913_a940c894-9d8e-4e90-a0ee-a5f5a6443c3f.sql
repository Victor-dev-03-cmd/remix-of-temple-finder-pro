-- Allow newly signed-up users to insert their own default customer role safely
-- (prevents privilege escalation by restricting role to 'customer')
CREATE POLICY "Users can insert default customer role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'customer'::public.app_role
);