import DashboardLayout from '@/components/layout/DashboardLayout';
import FooterSettings from '@/components/admin/settings/FooterSettings';
import { motion } from 'framer-motion';

const FooterSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <FooterSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default FooterSettingsPage;