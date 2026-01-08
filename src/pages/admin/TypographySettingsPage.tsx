import DashboardLayout from '@/components/layout/DashboardLayout';
import TypographySettings from '@/components/admin/settings/TypographySettings';
import { motion } from 'framer-motion';

const TypographySettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <TypographySettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default TypographySettingsPage;