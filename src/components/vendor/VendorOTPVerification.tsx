import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface VendorOTPVerificationProps {
  stage: 'pre_submission' | 'post_approval';
  onVerificationComplete: () => void;
  applicationId?: string;
}

const VendorOTPVerification = ({ stage, onVerificationComplete, applicationId }: VendorOTPVerificationProps) => {
  const { user } = useAuth();
  const [emailOTP, setEmailOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Check existing verification status
    const checkVerification = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('vendor_verifications')
        .select('email_verified')
        .eq('user_id', user.id)
        .eq('verification_stage', stage)
        .maybeSingle();

      if (data?.email_verified) {
        setIsComplete(true);
        onVerificationComplete();
      }
    };

    checkVerification();
  }, [user, stage, onVerificationComplete]);

  const sendEmailOTP = async () => {
    if (!user?.email) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          type: 'email',
          email: user.email,
          verificationStage: stage,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      setCountdown(60);
      toast({
        title: 'OTP Sent',
        description: `Verification code sent to ${user.email}`,
      });
    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (emailOTP.length !== 6) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          type: 'email',
          otp: emailOTP,
          verificationStage: stage,
        },
      });

      if (error) throw error;

      if (data.emailVerified) {
        toast({
          title: 'Email Verified',
          description: 'Your email has been verified successfully',
        });
        setIsComplete(true);
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('Error verifying email OTP:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid or expired OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">Verification Complete!</h3>
        <p className="text-muted-foreground">
          Your email has been verified successfully.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Verify Your Email</h3>
          <p className="text-sm text-muted-foreground">
            We'll send a verification code to {user?.email}
          </p>
        </div>

        {!emailSent ? (
          <Button
            onClick={sendEmailOTP}
            className="w-full gap-2"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Verification Code
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Label>Enter the 6-digit code</Label>
              <InputOTP maxLength={6} value={emailOTP} onChange={setEmailOTP}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={verifyEmailOTP}
              className="w-full"
              disabled={emailOTP.length !== 6 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={sendEmailOTP}
                disabled={countdown > 0 || isSending}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VendorOTPVerification;
