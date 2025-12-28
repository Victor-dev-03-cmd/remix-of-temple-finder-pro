import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  name: string;
  phone: string | null;
  email: string | null;
  shipping_address: string | null;
}

export const useCustomers = (vendorId: string | undefined) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!vendorId) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('customer_name, customer_phone, customer_email, customer_shipping_address')
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
        setIsLoading(false);
        return;
      }

      // Deduplicate customers by name
      const uniqueCustomers = data.reduce<Customer[]>((acc, current) => {
        if (!acc.find((item) => item.name === current.customer_name)) {
          acc.push({
            name: current.customer_name,
            phone: current.customer_phone,
            email: current.customer_email,
            shipping_address: current.customer_shipping_address,
          });
        }
        return acc;
      }, []);

      setCustomers(uniqueCustomers);
      setIsLoading(false);
    };

    fetchCustomers();
  }, [vendorId]);

  return { customers, isLoading };
};
