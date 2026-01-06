import DashboardLayout from '@/components/layout/DashboardLayout';
import SiteSettings from '@/components/admin/SiteSettings';
import { motion } from 'framer-motion';

const GeneralSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 space-y-6"
      >
        <SiteSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default GeneralSettingsPage;
