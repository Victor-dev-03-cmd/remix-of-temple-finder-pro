import DashboardLayout from '@/components/layout/DashboardLayout';
import EmailTemplateSettings from '@/components/admin/settings/EmailTemplateSettings';
import { motion } from 'framer-motion';

const EmailTemplateSettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
        <EmailTemplateSettings />
      </motion.div>
    </DashboardLayout>
  );
};

export default EmailTemplateSettingsPage;