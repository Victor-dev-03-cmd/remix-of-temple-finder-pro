import DashboardLayout from '@/components/layout/DashboardLayout';
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings';
import { motion } from 'framer-motion';

const AppearanceSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <AppearanceSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default AppearanceSettingsPage;