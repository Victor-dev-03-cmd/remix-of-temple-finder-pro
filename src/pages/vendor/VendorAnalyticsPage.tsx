import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';

const VendorAnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">View your sales and performance metrics</p>
        </div>
        <VendorAnalytics />
      </div>
    </DashboardLayout>
  );
};

export default VendorAnalyticsPage;
