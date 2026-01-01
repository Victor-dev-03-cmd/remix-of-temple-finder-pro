import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  ArrowDownToLine,
  Loader2,
  DollarSign,
  Clock,
  Wallet,
} from 'lucide-react';
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
    if (user) fetchBalanceData();
  }, [user]);

  const fetchBalanceData = async () => {
    if (!user) return;
    try {
      const { data: balanceData } = await supabase
        .from('vendor_balances')
        .select('*')
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (balanceData) setBalance(balanceData);

      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setWithdrawals(withdrawalData || []);
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
        description: `Minimum withdrawal is $${MIN_WITHDRAWAL}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance.available_balance) {
      toast({
        title: 'Insufficient Balance',
        description: 'Amount exceeds available balance.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await supabase.from('withdrawal_requests').insert({
        vendor_id: user.id,
        amount,
        status: 'pending',
      });

      await supabase
        .from('vendor_balances')
        .update({
          available_balance: balance.available_balance - amount,
          pending_balance: balance.pending_balance + amount,
        })
        .eq('vendor_id', user.id);

      toast({
        title: 'Withdrawal Requested',
        description: `Withdrawal of $${amount.toFixed(2)} submitted.`,
      });

      setWithdrawAmount('');
      setShowWithdrawDialog(false);
      fetchBalanceData();
    } finally {
      setSubmitting(false);
    }
  };

  const progress =
    balance ? Math.min((balance.available_balance / MIN_WITHDRAWAL) * 100, 100) : 0;

  const canWithdraw = balance && balance.available_balance >= MIN_WITHDRAWAL;

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden shadow-lg"
      >
        {/* ATM Card Header Design */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative p-4 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Vendor Earnings</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Balance & withdrawals
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Active</span>
            </div>
          </div>

          {/* Available Balance - Hero Section */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              ${balance?.available_balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              title="Total Earned"
              value={balance?.total_earnings}
              icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
              bg="bg-emerald-500/10"
              border="border-emerald-500/30"
            />
            <StatCard
              title="Pending"
              value={balance?.pending_balance}
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              bg="bg-amber-500/10"
              border="border-amber-500/30"
            />
            <StatCard
              title="Withdrawn"
              value={balance?.withdrawn_amount}
              icon={<Wallet className="h-4 w-4 text-blue-500" />}
              bg="bg-blue-500/10"
              border="border-blue-500/30"
            />
          </div>

          {/* Progress to minimum withdrawal */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">
                Progress to ${MIN_WITHDRAWAL} minimum
              </span>
              <span className="font-medium text-primary">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2 sm:h-3" />
          </div>

          {/* Withdraw Button */}
          <Button
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium"
            disabled={!canWithdraw}
            onClick={() => setShowWithdrawDialog(true)}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            {canWithdraw ? 'Request Withdrawal' : `Earn $${MIN_WITHDRAWAL} to Withdraw`}
          </Button>
        </div>

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <div className="border-t border-border/50 px-4 sm:px-6 py-4 bg-muted/30">
            <p className="text-xs sm:text-sm font-medium mb-3">Recent Withdrawals</p>
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      w.status === 'approved' ? 'bg-emerald-500' : 
                      w.status === 'rejected' ? 'bg-destructive' : 'bg-amber-500'
                    }`} />
                    <span className="text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-semibold">${w.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Minimum withdrawal amount: ${MIN_WITHDRAWAL}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Available Balance</Label>
              <p className="text-2xl font-bold text-primary">
                ${balance?.available_balance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
                type="number"
                min={MIN_WITHDRAWAL}
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
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------- Stat Card Component ---------- */

const StatCard = ({
  title,
  value,
  icon,
  bg,
  border,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  bg: string;
  border: string;
}) => (
  <div className={`rounded-xl border ${border} ${bg} p-3 sm:p-4`}>
    <div className="flex items-center gap-2 mb-1.5">
      {icon}
      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
        {title}
      </span>
    </div>
    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
      ${value?.toFixed(2) || '0.00'}
    </p>
  </div>
);

export default VendorEarningsCard;
