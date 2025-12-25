import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Check, X, Eye, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface VendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  temple_name: string;
  description: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const VendorApprovalQueue = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for each application
      const appsWithProfiles = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', app.user_id)
            .maybeSingle();
          
          return { ...app, profiles: profile || undefined };
        })
      );

      setApplications(appsWithProfiles);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async () => {
    if (!selectedApp || !user) return;
    setProcessing(true);

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('vendor_applications')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);

      if (updateError) throw updateError;

      // Upgrade user role to vendor
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'vendor' })
        .eq('user_id', selectedApp.user_id);

      if (roleError) throw roleError;

      toast({
        title: 'Application Approved',
        description: `${selectedApp.business_name} has been approved as a vendor.`,
      });

      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve application.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !user) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('vendor_applications')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast({
        title: 'Application Rejected',
        description: `${selectedApp.business_name} application has been rejected.`,
        variant: 'destructive',
      });

      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject application.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const pendingApps = applications.filter((app) => app.status === 'pending');
  const processedApps = applications.filter((app) => app.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/10 text-success">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <FileCheck className="h-5 w-5" />
              Vendor Applications
            </h2>
            <p className="text-sm text-muted-foreground">
              Review and process vendor applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingApps.length > 0 && (
              <Badge className="bg-warning/10 text-warning">
                {pendingApps.length} pending
              </Badge>
            )}
            <Button variant="outline" size="icon" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Temple
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-2">Loading applications...</p>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No vendor applications yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {app.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {app.profiles?.email || 'No email'}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                      {app.business_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {app.temple_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes('');
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vendor Application Details</DialogTitle>
            <DialogDescription>
              Review the application and take action
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid gap-4 rounded-lg border border-border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Applicant</span>
                  <p className="font-medium text-foreground">
                    {selectedApp.profiles?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.profiles?.email}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Business Name</span>
                  <p className="font-medium text-foreground">{selectedApp.business_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Temple</span>
                  <p className="text-foreground">{selectedApp.temple_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <p className="text-foreground">{selectedApp.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-foreground">{selectedApp.description || 'Not provided'}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Applied {new Date(selectedApp.created_at).toLocaleString()}
                </div>
              </div>

              {selectedApp.status === 'pending' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Admin Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add notes about this decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-success hover:bg-success/90"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorApprovalQueue;
