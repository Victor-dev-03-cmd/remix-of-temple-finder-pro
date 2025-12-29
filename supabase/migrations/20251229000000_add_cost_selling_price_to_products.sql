ALTER TABLE public.products
  ADD COLUMN cost_price numeric,
  ADD COLUMN selling_price numeric;

UPDATE public.products
SET selling_price = price;

ALTER TABLE public.products
DROP COLUMN price;
