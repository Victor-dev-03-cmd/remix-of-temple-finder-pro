import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductManagement from '@/components/vendor/ProductManagement';

const VendorProducts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <ProductManagement />
      </div>
    </DashboardLayout>
  );
};

export default VendorProducts;
