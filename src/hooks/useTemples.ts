import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Temple {
  id: string;
  name: string;
  description: string | null;
  deity: string;
  province: string;
  district: string;
  address: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  review_count: number | null;
  services: string[] | null;
  opening_hours: string | null;
  contact: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed properties for compatibility with existing components
  image: string;
  reviewCount: number;
  coordinates: { lat: number; lng: number };
}

const fetchTemples = async (): Promise<Temple[]> => {
  const { data, error } = await supabase
    .from('temples')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching temples:', error);
    throw error;
  }

  // Transform data for compatibility with existing components
  return (data || []).map((temple) => ({
    ...temple,
    image: temple.image_url || '/placeholder.svg',
    reviewCount: temple.review_count || 0,
    coordinates: {
      lat: Number(temple.latitude),
      lng: Number(temple.longitude),
    },
  }));
};

export const useTemples = () => {
  return useQuery({
    queryKey: ['temples'],
    queryFn: fetchTemples,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTemple = (id: string) => {
  return useQuery({
    queryKey: ['temple', id],
    queryFn: async (): Promise<Temple | null> => {
      const { data, error } = await supabase
        .from('temples')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching temple:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        image: data.image_url || '/placeholder.svg',
        reviewCount: data.review_count || 0,
        coordinates: {
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        },
      };
    },
    enabled: !!id,
  });
};
