import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, ExternalLink, Package } from 'lucide-react';
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

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your temple listing, products, and orders.
          </p>
        </div>

        {/* Temple Info Card */}
        {temple && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    {temple.image_url ? (
                      <img
                        src={temple.image_url}
                        alt={temple.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{temple.name}</h3>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {temple.district}, {temple.province} • {application?.business_name}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link to="/vendor/temple" className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Package className="h-4 w-4" />
                        Manage
                      </Button>
                    </Link>
                    <Link to={`/temples/${temple.id}`} className="flex-1 sm:flex-none">
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics */}
        <div className="mb-8">
          <VendorAnalytics />
        </div>

        {/* Product Management */}
        <div className="mb-8">
          <ProductManagement />
        </div>

        {/* Order Management */}
        <div className="mb-8">
          <OrderManagement />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
