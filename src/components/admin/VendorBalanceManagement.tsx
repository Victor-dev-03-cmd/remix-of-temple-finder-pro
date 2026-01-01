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

import { Textarea } from '@/components/ui/textarea';

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



  const fetchData = async () => {

    setLoading(true);

    try {

      // Fetch pending withdrawal requests with vendor info

      const { data: withdrawalData, error: withdrawalError } = await supabase

        .from('withdrawal_requests')

        .select('*')

        .order('created_at', { ascending: false });



      if (withdrawalError) throw withdrawalError;



      // Fetch all vendor balances

      const { data: balanceData, error: balanceError } = await supabase

        .from('vendor_balances')

        .select('*')

        .order('total_earnings', { ascending: false });



      if (balanceError) throw balanceError;



      // Fetch profiles for vendors

      const vendorIds = [...new Set([

        ...(withdrawalData?.map(w => w.vendor_id) || []),

        ...(balanceData?.map(b => b.vendor_id) || [])

      ])];



      if (vendorIds.length > 0) {

        const { data: profiles } = await supabase

          .from('profiles')

          .select('user_id, full_name, email')

          .in('user_id', vendorIds);



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

    } catch (error) {

      console.error('Error fetching data:', error);

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



      // Update withdrawal status

      const { error: updateError } = await supabase

        .from('withdrawal_requests')

        .update({ 

          status: newStatus, 

          admin_notes: adminNotes || null,

          processed_at: new Date().toISOString(),

        })

        .eq('id', id);



      if (updateError) throw updateError;



      // Update vendor balance

      const balance = balances.find(b => b.vendor_id === withdrawal.vendor_id);

      if (balance) {

        if (action === 'approve') {

          await supabase

            .from('vendor_balances')

            .update({

              pending_balance: balance.pending_balance - withdrawal.amount,

              withdrawn_amount: balance.withdrawn_amount + withdrawal.amount,

            })

            .eq('vendor_id', withdrawal.vendor_id);

        } else {

          // Rejected - return to available balance

          await supabase

            .from('vendor_balances')

            .update({

              pending_balance: balance.pending_balance - withdrawal.amount,

              available_balance: balance.available_balance + withdrawal.amount,

            })

            .eq('vendor_id', withdrawal.vendor_id);

        }

      }



      toast({

        title: action === 'approve' ? 'Withdrawal Approved' : 'Withdrawal Rejected',

        description: `The withdrawal request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,

      });



      setAdminNotes('');

      fetchData();

    } catch (error) {

      console.error('Error processing withdrawal:', error);

      toast({ title: 'Error', description: 'Failed to process withdrawal.', variant: 'destructive' });

    } finally {

      setProcessingId(null);

    }

  };



  const handleAddBalance = async () => {

    if (!selectedVendor || !addAmount) {

      toast({ title: 'Error', description: 'Please select a vendor and enter an amount.', variant: 'destructive' });

      return;

    }



    const amount = parseFloat(addAmount);

    if (isNaN(amount) || amount <= 0) {

      toast({ title: 'Error', description: 'Please enter a valid amount.', variant: 'destructive' });

      return;

    }



    try {

      const existingBalance = balances.find(b => b.vendor_id === selectedVendor);



      if (existingBalance) {

        await supabase

          .from('vendor_balances')

          .update({

            total_earnings: existingBalance.total_earnings + amount,

            available_balance: existingBalance.available_balance + amount,

          })

          .eq('vendor_id', selectedVendor);

      } else {

        await supabase

          .from('vendor_balances')

          .insert({

            vendor_id: selectedVendor,

            total_earnings: amount,

            available_balance: amount,

          });

      }



      toast({

        title: 'Balance Added',

        description: `$${amount.toFixed(2)} has been added to the vendor's balance.`,

      });



      setShowAddBalance(false);

      setSelectedVendor('');

      setAddAmount('');

      fetchData();

    } catch (error) {

      console.error('Error adding balance:', error);

      toast({ title: 'Error', description: 'Failed to add balance.', variant: 'destructive' });

    }

  };



  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');



  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">

            <CreditCard className="h-5 w-5" />

            Vendor Balances & Withdrawals

          </h2>

          <p className="text-sm text-muted-foreground">Manage vendor earnings and process withdrawal requests</p>

        </div>

        <div className="flex gap-2">

          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>

            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />

          </Button>

          <Button onClick={() => setShowAddBalance(true)} className="gap-2">

            <ArrowUpRight className="h-4 w-4" />

            Add Balance

          </Button>

        </div>

      </div>



      {/* Pending Withdrawals */}

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="rounded-lg border border-border bg-card"

      >

        <div className="border-b border-border p-4">

          <h3 className="font-medium text-foreground">

            Pending Withdrawal Requests ({pendingWithdrawals.length})

          </h3>

        </div>

        

        {loading ? (

          <div className="flex items-center justify-center py-12">

            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

          </div>

        ) : pendingWithdrawals.length === 0 ? (

          <div className="py-12 text-center text-muted-foreground">

            <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />

            <p>No pending withdrawal requests</p>

          </div>

        ) : (

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>Vendor</TableHead>

                <TableHead>Amount</TableHead>

                <TableHead>Requested</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {pendingWithdrawals.map((withdrawal) => (

                <TableRow key={withdrawal.id}>

                  <TableCell>

                    <div>

                      <p className="font-medium">{withdrawal.vendor_profile?.full_name || 'Unknown'}</p>

                      <p className="text-sm text-muted-foreground">{withdrawal.vendor_profile?.email}</p>

                    </div>

                  </TableCell>

                  <TableCell className="font-semibold text-primary">

                    ${withdrawal.amount.toFixed(2)}

                  </TableCell>

                  <TableCell className="text-muted-foreground">

                    {new Date(withdrawal.created_at).toLocaleDateString()}

                  </TableCell>

                  <TableCell>

                    <Badge className="bg-warning/10 text-warning">Pending</Badge>

                  </TableCell>

                  <TableCell className="text-right">

                    <div className="flex justify-end gap-2">

                      <Button

                        size="sm"

                        variant="outline"

                        className="text-success"

                        onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}

                        disabled={processingId === withdrawal.id}

                      >

                        {processingId === withdrawal.id ? (

                          <Loader2 className="h-4 w-4 animate-spin" />

                        ) : (

                          <Check className="h-4 w-4" />

                        )}

                      </Button>

                      <Button

                        size="sm"

                        variant="outline"

                        className="text-destructive"

                        onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject')}

                        disabled={processingId === withdrawal.id}

                      >

                        <X className="h-4 w-4" />

                      </Button>

                    </div>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        )}

      </motion.div>



      {/* All Vendor Balances */}

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ delay: 0.1 }}

        className="rounded-lg border border-border bg-card"

      >

        <div className="border-b border-border p-4">

          <h3 className="font-medium text-foreground">All Vendor Balances</h3>

        </div>

        

        {loading ? (

          <div className="flex items-center justify-center py-12">

            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

          </div>

        ) : balances.length === 0 ? (

          <div className="py-12 text-center text-muted-foreground">

            <CreditCard className="mx-auto mb-4 h-12 w-12 opacity-50" />

            <p>No vendor balances yet</p>

          </div>

        ) : (

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>Vendor</TableHead>

                <TableHead>Total Earned</TableHead>

                <TableHead>Available</TableHead>

                <TableHead>Pending</TableHead>

                <TableHead>Withdrawn</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {balances.map((balance) => (

                <TableRow key={balance.vendor_id}>

                  <TableCell>

                    <div>

                      <p className="font-medium">{balance.vendor_profile?.full_name || 'Unknown'}</p>

                      <p className="text-sm text-muted-foreground">{balance.vendor_profile?.email}</p>

                    </div>

                  </TableCell>

                  <TableCell className="font-semibold">${balance.total_earnings.toFixed(2)}</TableCell>

                  <TableCell className="text-success">${balance.available_balance.toFixed(2)}</TableCell>

                  <TableCell className="text-warning">${balance.pending_balance.toFixed(2)}</TableCell>

                  <TableCell className="text-muted-foreground">${balance.withdrawn_amount.toFixed(2)}</TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        )}

      </motion.div>



      {/* Add Balance Dialog */}

      <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Add Balance to Vendor</DialogTitle>

            <DialogDescription>

              Manually add earnings to a vendor's balance.

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4 py-4">

            <div className="space-y-2">

              <Label>Select Vendor</Label>

              <select

                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

                value={selectedVendor}

                onChange={(e) => setSelectedVendor(e.target.value)}

              >

                <option value="">Select a vendor...</option>

                {balances.map((b) => (

                  <option key={b.vendor_id} value={b.vendor_id}>

                    {b.vendor_profile?.full_name || b.vendor_profile?.email || b.vendor_id}

                  </option>

                ))}

              </select>

            </div>

            <div className="space-y-2">

              <Label htmlFor="add-amount">Amount ($)</Label>

              <Input

                id="add-amount"

                type="number"

                min="0"

                step="0.01"

                placeholder="Enter amount"

                value={addAmount}

                onChange={(e) => setAddAmount(e.target.value)}

              />

            </div>

          </div>

          <DialogFooter>

            <Button variant="outline" onClick={() => setShowAddBalance(false)}>

              Cancel

            </Button>

            <Button onClick={handleAddBalance}>Add Balance</Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

};



export default VendorBalanceManagement;
