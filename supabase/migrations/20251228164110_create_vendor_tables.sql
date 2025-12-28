
-- Create the table for vendor applications
CREATE TABLE vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the table for approved vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  application_id UUID REFERENCES vendor_applications(id) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a function for users to request vendor status
CREATE OR REPLACE FUNCTION request_vendor_status(business_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO vendor_applications (user_id, business_name)
  VALUES (auth.uid(), business_name);
END;
$$ LANGUAGE plpgsql;
