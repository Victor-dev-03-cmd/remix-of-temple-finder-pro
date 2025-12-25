import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorTemple } from '@/hooks/useVendorTemple';
import { Loader2, Calendar, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import VendorBookingManagement from '@/components/vendor/VendorBookingManagement';

const VendorBookingsPage = () => {
  const { user } = useAuth();
  const { temple, loading } = useVendorTemple(user?.id);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!temple) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Temple Bookings</h1>
            <p className="text-muted-foreground">Manage visitor bookings</p>
          </div>
          
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No Temple Found</h3>
              <p className="text-muted-foreground mb-4">
                You need to create a temple first to manage bookings.
              </p>
              <Link to="/vendor/temple">
                <Button>Create Temple</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Temple Bookings</h1>
          <p className="text-muted-foreground">Manage visitor bookings for {temple.name}</p>
        </div>
        
        <VendorBookingManagement templeId={temple.id} />
      </div>
    </DashboardLayout>
  );
};

export default VendorBookingsPage;
