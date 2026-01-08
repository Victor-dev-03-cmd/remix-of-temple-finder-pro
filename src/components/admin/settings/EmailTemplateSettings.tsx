import { useState, useEffect } from 'react';
import { Mail, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailTemplateSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    emailFromName: 'Temple Connect',
    emailFromAddress: 'onboarding@resend.dev',
    bookingEmailSubject: '',
    bookingEmailGreeting: '',
    bookingEmailMessage: '',
    bookingEmailInstructions: '',
    vendorApprovalEmailSubject: '',
    vendorApprovalEmailMessage: '',
    vendorRejectionEmailSubject: '',
    vendorRejectionEmailMessage: '',
    newOrderEmailSubject: '',
    newOrderEmailMessage: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            emailFromName: (data as any).email_from_name || 'Temple Connect',
            emailFromAddress: (data as any).email_from_address || 'onboarding@resend.dev',
            bookingEmailSubject: (data as any).booking_email_subject || '',
            bookingEmailGreeting: (data as any).booking_email_greeting || '',
            bookingEmailMessage: (data as any).booking_email_message || '',
            bookingEmailInstructions: (data as any).booking_email_instructions || '',
            vendorApprovalEmailSubject: (data as any).vendor_approval_email_subject || '',
            vendorApprovalEmailMessage: (data as any).vendor_approval_email_message || '',
            vendorRejectionEmailSubject: (data as any).vendor_rejection_email_subject || '',
            vendorRejectionEmailMessage: (data as any).vendor_rejection_email_message || '',
            newOrderEmailSubject: (data as any).new_order_email_subject || '',
            newOrderEmailMessage: (data as any).new_order_email_message || '',
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        email_from_name: settings.emailFromName,
        email_from_address: settings.emailFromAddress,
        booking_email_subject: settings.bookingEmailSubject,
        booking_email_greeting: settings.bookingEmailGreeting,
        booking_email_message: settings.bookingEmailMessage,
        booking_email_instructions: settings.bookingEmailInstructions,
        vendor_approval_email_subject: settings.vendorApprovalEmailSubject,
        vendor_approval_email_message: settings.vendorApprovalEmailMessage,
        vendor_rejection_email_subject: settings.vendorRejectionEmailSubject,
        vendor_rejection_email_message: settings.vendorRejectionEmailMessage,
        new_order_email_subject: settings.newOrderEmailSubject,
        new_order_email_message: settings.newOrderEmailMessage,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Email templates saved' });
    } catch (err) {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Templates</h2>
          <p className="text-muted-foreground">Customize email notifications</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sender Settings
          </CardTitle>
          <CardDescription>Configure email sender information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={settings.emailFromName}
                onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                placeholder="Your Site Name"
              />
            </div>
            <div className="space-y-2">
              <Label>From Address</Label>
              <Input
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                placeholder="noreply@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Customize email content for different events</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="rejection">Rejection</TabsTrigger>
              <TabsTrigger value="order">Order</TabsTrigger>
            </TabsList>
            
            <TabsContent value="booking" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={settings.bookingEmailSubject}
                  onChange={(e) => setSettings({ ...settings, bookingEmailSubject: e.target.value })}
                  placeholder="Booking Confirmation - {{temple_name}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Greeting</Label>
                <Input
                  value={settings.bookingEmailGreeting}
                  onChange={(e) => setSettings({ ...settings, bookingEmailGreeting: e.target.value })}
                  placeholder="Namaste, {{customer_name}}!"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={settings.bookingEmailMessage}
                  onChange={(e) => setSettings({ ...settings, bookingEmailMessage: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions (pipe-separated)</Label>
                <Textarea
                  value={settings.bookingEmailInstructions}
                  onChange={(e) => setSettings({ ...settings, bookingEmailInstructions: e.target.value })}
                  placeholder="Instruction 1|Instruction 2|..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={settings.vendorApprovalEmailSubject}
                  onChange={(e) => setSettings({ ...settings, vendorApprovalEmailSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={settings.vendorApprovalEmailMessage}
                  onChange={(e) => setSettings({ ...settings, vendorApprovalEmailMessage: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="rejection" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={settings.vendorRejectionEmailSubject}
                  onChange={(e) => setSettings({ ...settings, vendorRejectionEmailSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={settings.vendorRejectionEmailMessage}
                  onChange={(e) => setSettings({ ...settings, vendorRejectionEmailMessage: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="order" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={settings.newOrderEmailSubject}
                  onChange={(e) => setSettings({ ...settings, newOrderEmailSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={settings.newOrderEmailMessage}
                  onChange={(e) => setSettings({ ...settings, newOrderEmailMessage: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateSettings;