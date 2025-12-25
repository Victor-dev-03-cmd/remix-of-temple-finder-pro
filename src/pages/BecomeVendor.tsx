import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VendorApplicationForm from '@/components/vendor/VendorApplicationForm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BecomeVendor = () => {
  const { user, isVendor, loading: authLoading } = useAuth();
  const [existingApplication, setExistingApplication] = useState<{
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('vendor_applications')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setExistingApplication(data);
      setLoading(false);
    };

    if (!authLoading) {
      checkExistingApplication();
    }
  }, [user, authLoading]);

  // Redirect vendors to their dashboard
  if (isVendor) {
    return <Navigate to="/vendor" replace />;
  }

  const renderApplicationStatus = () => {
    if (!existingApplication) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        title: 'Application Under Review',
        description: 'Your vendor application is being reviewed by our team. We\'ll notify you once a decision has been made.',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
      },
      approved: {
        icon: CheckCircle,
        title: 'Application Approved!',
        description: 'Congratulations! Your vendor application has been approved. You can now access your vendor dashboard.',
        color: 'text-success',
        bgColor: 'bg-success/10',
      },
      rejected: {
        icon: AlertCircle,
        title: 'Application Not Approved',
        description: 'Unfortunately, your vendor application was not approved at this time. You may submit a new application.',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
      },
    };

    const config = statusConfig[existingApplication.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-8 text-center"
      >
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon className={`h-8 w-8 ${config.color}`} />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{config.title}</h3>
        <p className="mb-6 text-muted-foreground">{config.description}</p>
        {existingApplication.status === 'rejected' && (
          <Button onClick={() => setExistingApplication(null)}>
            Submit New Application
          </Button>
        )}
        {existingApplication.status === 'approved' && (
          <Button asChild>
            <Link to="/vendor">Go to Vendor Dashboard</Link>
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-12">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Become a Temple Vendor
            </h1>
            <p className="text-muted-foreground">
              Join our platform and connect with devotees across Sri Lanka
            </p>
          </motion.div>

          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card p-8 text-center"
            >
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Sign In Required
              </h3>
              <p className="mb-6 text-muted-foreground">
                Please sign in or create an account to apply as a vendor.
              </p>
              <Button asChild>
                <Link to="/auth">Sign In / Sign Up</Link>
              </Button>
            </motion.div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : existingApplication && existingApplication.status !== 'rejected' ? (
            renderApplicationStatus()
          ) : (
            <VendorApplicationForm />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeVendor;
