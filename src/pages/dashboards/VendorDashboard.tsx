import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';
import ProductManagement from '@/components/vendor/ProductManagement';
import OrderManagement from '@/components/vendor/OrderManagement';
import { useAuth } from '@/contexts/AuthContext';

const VendorDashboard = () => {
  const { user } = useAuth();

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
