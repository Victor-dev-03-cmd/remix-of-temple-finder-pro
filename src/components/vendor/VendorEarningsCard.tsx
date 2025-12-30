import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, TrendingUp, ArrowDownToLine, Loader2, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface VendorBalance {
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_amount: number;
  min_withdrawal_amount: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const VendorEarningsCard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MIN_WITHDRAWAL = balance?.min_withdrawal_amount || 100;

  useEffect(() => {
    if (user) {
      fetchBalanceData();
    }
  }, [user]);

  const fetchBalanceData = async () => {
    if (!user) return;
    
    try {
      // Fetch or create balance record
      const { data: balanceData, error: balanceError } = await supabase
        .from('vendor_balances')
        .select('*')
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;
      
      if (balanceData) {
        setBalance(balanceData);
      } else {
        // Create initial balance record
        const { data: newBalance, error: insertError } = await supabase
          .from('vendor_balances')
          .insert({ vendor_id: user.id })
          .select()
          .single();
        
        if (!insertError && newBalance) {
          setBalance(newBalance);
        }
      }

      // Fetch withdrawal history
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setWithdrawals(withdrawalData || []);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!user || !balance) return;
    
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance.available_balance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your available balance.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create withdrawal request
      const { error: requestError } = await supabase
        .from('withdrawal_requests')
        .insert({
          vendor_id: user.id,
          amount: amount,
          status: 'pending',
        });

      if (requestError) throw requestError;

      // Update pending balance
      const { error: updateError } = await supabase
        .from('vendor_balances')
        .update({
          available_balance: balance.available_balance - amount,
          pending_balance: balance.pending_balance + amount,
        })
        .eq('vendor_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal request for $${amount.toFixed(2)} has been submitted.`,
      });

      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      fetchBalanceData();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit withdrawal request.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progressToWithdrawal = balance 
    ? Math.min((balance.available_balance / MIN_WITHDRAWAL) * 100, 100)
    : 0;

  const canWithdraw = balance && balance.available_balance >= MIN_WITHDRAWAL;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5"
      >
        {/* ATM Card Design */}
        <div className="relative p-6">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Vendor Earnings</h3>
                <p className="text-sm text-muted-foreground">Your balance & withdrawals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
              <div className="h-8 w-8 rounded-full bg-primary/40 -ml-4" />
            </div>
          </div>

          {/* Balance Display */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                ${balance?.available_balance?.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Total Earned</span>
              </div>
              <p className="font-semibold text-foreground">${balance?.total_earnings?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="font-semibold text-foreground">${balance?.pending_balance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Withdrawn</span>
              </div>
              <p className="font-semibold text-foreground">${balance?.withdrawn_amount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Progress to Withdrawal */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to ${MIN_WITHDRAWAL} minimum</span>
              <span className="font-medium text-foreground">{progressToWithdrawal.toFixed(0)}%</span>
            </div>
            <Progress value={progressToWithdrawal} className="h-2" />
            {!canWithdraw && (
              <p className="text-xs text-muted-foreground mt-2">
                Earn ${(MIN_WITHDRAWAL - (balance?.available_balance || 0)).toFixed(2)} more to unlock withdrawals
              </p>
            )}
          </div>

          {/* Withdraw Button */}
          <Button 
            className="w-full gap-2" 
            disabled={!canWithdraw}
            onClick={() => setShowWithdrawDialog(true)}
          >
            <ArrowDownToLine className="h-4 w-4" />
            {canWithdraw ? 'Request Withdrawal' : `Minimum $${MIN_WITHDRAWAL} Required`}
          </Button>
        </div>

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Recent Withdrawals</h4>
            <div className="space-y-2">
              {withdrawals.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      w.status === 'completed' ? 'bg-success' :
                      w.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                    }`} />
                    <span className="text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">${w.amount.toFixed(2)}</span>
                    <span className={`text-xs capitalize ${
                      w.status === 'completed' ? 'text-success' :
                      w.status === 'pending' ? 'text-warning' : 'text-destructive'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 bg-primary/10 rounded-full blur-2xl" />
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the amount you'd like to withdraw. Minimum: ${MIN_WITHDRAWAL}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <p className="text-2xl font-bold text-primary">${balance?.available_balance?.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min={MIN_WITHDRAWAL}
                max={balance?.available_balance || 0}
                step="0.01"
                placeholder={`Min: $${MIN_WITHDRAWAL}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdrawRequest} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorEarningsCard;
