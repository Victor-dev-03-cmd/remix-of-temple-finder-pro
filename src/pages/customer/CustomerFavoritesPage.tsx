import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerFavorites from '@/components/customer/CustomerFavorites';

const CustomerFavoritesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
          <p className="text-muted-foreground">Products you've saved for later</p>
        </div>
        <CustomerFavorites />
      </div>
    </DashboardLayout>
  );
};

export default CustomerFavoritesPage;
