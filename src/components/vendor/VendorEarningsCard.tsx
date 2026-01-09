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
  Percent,
  CalendarDays,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle
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
import { Badge } from '@/components/ui/badge';

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
  status: 'pending' | 'approved' | 'rejected';
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
  const [commissionRate, setCommissionRate] = useState<number>(10);

  const MIN_WITHDRAWAL = balance?.min_withdrawal_amount || 100;

  useEffect(() => {
    if (user) {
      fetchBalanceData();
      fetchCommissionRate();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('vendor-balance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_balances', filter: `vendor_id=eq.${user.id}` }, 
      (payload) => {
        if (payload.new) setBalance(payload.new as VendorBalance);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests', filter: `vendor_id=eq.${user.id}` }, 
      () => {
        fetchBalanceData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchCommissionRate = async () => {
    const { data } = await supabase.from('site_settings').select('commission_rate').limit(1).maybeSingle();
    if (data?.commission_rate) setCommissionRate(data.commission_rate);
  };

  const fetchBalanceData = async () => {
    if (!user) return;
    try {
      const { data: balanceData } = await supabase.from('vendor_balances').select('*').eq('vendor_id', user.id).maybeSingle();
      if (balanceData) setBalance(balanceData);
      
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setWithdrawals((withdrawalData as WithdrawalRequest[]) || []);
    } finally { setLoading(false); }
  };

  const totalEarnings = balance?.total_earnings || 0;
  const withdrawnTotal = balance?.withdrawn_amount || 0;
  const commissionDeduction = (totalEarnings * commissionRate) / 100;
  const netEarnings = totalEarnings - commissionDeduction;
  const calculatedAvailable = Math.max(0, netEarnings - withdrawnTotal);

  const handleWithdrawRequest = async () => {
    if (!user || !balance) return;
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount < MIN_WITHDRAWAL || amount > calculatedAvailable) {
      toast({ title: 'Invalid Request', description: 'Please check the amount.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await supabase.from('withdrawal_requests').insert({ vendor_id: user.id, amount, status: 'pending' });
      toast({ title: 'Success', description: 'Withdrawal requested successfully.' });
      setWithdrawAmount('');
      setShowWithdrawDialog(false);
      fetchBalanceData();
    } finally { setSubmitting(false); }
  };

  const progress = Math.min((calculatedAvailable / MIN_WITHDRAWAL) * 100, 100);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden shadow-lg"
      >
        <div className="relative p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Vendor Earnings</h3>
                <p className="text-xs text-muted-foreground">Balance Management</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {100 - commissionRate}% Payout Rate
            </Badge>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-6 flex flex-col justify-center">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Available for Withdrawal</p>
              <p className="text-4xl sm:text-5xl font-bold text-foreground">
                ${calculatedAvailable.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex gap-3">
              <StatCard title="Total Earned" value={totalEarnings} icon={<DollarSign className="text-emerald-500" />} />
              <StatCard title="Commission" value={commissionDeduction} icon={<Percent className="text-destructive" />} />
              <StatCard title="Total Withdrawn" value={withdrawnTotal} icon={<Wallet className="text-blue-500" />} />
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 border border-border/50 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Your Net Share (After Fee)</p>
                <p className="text-xl font-bold">${netEarnings.toFixed(2)}</p>
              </div>
            </div>
            <div className="h-10 border-l border-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending in Admin</p>
                <p className="text-xl font-bold text-amber-600">${balance?.pending_balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase">Progress to Min Payout (${MIN_WITHDRAWAL})</span>
              <span className="text-primary">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            className="w-full h-12 font-bold"
            disabled={calculatedAvailable < MIN_WITHDRAWAL}
            onClick={() => setShowWithdrawDialog(true)}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            {calculatedAvailable >= MIN_WITHDRAWAL ? 'Request Withdrawal' : `Need $${(MIN_WITHDRAWAL - calculatedAvailable).toFixed(2)} more`}
          </Button>
        </div>

        <div className="border-t border-border/50 bg-muted/20">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-sm">Withdrawal History & Status</h4>
            </div>

            {withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block">
                        {w.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        {w.status === 'pending' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                        {w.status === 'rejected' && <XCircle className="h-5 w-5 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">${w.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {new Date(w.created_at).toLocaleDateString()} at {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <Badge 
                      className={`
                        uppercase text-[10px] font-bold border-none
                        ${w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : ''}
                        ${w.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : ''}
                        ${w.status === 'rejected' ? 'bg-destructive/10 text-destructive' : ''}
                      `}
                    >
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <p className="text-xs text-muted-foreground">No withdrawal requests found.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Min. limit: ${MIN_WITHDRAWAL}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Max Available</Label>
              <p className="text-3xl font-bold text-primary">${calculatedAvailable.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Withdraw</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg font-bold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
            <Button onClick={handleWithdrawRequest} disabled={submitting || !withdrawAmount} className="font-bold">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="rounded-xl border border-border/50 bg-background/50 p-4 min-w-[140px] flex-1">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">{title}</span>
    </div>
    <p className="text-lg font-bold">${value.toFixed(2)}</p>
  </div>
);

export default VendorEarningsCard;
