import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Heart, User } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerOrderHistory from '@/components/customer/CustomerOrderHistory';
import CustomerFavorites from '@/components/customer/CustomerFavorites';
import CustomerProfile from '@/components/customer/CustomerProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    favorites: 0,
  });
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [ordersResult, favoritesResult, profileResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id),
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      setStats({
        totalOrders: ordersResult.count || 0,
        favorites: favoritesResult.count || 0,
      });

      setProfileName(profileResult.data?.full_name || null);
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: Package,
      subtitle: 'All time orders',
    },
    {
      label: 'Saved Items',
      value: stats.favorites.toString(),
      icon: Heart,
      subtitle: 'In your favorites',
    },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="mb-1 font-display text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {profileName || user?.email?.split('@')[0] || 'Devotee'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's a quick overview of your activity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground hidden sm:block">{stat.subtitle}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 ml-2">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-auto p-1">
            <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm py-2">
              <Package className="h-4 w-4" />
              <span className="hidden xs:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-1.5 text-xs sm:text-sm py-2">
              <Heart className="h-4 w-4" />
              <span className="hidden xs:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm py-2">
              <User className="h-4 w-4" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <CustomerOrderHistory />
          </TabsContent>

          <TabsContent value="favorites">
            <CustomerFavorites />
          </TabsContent>

          <TabsContent value="profile">
            <CustomerProfile />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
