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

  // --- Optimized Fetch Function ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch data from Withdrawals, Balances, and Approved Applications
      const [withdrawalsRes, balancesRes, appsRes] = await Promise.all([
        supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('vendor_balances').select('*'),
        supabase.from('vendor_applications').select('user_id').eq('status', 'approved')
      ]);

      if (withdrawalsRes.error) throw withdrawalsRes.error;
      if (balancesRes.error) throw balancesRes.error;
      if (appsRes.error) throw appsRes.error;

      // 2. Combine all unique Vendor IDs
      const vendorIds = [...new Set([
        ...(withdrawalsRes.data?.map(w => w.vendor_id) || []),
        ...(balancesRes.data?.map(b => b.vendor_id) || []),
        ...(appsRes.data?.map(a => a.user_id) || [])
      ])];

      if (vendorIds.length > 0) {
        // 3. Single query to fetch profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', vendorIds);

        if (profileError) throw profileError;
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

        // 4. Map Withdrawal Requests
        setWithdrawals((withdrawalsRes.data || []).map(w => ({
          ...w,
          vendor_profile: profileMap.get(w.vendor_id),
        })));

        // 5. Map Balances (Crucial: Shows approved vendors even with 0 data)
        const existingBalanceMap = new Map(balancesRes.data?.map(b => [b.vendor_id, b]));
        
        const mergedBalances: VendorBalance[] = vendorIds.map(vId => {
          const b = existingBalanceMap.get(vId);
          return {
            vendor_id: vId,
            total_earnings: b?.total_earnings || 0,
            available_balance: b?.available_balance || 0,
            pending_balance: b?.pending_balance || 0,
            withdrawn_amount: b?.withdrawn_amount || 0,
            min_withdrawal_amount: b?.min_withdrawal_amount || 10,
            vendor_profile: profileMap.get(vId)
          };
        });

        setBalances(mergedBalances);
      } else {
        setWithdrawals([]);
        setBalances([]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
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

      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: newStatus, processed_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      const balance = balances.find(b => b.vendor_id === withdrawal.vendor_id);
      if (balance) {
        const updatePayload = action === 'approve' 
          ? { 
              pending_balance: Math.max(0, balance.pending_balance - withdrawal.amount),
              withdrawn_amount: balance.withdrawn_amount + withdrawal.amount 
            }
          : { 
              pending_balance: Math.max(0, balance.pending_balance - withdrawal.amount),
              available_balance: balance.available_balance + withdrawal.amount 
            };

        await supabase.from('vendor_balances').update(updatePayload).eq('vendor_id', withdrawal.vendor_id);
      }

      toast({ title: `Success`, description: `Request ${action === 'approve' ? 'approved' : 'rejected'}` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddBalance = async () => {
    if (!selectedVendor || !addAmount) return;
    const amount = parseFloat(addAmount);
    try {
      const existing = balances.find(b => b.vendor_id === selectedVendor && b.total_earnings > 0);
      
      if (existing) {
        await supabase.from('vendor_balances').update({
          total_earnings: existing.total_earnings + amount,
          available_balance: existing.available_balance + amount
        }).eq('vendor_id', selectedVendor);
      } else {
        await supabase.from('vendor_balances').upsert({
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
      toast({ title: 'Balance Updated' });
    } catch (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CreditCard className="h-5 w-5" /> Wallet & Payouts
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </Button>
          <Button onClick={() => setShowAddBalance(true)}><ArrowUpRight size={16} className="mr-2"/> Add Earnings</Button>
        </div>
      </div>

      {/* Payout Requests */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b bg-muted/20 font-semibold">Pending Payouts</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingWithdrawals.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No pending requests</TableCell></TableRow>
            ) : (
              pendingWithdrawals.map(w => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="font-medium">{w.vendor_profile?.full_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{w.vendor_profile?.email}</div>
                  </TableCell>
                  <TableCell className="font-bold text-primary">${w.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleProcessWithdrawal(w.id, 'approve')}><Check className="text-success"/></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleProcessWithdrawal(w.id, 'reject')}><X className="text-destructive"/></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* All Vendor Balances Table */}
      
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b bg-muted/20 font-semibold">All Vendor Balances</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Total Earnings</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Withdrawn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map(b => (
              <TableRow key={b.vendor_id}>
                <TableCell className="font-medium">{b.vendor_profile?.full_name || 'Vendor'}</TableCell>
                <TableCell>${b.total_earnings.toFixed(2)}</TableCell>
                <TableCell className="text-success font-bold">${b.available_balance.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">${b.withdrawn_amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Balance Dialog */}
      <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Balance Update</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              <select className="w-full p-2 border rounded-md" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                <option value="">-- Choose Vendor --</option>
                {balances.map(b => (
                  <option key={b.vendor_id} value={b.vendor_id}>{b.vendor_profile?.full_name || b.vendor_id}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddBalance}>Add Balance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorBalanceManagement;
