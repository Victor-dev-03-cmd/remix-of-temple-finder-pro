CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    shipping_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own customers" 
ON customers 
FOR ALL 
TO authenticated 
USING (vendor_id = auth.uid());
