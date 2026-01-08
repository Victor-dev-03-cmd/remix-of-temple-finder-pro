import { useState, useEffect } from 'react';
import { Bell, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    newVendorAlerts: true,
    orderAlerts: true,
    chatNotifications: true,
    chatNotificationSound: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            emailNotifications: data.email_notifications ?? true,
            newVendorAlerts: data.new_vendor_alerts ?? true,
            orderAlerts: data.order_alerts ?? true,
            chatNotifications: (data as any).chat_notifications ?? true,
            chatNotificationSound: (data as any).chat_notification_sound ?? true,
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
        email_notifications: settings.emailNotifications,
        new_vendor_alerts: settings.newVendorAlerts,
        order_alerts: settings.orderAlerts,
        chat_notifications: settings.chatNotifications,
        chat_notification_sound: settings.chatNotificationSound,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Notification settings saved' });
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
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notification Settings</h2>
          <p className="text-muted-foreground">Configure alert preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive email alerts for system events</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">New Vendor Alerts</Label>
              <p className="text-xs text-muted-foreground">Get notified of new vendor applications</p>
            </div>
            <Switch
              checked={settings.newVendorAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, newVendorAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Order Alerts</Label>
              <p className="text-xs text-muted-foreground">Notify on new customer orders</p>
            </div>
            <Switch
              checked={settings.orderAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, orderAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Chat Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified of new chat messages</p>
            </div>
            <Switch
              checked={settings.chatNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, chatNotifications: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Chat Sound</Label>
              <p className="text-xs text-muted-foreground">Play sound for chat notifications</p>
            </div>
            <Switch
              checked={settings.chatNotificationSound}
              onCheckedChange={(checked) => setSettings({ ...settings, chatNotificationSound: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;