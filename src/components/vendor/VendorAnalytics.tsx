import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
  const [loading, setLoading] = useState(true);

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
        
        const monthlyRevenueData = new Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short' }), revenue: 0, orders: 0 };
        }).reverse();

        const ordersByMonthData = JSON.parse(JSON.stringify(monthlyRevenueData));

        orders?.forEach(o => {
            const orderMonth = new Date(o.created_at).getMonth();
            const orderYear = new Date(o.created_at).getFullYear();
            const currentYear = new Date().getFullYear();

            monthlyRevenueData.forEach(m => {
                const monthDate = new Date(`${m.month} 1, ${currentYear}`);
                if (orderYear === currentYear && orderMonth === monthDate.getMonth()) {
                    m.revenue += Number(o.total_amount);
                }
            });
            ordersByMonthData.forEach(m => {
                const monthDate = new Date(`${m.month} 1, ${currentYear}`);
                if (orderYear === currentYear && orderMonth === monthDate.getMonth()) {
                    m.orders += 1;
                }
            });
        });

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
          revenueByMonth: monthlyRevenueData.map(d => ({ month: d.month, revenue: d.revenue})),
          ordersByMonth: ordersByMonthData.map(d => ({ month: d.month, orders: d.orders})),
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
      label: 'Total Revenue',
      value: `LKR ${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      subtitle: 'All time earnings',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Monthly Revenue',
      value: `LKR ${data.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      subtitle: 'This month',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
     {
      label: 'Total Orders',
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      subtitle: `${data.completedOrders} completed`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Products',
      value: data.totalProducts.toString(),
      icon: Package,
      subtitle: `${data.approvedProducts} approved`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const productPieData = [
      { name: 'Approved', value: data.approvedProducts, icon: CheckCircle, color: '#34D399' },
      { name: 'Pending', value: data.pendingProducts, icon: Clock, color: '#FBBF24' },
  ];

  const orderPieData = [
    { name: 'Completed', value: data.completedOrders, icon: CheckCircle, color: '#60A5FA' },
    { name: 'Pending', value: data.pendingOrders, icon: Clock, color: '#F87171' },
  ];

  const PIE_COLORS_PRODUCT = productPieData.map(p => p.color);
  const PIE_COLORS_ORDER = orderPieData.map(o => o.color);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-36 animate-pulse" />
        ))}
         <Card className="h-80 animate-pulse col-span-1 sm:col-span-2" />
         <Card className="h-80 animate-pulse col-span-1 sm:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 border-${stat.color.split('-')[1]}-500`}>
                <CardContent className="p-5">
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
                </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 6 Months Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueByMonth}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `LKR ${value/1000}k`}/>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} 
                  labelStyle={{ color: '#f9fafb' }}
                  formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#818CF8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 6 Months Orders</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ordersByMonth}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} 
                        labelStyle={{ color: '#f9fafb' }}
                        formatter={(value) => [value, "Orders"]}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
            <CardTitle>Product Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Pie data={productPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} labelLine={false}>
                    {productPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_PRODUCT[index % PIE_COLORS_PRODUCT.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Pie data={orderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} labelLine={false}>
                    {orderPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_ORDER[index % PIE_COLORS_ORDER.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                <Legend iconType="circle"/>
                </PieChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorAnalytics;
