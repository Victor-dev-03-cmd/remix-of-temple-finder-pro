import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ProductVariant = Tables<'product_variants'>;

export const useProductVariants = (productId: string | undefined) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchVariants = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        setVariants(data || []);
      } catch (err) {
        console.error('Error fetching product variants:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch variants');
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [productId]);

  return { variants, loading, error };
};
