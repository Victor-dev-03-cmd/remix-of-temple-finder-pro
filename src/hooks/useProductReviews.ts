import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateReviewInput {
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
}

export const useProductReviews = (productId: string | undefined) => {
  const query = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  const averageRating = query.data?.length
    ? query.data.reduce((acc, r) => acc + r.rating, 0) / query.data.length
    : 0;

  return {
    reviews: query.data || [],
    loading: query.isLoading,
    error: query.error,
    averageRating,
    refetch: query.refetch,
  };
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', data.product_id] });
    },
  });
};