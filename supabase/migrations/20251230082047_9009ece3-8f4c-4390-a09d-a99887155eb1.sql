-- Create product_variants table
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_balances table for earnings and withdrawals
CREATE TABLE public.vendor_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL UNIQUE,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  withdrawn_amount NUMERIC NOT NULL DEFAULT 0,
  min_withdrawal_amount NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS for product_variants
CREATE POLICY "Product variants are publicly viewable" 
ON public.product_variants FOR SELECT 
USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.status = 'approved'));

CREATE POLICY "Vendors can manage their product variants" 
ON public.product_variants FOR ALL 
USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.vendor_id = auth.uid()));

CREATE POLICY "Admins can manage all variants" 
ON public.product_variants FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for vendor_balances
CREATE POLICY "Vendors can view their own balance" 
ON public.vendor_balances FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all balances" 
ON public.vendor_balances FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert balance records" 
ON public.vendor_balances FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

-- RLS for withdrawal_requests
CREATE POLICY "Vendors can view their own withdrawals" 
ON public.withdrawal_requests FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create withdrawals" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all withdrawals" 
ON public.withdrawal_requests FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update vendor balance on order completion
CREATE OR REPLACE FUNCTION public.update_vendor_balance_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_commission_rate NUMERIC;
  v_vendor_amount NUMERIC;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Get commission rate from site settings
    SELECT COALESCE(commission_rate, 10) INTO v_commission_rate FROM site_settings LIMIT 1;
    
    -- Calculate vendor amount after commission
    v_vendor_amount := NEW.total_amount * (1 - v_commission_rate / 100);
    
    -- Insert or update vendor balance
    INSERT INTO vendor_balances (vendor_id, total_earnings, available_balance)
    VALUES (NEW.vendor_id, v_vendor_amount, v_vendor_amount)
    ON CONFLICT (vendor_id) DO UPDATE SET
      total_earnings = vendor_balances.total_earnings + v_vendor_amount,
      available_balance = vendor_balances.available_balance + v_vendor_amount,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for order completion
CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_balance_on_order();

-- Create indexes
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_vendor_balances_vendor_id ON public.vendor_balances(vendor_id);
CREATE INDEX idx_withdrawal_requests_vendor_id ON public.withdrawal_requests(vendor_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Update triggers
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_balances_updated_at BEFORE UPDATE ON public.vendor_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();