import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TempleReview {
  id: string;
  temple_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CreateReviewInput {
  temple_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

interface UpdateReviewInput {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export const useTempleReviews = (templeId: string) => {
  return useQuery({
    queryKey: ['temple-reviews', templeId],
    queryFn: async (): Promise<TempleReview[]> => {
      // First fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('temple_reviews')
        .select('*')
        .eq('temple_id', templeId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        throw reviewsError;
      }

      if (!reviews || reviews.length === 0) return [];

      // Fetch profiles for review authors
      const userIds = [...new Set(reviews.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Map profiles to reviews
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      
      return reviews.map((review) => ({
        ...review,
        profile: profileMap.get(review.user_id) || undefined,
      }));
    },
    enabled: !!templeId,
  });
};

export const useUserReview = (templeId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-temple-review', templeId, user?.id],
    queryFn: async (): Promise<TempleReview | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('temple_reviews')
        .select('*')
        .eq('temple_id', templeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user review:', error);
        throw error;
      }

      return data;
    },
    enabled: !!templeId && !!user,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user) throw new Error('Must be logged in to create a review');

      const { data, error } = await supabase
        .from('temple_reviews')
        .insert({
          temple_id: input.temple_id,
          user_id: user.id,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already reviewed this temple');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['temple-reviews', variables.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['user-temple-review', variables.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['temple', variables.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast({
        title: 'Review submitted',
        description: 'Thank you for sharing your experience!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReviewInput) => {
      const { data, error } = await supabase
        .from('temple_reviews')
        .update({
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['temple-reviews', data.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['user-temple-review', data.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['temple', data.temple_id] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast({
        title: 'Review updated',
        description: 'Your review has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update review. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, templeId }: { id: string; templeId: string }) => {
      const { error } = await supabase
        .from('temple_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { templeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['temple-reviews', data.templeId] });
      queryClient.invalidateQueries({ queryKey: ['user-temple-review', data.templeId] });
      queryClient.invalidateQueries({ queryKey: ['temple', data.templeId] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete review. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
