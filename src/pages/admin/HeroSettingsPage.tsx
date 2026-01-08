import DashboardLayout from '@/components/layout/DashboardLayout';
import HeroSettings from '@/components/admin/settings/HeroSettings';
import { motion } from 'framer-motion';

const HeroSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <HeroSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default HeroSettingsPage;