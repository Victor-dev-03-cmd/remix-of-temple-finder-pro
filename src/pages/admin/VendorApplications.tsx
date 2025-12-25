import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorApprovalQueue from '@/components/admin/VendorApprovalQueue';
import { motion } from 'framer-motion';

const VendorApplications = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 p-4 sm:p-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendor Applications</h1>
          <p className="text-muted-foreground">Review and manage vendor applications</p>
        </div>
        <VendorApprovalQueue />
      </motion.div>
    </DashboardLayout>
  );
};

export default VendorApplications;
