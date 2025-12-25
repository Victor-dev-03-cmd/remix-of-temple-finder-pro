import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerOrderHistory from '@/components/customer/CustomerOrderHistory';

const CustomerOrders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">View and track your order history</p>
        </div>
        <CustomerOrderHistory />
      </div>
    </DashboardLayout>
  );
};

export default CustomerOrders;
