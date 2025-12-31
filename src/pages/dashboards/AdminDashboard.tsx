import { motion } from 'framer-motion';
import { Users, FileCheck, DollarSign, Store } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/admin/UserManagement';
import VendorApprovalQueue from '@/components/admin/VendorApprovalQueue';
import AdminChatPanel from '@/components/admin/AdminChatPanel';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Vendors', value: '2,150', icon: Users, change: '+18% from last month' },
    { label: 'New Approvals', value: '12', icon: FileCheck, change: '+5% from last week' },
    { label: 'Monthly Revenue', value: 'LKR 750,000', icon: DollarSign, change: '+12% from last month' },
    { label: 'Active Listings', value: '1,890', icon: Store, change: '+7% since last update' },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="mb-1 font-display text-2xl sm:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage vendors, approvals, and platform settings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className="mt-1 text-lg sm:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground hidden sm:block">{stat.change}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 ml-2">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Support Chat */}
        <AdminChatPanel />

        {/* Vendor Approval Queue */}
        <VendorApprovalQueue />

        {/* User Management */}
        <UserManagement />
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
