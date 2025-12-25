import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SiteSettings from '@/components/admin/SiteSettings';
import HomeGallerySettings from '@/components/admin/HomeGallerySettings';
import { motion } from 'framer-motion';

const SiteSettingsPage = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');

  useEffect(() => {
    if (section) {
      // Small delay to allow the page to render
      const timer = setTimeout(() => {
        const element = document.getElementById(`settings-${section}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [section]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 space-y-6"
      >
        <SiteSettings />
        <div id="settings-gallery">
          <HomeGallerySettings />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SiteSettingsPage;
