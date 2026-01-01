import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Check, X, RefreshCw, CreditCard, 
  ArrowUpRight, Eye, Search, Loader2 
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface WithdrawalRequest {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
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
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const VendorBalanceManagement = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [balances, setBalances] = useState<VendorBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [addAmount, setAddAmount] = useState('');

  // 1. Fetch Function (Inspired by your VendorApprovalQueue logic)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Withdrawal requests எடுத்தல்
      const { data: withdrawalData, error: wError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (wError) throw wError;

      // Profiles-ஐ ஒவ்வொரு withdrawal-க்கும் தனித்தனியாக எடுத்தல் (உங்களது ஸ்டைல்)
      const withdrawalsWithProfiles = await Promise.all(
        (withdrawalData || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', item.vendor_id)
            .maybeSingle();
          return { ...item, profiles: profile || undefined };
        })
      );

      // Balances எடுத்தல்
      const { data: balanceData, error: bError } = await supabase
        .from('vendor_balances')
        .select('*');

      if (bError) throw bError;

      // Profiles-ஐ ஒவ்வொரு balance-க்கும் தனித்தனியாக எடுத்தல்
      const balancesWithProfiles = await Promise.all(
        (balanceData || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', item.vendor_id)
            .maybeSingle();
          return { ...item, profiles: profile || undefined };
        })
      );

      setWithdrawals(withdrawalsWithProfiles);
      setBalances(balancesWithProfiles);
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Approval/Rejection
  const handleProcess = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      const withdrawal = withdrawals.find(w => w.id === id);
      if (!withdrawal) return;

      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      // Update request status
      await supabase.from('withdrawal_requests').update({
        status: newStatus,
        processed_at: new Date().toISOString()
      }).eq('id', id);

      // Update Vendor Balance
      const balance = balances.find(b => b.vendor_id === withdrawal.vendor_id);
      if (balance) {
        if (action === 'approve') {
          await supabase.from('vendor_balances').update({
            pending_balance: Math.max(0, (balance.pending_balance || 0) - withdrawal.amount),
            withdrawn_amount: (balance.withdrawn_amount || 0) + withdrawal.amount
          }).eq('vendor_id', withdrawal.vendor_id);
        } else {
          await supabase.from('vendor_balances').update({
            pending_balance: Math.max(0, (balance.pending_balance || 0) - withdrawal.amount),
            available_balance: (balance.available_balance || 0) + withdrawal.amount
          }).eq('vendor_id', withdrawal.vendor_id);
        }
      }

      toast({ title: 'Success', description: `Request ${newStatus}` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  // 3. Add Manual Balance
  const handleAddBalance = async () => {
    if (!selectedVendor || !addAmount) return;
    try {
      const amount = parseFloat(addAmount);
      const existing = balances.find(b => b.vendor_id === selectedVendor);

      if (existing) {
        await supabase.from('vendor_balances').update({
          total_earnings: (existing.total_earnings || 0) + amount,
          available_balance: (existing.available_balance || 0) + amount
        }).eq('vendor_id', selectedVendor);
      } else {
        await supabase.from('vendor_balances').insert({
          vendor_id: selectedVendor,
          total_earnings: amount,
          available_balance: amount,
          pending_balance: 0,
          withdrawn_amount: 0
        });
      }

      setShowAddBalance(false);
      setAddAmount('');
      fetchData();
      toast({ title: 'Success', description: 'Balance updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CreditCard className="h-6 w-6 text-primary" /> Wallet Management
          </h2>
          <p className="text-sm text-muted-foreground">Manage vendor payouts and balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </Button>
          <Button onClick={() => setShowAddBalance(true)} className="gap-2">
            <ArrowUpRight size={16} /> Add Balance
          </Button>
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6">
        {/* Pending Withdrawals */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border bg-card">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold">Pending Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No pending requests</td></tr>
                ) : (
                  withdrawals.filter(w => w.status === 'pending').map((w) => (
                    <tr key={w.id} className="hover:bg-muted/10">
                      <td className="p-3">
                        <p className="font-medium">{w.profiles?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{w.profiles?.email}</p>
                      </td>
                      <td className="p-3 font-bold text-primary">${w.amount.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-success" onClick={() => handleProcess(w.id, 'approve')} disabled={processing}><Check size={18} /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleProcess(w.id, 'reject')} disabled={processing}><X size={18} /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Balance Ledger */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-lg border bg-card">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold">Vendor Balances</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Total Earned</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {balances.map((b) => (
                  <tr key={b.vendor_id}>
                    <td className="p-3 font-medium">{b.profiles?.full_name || 'N/A'}</td>
                    <td className="p-3">${(b.total_earnings || 0).toFixed(2)}</td>
                    <td className="p-3 text-success font-bold">${(b.available_balance || 0).toFixed(2)}</td>
                    <td className="p-3 text-warning">${(b.pending_balance || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Dialog */}
      <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              <select className="w-full p-2 border rounded-md" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                <option value="">-- Select --</option>
                {balances.map(b => (
                  <option key={b.vendor_id} value={b.vendor_id}>{b.profiles?.full_name || b.vendor_id}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBalance(false)}>Cancel</Button>
            <Button onClick={handleAddBalance}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorBalanceManagement;
