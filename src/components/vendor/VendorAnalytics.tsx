import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingCart, DollarSign, Star, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const VendorAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        // Fetch products stats
        const { data: products } = await supabase
          .from('products')
          .select('status')
          .eq('vendor_id', user.id);

        // Fetch orders stats
        const { data: orders } = await supabase
          .from('orders')
          .select('status, total_amount, created_at')
          .eq('vendor_id', user.id);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const analyticsData: AnalyticsData = {
          totalProducts: products?.length || 0,
          approvedProducts: products?.filter((p) => p.status === 'approved').length || 0,
          pendingProducts: products?.filter((p) => p.status === 'pending').length || 0,
          totalOrders: orders?.length || 0,
          pendingOrders: orders?.filter((o) => o.status === 'pending').length || 0,
          completedOrders: orders?.filter((o) => o.status === 'delivered').length || 0,
          totalRevenue: orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
          monthlyRevenue:
            orders
              ?.filter((o) => new Date(o.created_at) >= startOfMonth)
              .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        };

        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const stats = [
    {
      label: 'Total Products',
      value: data.totalProducts.toString(),
      icon: Package,
      subtitle: `${data.approvedProducts} approved, ${data.pendingProducts} pending`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Orders',
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      subtitle: `${data.pendingOrders} pending, ${data.completedOrders} delivered`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Monthly Revenue',
      value: `LKR ${data.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      subtitle: 'This month',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Total Revenue',
      value: `LKR ${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      subtitle: 'All time earnings',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VendorAnalytics;
