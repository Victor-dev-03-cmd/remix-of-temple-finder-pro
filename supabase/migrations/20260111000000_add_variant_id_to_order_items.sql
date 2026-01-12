ALTER TABLE public.order_items
  ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;
