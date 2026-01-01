import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Check, X, Loader2, RefreshCw, CreditCard, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Interfaces for Type Safety
interface WithdrawalRequest {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  vendor_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface VendorBalance {
  vendor_id: string;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_amount: number;
  min_withdrawal_amount: number;
  vendor_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const VendorBalanceManagement = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [balances, setBalances] = useState<VendorBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [addAmount, setAddAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Withdrawal Requests
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;

      // 2. Fetch Vendor Balances (Using available_balance to avoid order error)
      const { data: balanceData, error: balanceError } = await supabase
        .from('vendor_balances')
        .select('*');

      if (balanceError) throw balanceError;

      // 3. Collect Unique Vendor IDs
      const vendorIds = [...new Set([
        ...(withdrawalData?.map(w => w.vendor_id) || []),
        ...(balanceData?.map(b => b.vendor_id) || [])
      ])];

      if (vendorIds.length > 0) {
        // 4. Fetch Profiles for those Vendors
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', vendorIds);

        if (profileError) throw profileError;

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

        setWithdrawals((withdrawalData || []).map(w => ({
          ...w,
          vendor_profile: profileMap.get(w.vendor_id),
        })));

        setBalances((balanceData || []).map(b => ({
          ...b,
          vendor_profile: profileMap.get(b.vendor_id),
        })));
      } else {
        setWithdrawals(withdrawalData || []);
        setBalances(balanceData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to load data.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const withdrawal = withdrawals.find(w => w.id === id);
      if (!withdrawal) return;

      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      // Update Withdrawal Status
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: newStatus, 
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update Vendor Balance Logic
      const balance = balances.find(b => b.vendor_id === withdrawal.vendor_id);
      if (balance) {
        if (action === 'approve') {
          await supabase
            .from('vendor_balances')
            .update({
              pending_balance: Math.max(0, (balance.pending_balance || 0) - withdrawal.amount),
              withdrawn_amount: (balance.withdrawn_amount || 0) + withdrawal.amount,
            })
            .eq('vendor_id', withdrawal.vendor_id);
        } else {
          await supabase
            .from('vendor_balances')
            .update({
              pending_balance: Math.max(0, (balance.pending_balance || 0) - withdrawal.amount),
              available_balance: (balance.available_balance || 0) + withdrawal.amount,
            })
            .eq('vendor_id', withdrawal.vendor_id);
        }
      }

      toast({
        title: action === 'approve' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
        description: `Request ${newStatus} successfully.`,
      });

      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      toast({ title: 'Error', description: 'Action failed.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddBalance = async () => {
    if (!selectedVendor || !addAmount) {
      toast({ title: 'Input Required', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Enter a valid number.', variant: 'destructive' });
      return;
    }

    try {
      const existingBalance = balances.find(b => b.vendor_id === selectedVendor);

      if (existingBalance) {
        const { error } = await supabase
          .from('vendor_balances')
          .update({
            total_earnings: (existingBalance.total_earnings || 0) + amount,
            available_balance: (existingBalance.available_balance || 0) + amount,
          })
          .eq('vendor_id', selectedVendor);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_balances')
          .insert({
            vendor_id: selectedVendor,
            total_earnings: amount,
            available_balance: amount,
            pending_balance: 0,
            withdrawn_amount: 0
          });
        if (error) throw error;
      }

      toast({ title: 'Success', description: `$${amount.toFixed(2)} added successfully.` });
      setShowAddBalance(false);
      setAddAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding balance:', error);
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <CreditCard className="h-6 w-6 text-primary" />
            Vendor Wallet Management
          </h2>
          <p className="text-sm text-muted-foreground">Monitor earnings and approve payouts</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowAddBalance(true)} className="gap-2 flex-1 sm:flex-none">
            <ArrowUpRight className="h-4 w-4" />
            Add Balance
          </Button>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid gap-6">
        {/* Pending Requests Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Pending Withdrawals ({pendingWithdrawals.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : pendingWithdrawals.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No pending requests found</TableCell></TableRow>
                ) : (
                  pendingWithdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="font-medium">{w.vendor_profile?.full_name || 'User'}</div>
                        <div className="text-xs text-muted-foreground">{w.vendor_profile?.email}</div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">${w.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-success" onClick={() => handleProcessWithdrawal(w.id, 'approve')} disabled={!!processingId}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleProcessWithdrawal(w.id, 'reject')} disabled={!!processingId}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Master Balance Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <h3 className="font-semibold text-sm uppercase tracking-wider">All Vendor Balances</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Withdrawn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => (
                  <TableRow key={b.vendor_id}>
                    <TableCell>
                      <div className="font-medium text-sm">{b.vendor_profile?.full_name || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="font-medium">${(b.total_earnings || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-success font-bold">${(b.available_balance || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-warning">${(b.pending_balance || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">${(b.withdrawn_amount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      {/* Add Balance Modal */}
      <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Balance</DialogTitle>
            <DialogDescription>Increase a vendor's total and available earnings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Vendor Profile</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
              >
                <option value="">-- Choose Vendor --</option>
                {balances.map((b) => (
                  <option key={b.vendor_id} value={b.vendor_id}>{b.vendor_profile?.full_name || b.vendor_id}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Add ($)</Label>
              <Input id="amount" type="number" placeholder="0.00" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBalance(false)}>Cancel</Button>
            <Button onClick={handleAddBalance}>Confirm Deposit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorBalanceManagement;
