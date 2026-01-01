-- Enable realtime for vendor_balances table
ALTER TABLE public.vendor_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_balances;

-- Enable realtime for withdrawal_requests table
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;