import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerProfile from '@/components/customer/CustomerProfile';

const CustomerProfilePage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <CustomerProfile />
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfilePage;
