import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  shipping_address: string | null;
  total_orders: number;
  total_spent: number;
}

export const useCustomers = (vendorId: string | undefined) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!vendorId) return;

      setIsLoading(true);
      try {
        // Fetch orders for this vendor with customer info from profiles
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('customer_id, total_amount, shipping_address')
          .eq('vendor_id', vendorId);

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          setCustomers([]);
          setIsLoading(false);
          return;
        }

        if (!ordersData || ordersData.length === 0) {
          setCustomers([]);
          setIsLoading(false);
          return;
        }

        // Get unique customer IDs
        const customerIds = [...new Set(ordersData.map(o => o.customer_id))];

        // Fetch profiles for these customers
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', customerIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Aggregate customer data
        const customerMap = new Map<string, Customer>();
        
        ordersData.forEach(order => {
          const existing = customerMap.get(order.customer_id);
          const profile = profilesData?.find(p => p.user_id === order.customer_id);
          
          if (existing) {
            existing.total_orders += 1;
            existing.total_spent += Number(order.total_amount);
            if (order.shipping_address && !existing.shipping_address) {
              existing.shipping_address = order.shipping_address;
            }
          } else {
            customerMap.set(order.customer_id, {
              id: order.customer_id,
              name: profile?.full_name || 'Unknown Customer',
              email: profile?.email || null,
              phone: profile?.phone || null,
              shipping_address: order.shipping_address,
              total_orders: 1,
              total_spent: Number(order.total_amount),
            });
          }
        });

        setCustomers(Array.from(customerMap.values()));
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [vendorId]);

  return { customers, isLoading };
};
