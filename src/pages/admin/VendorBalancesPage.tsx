import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorBalanceManagement from '@/components/admin/VendorBalanceManagement';

const VendorBalancesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendor Balance Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage vendor earnings, balances, and withdrawal requests
          </p>
        </div>
        <VendorBalanceManagement />
      </div>
    </DashboardLayout>
  );
};

export default VendorBalancesPage;
