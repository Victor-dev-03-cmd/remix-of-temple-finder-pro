import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorTemple {
  id: string;
  name: string;
  district: string;
  province: string;
  image_url: string | null;
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

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchVendorTemple = async () => {
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

          // Fetch temple details if vendor has a temple assigned
          if (appData.temple_id) {
            const { data: templeData, error: templeError } = await supabase
              .from('temples')
              .select('id, name, district, province, image_url')
              .eq('id', appData.temple_id)
              .maybeSingle();

            if (!templeError && templeData) {
              setTemple(templeData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching vendor temple:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorTemple();
  }, [userId]);

  return { temple, application, loading };
};
