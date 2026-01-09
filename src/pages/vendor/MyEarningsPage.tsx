import VendorEarningsCard from "@/components/vendor/VendorEarningsCard";
import DashboardLayout from "@/components/layout/DashboardLayout";

const MyEarningsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Earnings</h1>
          <p className="text-muted-foreground">View your earnings and payout information.</p>
        </div>
        <VendorEarningsCard />
      </div>
    </DashboardLayout>
  );
};

export default MyEarningsPage;
