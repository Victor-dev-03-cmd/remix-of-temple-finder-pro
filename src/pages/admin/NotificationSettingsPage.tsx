import DashboardLayout from '@/components/layout/DashboardLayout';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import { motion } from 'framer-motion';

const NotificationSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <NotificationSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;