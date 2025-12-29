
CREATE OR REPLACE FUNCTION get_vendor_customer_details()
RETURNS TABLE (
    customer_id uuid,
    full_name text,
    email text,
    contact_number text,
    total_orders bigint,
    total_spent numeric,
    last_order_date timestamptz,
    shipping_address jsonb,
    last_product_name text,
    last_product_sku text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the function is secure and respects row-level security by setting the role
    -- This is a placeholder; you should use the appropriate role for your application
    -- SET LOCAL ROLE authenticated;

    RETURN QUERY
    WITH vendor_order_items AS (
        -- Find all order items belonging to the current authenticated vendor
        SELECT oi.order_id, oi.product_id
        FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE p.vendor_id = auth.uid()
    ),
    vendor_orders AS (
        -- Find all unique orders containing the vendor's products and link them to the customer
        SELECT DISTINCT
            o.id as order_id,
            o.user_id,
            o.created_at,
            o.total_price,
            o.shipping_address
        FROM public.orders o
        WHERE o.id IN (SELECT order_id FROM vendor_order_items)
    ),
    customer_stats AS (
        -- Aggregate statistics for each customer based on the vendor's orders
        SELECT
            vo.user_id,
            COUNT(DISTINCT vo.order_id) as total_orders,
            SUM(vo.total_price) as total_spent,
            MAX(vo.created_at) as last_order_date
        FROM vendor_orders vo
        GROUP BY vo.user_id
    ),
    last_order_per_customer AS (
        -- For each customer, find their most recent order ID
        SELECT
            user_id,
            (array_agg(order_id ORDER BY created_at DESC))[1] as last_order_id
        FROM vendor_orders
        GROUP BY user_id
    ),
    last_order_details AS (
        -- Get the details (shipping address, a product name, and SKU) for that specific last order
        SELECT
            lopc.user_id,
            vo.shipping_address,
            (SELECT p.name FROM public.products p JOIN public.order_items oi ON p.id = oi.product_id WHERE oi.order_id = lopc.last_order_id LIMIT 1) as last_product_name,
            (SELECT p.sku FROM public.products p JOIN public.order_items oi ON p.id = oi.product_id WHERE oi.order_id = lopc.last_order_id LIMIT 1) as last_product_sku
        FROM last_order_per_customer lopc
        JOIN vendor_orders vo ON lopc.last_order_id = vo.order_id
    )
    -- Final SELECT to join all the gathered information together
    SELECT
        cs.user_id as customer_id,
        p.full_name,
        p.email,
        p.contact_number,
        cs.total_orders,
        cs.total_spent,
        cs.last_order_date,
        lod.shipping_address,
        lod.last_product_name,
        lod.last_product_sku
    FROM customer_stats cs
    JOIN public.profiles p ON cs.user_id = p.id
    LEFT JOIN last_order_details lod ON cs.user_id = lod.user_id;

END;
$$;
