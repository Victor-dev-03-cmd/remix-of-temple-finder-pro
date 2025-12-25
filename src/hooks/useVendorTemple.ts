import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorTemple {
  id: string;
  name: string;
  district: string;
  province: string;
  image_url: string | null;
  deity: string;
  description: string | null;
  address: string | null;
  contact: string | null;
  opening_hours: string | null;
  latitude: number;
  longitude: number;
}

interface VendorApplication {
  id: string;
  business_name: string;
  temple_id: string | null;
  status: string;
}

export const useVendorTemple = (userId: string | undefined) => {
  const [temple, setTemple] = useState<VendorTemple | null>(null);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVendorTemple = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get vendor's approved application
      const { data: appData, error: appError } = await supabase
        .from('vendor_applications')
        .select('id, business_name, temple_id, status')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .maybeSingle();

      if (appError) throw appError;

      if (appData) {
        setApplication(appData);
      }

      // Fetch temple owned by this vendor
      const { data: templeData, error: templeError } = await supabase
        .from('temples')
        .select('id, name, district, province, image_url, deity, description, address, contact, opening_hours, latitude, longitude')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!templeError && templeData) {
        setTemple(templeData);
      }
    } catch (error) {
      console.error('Error fetching vendor temple:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVendorTemple();
  }, [fetchVendorTemple]);

  const refetch = useCallback(() => {
    fetchVendorTemple();
  }, [fetchVendorTemple]);

  return { temple, application, loading, refetch };
};
