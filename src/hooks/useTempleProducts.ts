import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';

export const useTempleProducts = (templeId: string | undefined) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templeId) {
      setLoading(false);
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            temple:temples(id, name, image_url)
          `)
          .eq('temple_id', templeId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching temple products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [templeId]);

  return { products, loading, error };
};
