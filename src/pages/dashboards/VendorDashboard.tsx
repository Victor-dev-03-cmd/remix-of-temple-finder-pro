import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, ExternalLink, Package, ShoppingCart } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';
import ProductManagement from '@/components/vendor/ProductManagement';
import OrderManagement from '@/components/vendor/OrderManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorTemple } from '@/hooks/useVendorTemple';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { temple, application, loading: templeLoading } = useVendorTemple(user?.id);

  if (templeLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your temple listing, products, and incoming orders in real-time.
          </p>
        </div>

        {/* Temple Status Card - Full Width */}
        {temple && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/10 border-primary/20 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Image/Icon Container */}
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-background border shadow-sm overflow-hidden">
                    {temple.image_url ? (
                      <img src={temple.image_url} alt={temple.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building className="h-8 w-8 text-primary/60" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl sm:text-2xl text-foreground truncate">{temple.name}</h3>
                      <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success border border-success/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        Active
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground/80">{temple.district}, {temple.province}</span>
                      <span className="hidden sm:inline opacity-30">•</span>
                      <span className="truncate">{application?.business_name}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row sm:flex-col lg:flex-row gap-3 w-full sm:w-auto">
                    <Link to="/vendor/temple" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 font-semibold">
                        <Package className="h-4 w-4" />
                        Manage Listing
                      </Button>
                    </Link>
                    <Link to={`/temples/${temple.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-2 font-semibold">
                        <ExternalLink className="h-4 w-4" />
                        View Live
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics Section - Full Width */}
        <div className="w-full">
          <Card className="border-border shadow-sm">
             <VendorAnalytics />
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 gap-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Product Inventory
              </h2>
            </div>
            <div className="rounded-xl border bg-card/50">
              <ProductManagement />
            </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Recent Orders
              </h2>
            </div>
            <div className="rounded-xl border bg-card/50">
              <OrderManagement />
            </div>
          </section>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default VendorDashboard;