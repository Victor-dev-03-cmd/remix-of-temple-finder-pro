import { motion } from 'framer-motion';
import { Users, FileCheck, DollarSign, Store } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/admin/UserManagement';
import VendorApprovalQueue from '@/components/admin/VendorApprovalQueue';
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Admin Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Manage vendors, approvals, and platform settings.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Vendor Approval Queue */}
        <div className="mb-8">
          <VendorApprovalQueue />
        </div>

        {/* User Management */}
        <div className="mb-8">
          <UserManagement />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
