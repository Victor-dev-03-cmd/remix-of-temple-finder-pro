import DashboardLayout from '@/components/layout/DashboardLayout';
import HomeGallerySettings from '@/components/admin/HomeGallerySettings';
import { motion } from 'framer-motion';

const HomeGalleryPage = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 space-y-6"
      >
        <HomeGallerySettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default HomeGalleryPage;
