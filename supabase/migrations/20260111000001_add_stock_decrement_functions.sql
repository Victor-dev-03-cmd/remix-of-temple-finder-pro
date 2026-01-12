CREATE OR REPLACE FUNCTION decrement_product_stock(row_id UUID, quantity_to_remove INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - quantity_to_remove)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_variant_stock(row_id UUID, quantity_to_remove INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = GREATEST(0, stock - quantity_to_remove)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
