import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import { AuthModal } from '@/components/auth/AuthModal';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Validation Schemas
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

const countries = [
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
];

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('LK');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; confirmPassword?: string }>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'reset') {
      setMode('reset-password');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: 'Google Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string; confirmPassword?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode === 'login' || mode === 'signup' || mode === 'reset-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'reset-password' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (mode === 'signup') {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'Reset link sent! Please check your inbox.' });
        setMode('login');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Password reset successful. Please sign in.' });
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot-password') {
      await handleForgotPassword();
      return;
    }

    if (mode === 'reset-password') {
      await handleResetPassword();
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error }: any = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message.includes('Invalid login credentials') 
              ? 'Invalid email or password.' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Welcome!', description: 'Logged in successfully.' });
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error }: any = await signUp(email, password, fullName, country);
        
        if (error) {
          toast({
            title: 'Sign Up Failed',
            description: error.message.includes('already registered') 
              ? 'Email already exists. Try signing in.' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          // Sign out and show login modal popup
          await supabase.auth.signOut();
          
          toast({
            title: 'Account Created!',
            description: 'Please sign in with your new account.',
          });
          
          // Store email and show login modal popup
          setSignupEmail(email);
          setShowLoginModal(true);
          setPassword('');
          setFullName('');
          setErrors({});
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
      case 'reset-password': return 'Set New Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your Temple Connect account';
      case 'signup': return 'Join Temple Connect to explore temples and more';
      case 'forgot-password': return 'Enter your email for a reset link';
      case 'reset-password': return 'Enter your new password below';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode} // Mode மாறும் போது முழு கார்டும் அனிமேட் ஆகும் (Pop-up effect)
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md px-4"
          >
            <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
                  {getTitle()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getDescription()}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      key="signup-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select Country" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(mode !== 'reset-password') && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {mode === 'reset-password' ? 'New Password' : 'Password'}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                )}

                {mode === 'reset-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot-password'); setErrors({}); }}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full gap-2 h-11" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot-password' && 'Send Reset Link'}
                      {mode === 'reset-password' && 'Update Password'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Google OAuth - Only show for login and signup */}
                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-3 h-11"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form>

              {/* Toggle / Back Links */}
              <div className="mt-8 text-center text-sm border-t border-border pt-6">
                {mode === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrors({}); }}
                    className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </button>
                )}

                {(mode === 'login' || mode === 'signup') && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-muted-foreground">
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setErrors({});
                      }}
                      className="font-bold text-primary hover:underline decoration-2 underline-offset-4"
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Login Modal Popup after Signup */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultEmail={signupEmail}
        title="Sign In to Continue"
        description="Your account has been created! Please sign in to continue."
      />
    </div>
  );
};

export default Auth;