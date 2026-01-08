import DashboardLayout from '@/components/layout/DashboardLayout';
import ColorSettings from '@/components/admin/settings/ColorSettings';
import { motion } from 'framer-motion';

const ColorSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <ColorSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default ColorSettingsPage;