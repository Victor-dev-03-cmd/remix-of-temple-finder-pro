import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

const VendorAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueByMonth: [],
    ordersByMonth: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        const { data: products } = await supabase
          .from('products')
          .select('status')
          .eq('vendor_id', user.id);

        const { data: orders } = await supabase
          .from('orders')
          .select('status, total_amount, created_at')
          .eq('vendor_id', user.id);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const baseMonths = new Array(6).fill(0).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return {
            month: d.toLocaleString('default', { month: 'short' }),
            revenue: 0,
            orders: 0,
          };
        }).reverse();

        const revenueMonths = JSON.parse(JSON.stringify(baseMonths));
        const orderMonths = JSON.parse(JSON.stringify(baseMonths));
        const currentYear = new Date().getFullYear();

        orders?.forEach((o) => {
          const d = new Date(o.created_at);
          revenueMonths.forEach((m) => {
            const md = new Date(`${m.month} 1, ${currentYear}`);
            if (d.getMonth() === md.getMonth() && d.getFullYear() === currentYear) {
              m.revenue += Number(o.total_amount);
            }
          });
          orderMonths.forEach((m) => {
            const md = new Date(`${m.month} 1, ${currentYear}`);
            if (d.getMonth() === md.getMonth() && d.getFullYear() === currentYear) {
              m.orders += 1;
            }
          });
        });

        setData({
          totalProducts: products?.length || 0,
          approvedProducts: products?.filter(p => p.status === 'approved').length || 0,
          pendingProducts: products?.filter(p => p.status === 'pending').length || 0,
          totalOrders: orders?.length || 0,
          pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
          completedOrders: orders?.filter(o => o.status === 'delivered').length || 0,
          totalRevenue: orders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0,
          monthlyRevenue:
            orders
              ?.filter(o => new Date(o.created_at) >= startOfMonth)
              .reduce((s, o) => s + Number(o.total_amount), 0) || 0,
          revenueByMonth: revenueMonths,
          ordersByMonth: orderMonths,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const stats = [
    {
      label: 'Total',
      value: `LKR ${data.totalRevenue.toLocaleString()}`,
      subtitle: 'Revenue',
      icon: DollarSign,
      border: 'border-indigo-500',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-500',
    },
    {
      label: 'Monthly',
      value: `LKR ${data.monthlyRevenue.toLocaleString()}`,
      subtitle: 'Revenue',
      icon: TrendingUp,
      border: 'border-green-500',
      bg: 'bg-green-500/10',
      text: 'text-green-500',
    },
    {
      label: 'Orders',
      value: data.totalOrders,
      subtitle: `completed`,
      icon: ShoppingCart,
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
    },
    {
      label: 'Products',
      value: data.totalProducts,
      subtitle: ` approved`,
      icon: Package,
      border: 'border-amber-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border-l-4 ${s.border}`}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-1xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <s.icon className={`h-3 w-3 ${s.text}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueByMonth}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `LKR ${v / 1000}k`} />
                <Tooltip />
                <Line dataKey="revenue" stroke="#818CF8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByMonth}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorAnalytics;
