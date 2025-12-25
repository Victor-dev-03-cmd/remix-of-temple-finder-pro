import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingManagement from '@/components/admin/BookingManagement';

const BookingManagementPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Management</h1>
          <p className="text-muted-foreground">View and manage all temple ticket bookings</p>
        </div>
        <BookingManagement />
      </div>
    </DashboardLayout>
  );
};

export default BookingManagementPage;
