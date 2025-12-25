import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderManagement from '@/components/vendor/OrderManagement';

const VendorOrders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track your orders</p>
        </div>
        <OrderManagement />
      </div>
    </DashboardLayout>
  );
};

export default VendorOrders;
