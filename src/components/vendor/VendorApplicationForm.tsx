import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Send, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface Temple {
  id: string;
  name: string;
}

const applicationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  templeName: z.string().min(2, 'Temple name must be at least 2 characters').max(100),
  templeId: z.string().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').max(20),
  description: z.string().min(20, 'Please provide at least 20 characters describing your business').max(500),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const VendorApplicationForm = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [temples, setTemples] = useState<Temple[]>([]);

  useEffect(() => {
    const fetchTemples = async () => {
      const { data, error } = await supabase
        .from('temples')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setTemples(data);
      }
    };

    fetchTemples();
  }, []);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessName: '',
      templeName: '',
      templeId: '',
      phone: '',
      description: '',
    },
  });

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a vendor application.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vendor_applications').insert({
        user_id: user.id,
        business_name: values.businessName,
        temple_name: values.templeName,
        temple_id: values.templeId || null,
        phone: values.phone,
        description: values.description,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You already have a pending application.');
        }
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: 'Application Submitted',
        description: 'Your vendor application has been submitted for review.',
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">Application Submitted!</h3>
        <p className="text-muted-foreground">
          Thank you for your interest in becoming a vendor. Our team will review your application
          and get back to you within 2-3 business days.
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
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Vendor Application</h2>
          <p className="text-sm text-muted-foreground">Fill out the form to apply as a temple vendor</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your business or shop name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Temple Selection */}
          {temples.length > 0 && (
            <FormField
              control={form.control}
              name="templeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Existing Temple (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a temple from our list" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {temples.map((temple) => (
                        <SelectItem key={temple.id} value={temple.id}>
                          {temple.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="templeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temple Name</FormLabel>
                <FormControl>
                  <Input placeholder="Temple you wish to be associated with" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+94 XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business, what products or services you offer..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};

export default VendorApplicationForm;
