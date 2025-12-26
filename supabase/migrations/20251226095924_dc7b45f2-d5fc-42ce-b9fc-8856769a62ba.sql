-- Create table for storing OTP verifications
CREATE TABLE public.vendor_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_otp TEXT,
  email_otp_expires_at TIMESTAMP WITH TIME ZONE,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  country_code TEXT,
  phone_otp TEXT,
  phone_otp_expires_at TIMESTAMP WITH TIME ZONE,
  verification_stage TEXT NOT NULL DEFAULT 'pre_submission', -- 'pre_submission' or 'post_approval'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own verifications
CREATE POLICY "Users can view their own verifications"
ON public.vendor_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications"
ON public.vendor_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications"
ON public.vendor_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
ON public.vendor_verifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add email_verified and phone_verified columns to vendor_applications
ALTER TABLE public.vendor_applications 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_country_code TEXT;

-- Create trigger for updating updated_at
CREATE TRIGGER update_vendor_verifications_updated_at
BEFORE UPDATE ON public.vendor_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();