import DashboardLayout from '@/components/layout/DashboardLayout';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import { motion } from 'framer-motion';

const SecuritySettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <SecuritySettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default SecuritySettingsPage;