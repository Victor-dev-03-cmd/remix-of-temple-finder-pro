import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGeoBlock = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // 1. பயனரின் IP மூலம் நாட்டைத் தெரிந்துகொள்ளுதல் (무료 API)
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        const userCountry = geoData.country_code; // எ.கா: 'IN', 'FR', 'LK'

        // 2. Supabase-ல் அந்த நாடு பிளாக் செய்யப்பட்டுள்ளதா எனப் பார்த்தல்
        const { data, error } = await (supabase
          .from('countries_config' as any)
          .select('is_blocked')
          .eq('country_code', userCountry)
          .maybeSingle() as any);

        if (data?.is_blocked) {
          setIsBlocked(true);
        }
      } catch (error) {
        console.error("Geo-check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { isBlocked, isLoading };
};