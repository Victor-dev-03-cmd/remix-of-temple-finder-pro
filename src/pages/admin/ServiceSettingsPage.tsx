import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Search, ShoppingCart, Ticket, Shield, Globe, HeartHandshake } from 'lucide-react';

const serviceIcons = [Search, ShoppingCart, Ticket, Shield, Globe, HeartHandshake];

const defaultServices = [
  { title: 'Search Worldwide Temples', description: 'Explore and discover temple information from around the globe.' },
  { title: 'Temple E-Commerce', description: 'Buy temple products with secure e-commerce support.' },
  { title: 'Booking & Rooms', description: 'Book temple tickets and reserve nearby accommodations.' },
  { title: 'Full Security', description: 'Your data is protected with enterprise-grade security.' },
  { title: 'Global Community', description: 'Connect with devotees and temples worldwide.' },
  { title: 'Dedicated Support', description: '24/7 support to assist you on your spiritual journey.' },
];

const ServiceSettingsPage = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [services, setServices] = useState(defaultServices);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, service_1_title, service_1_description, service_2_title, service_2_description, service_3_title, service_3_description, service_4_title, service_4_description, service_5_title, service_5_description, service_6_title, service_6_description')
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load settings');
      setLoading(false);
      return;
    }

    if (data) {
      setSettingsId(data.id);
      setServices([
        { title: data.service_1_title || defaultServices[0].title, description: data.service_1_description || defaultServices[0].description },
        { title: data.service_2_title || defaultServices[1].title, description: data.service_2_description || defaultServices[1].description },
        { title: data.service_3_title || defaultServices[2].title, description: data.service_3_description || defaultServices[2].description },
        { title: data.service_4_title || defaultServices[3].title, description: data.service_4_description || defaultServices[3].description },
        { title: data.service_5_title || defaultServices[4].title, description: data.service_5_description || defaultServices[4].description },
        { title: data.service_6_title || defaultServices[5].title, description: data.service_6_description || defaultServices[5].description },
      ]);
    }
    setLoading(false);
  };

  const handleServiceChange = (index: number, field: 'title' | 'description', value: string) => {
    setServices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!settingsId) {
      toast.error('Settings not found');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .update({
        service_1_title: services[0].title,
        service_1_description: services[0].description,
        service_2_title: services[1].title,
        service_2_description: services[1].description,
        service_3_title: services[2].title,
        service_3_description: services[2].description,
        service_4_title: services[3].title,
        service_4_description: services[3].description,
        service_5_title: services[4].title,
        service_5_description: services[4].description,
        service_6_title: services[5].title,
        service_6_description: services[5].description,
      })
      .eq('id', settingsId);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Service settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Service Settings</h1>
            <p className="text-muted-foreground">Manage the 6 services displayed on the home page.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = serviceIcons[index];
            return (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Service {index + 1}</CardTitle>
                  </div>
                  <CardDescription>Configure service box {index + 1}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${index}`}>Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={service.title}
                      onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                      placeholder="Service title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`desc-${index}`}>Description</Label>
                    <Textarea
                      id={`desc-${index}`}
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      placeholder="Service description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServiceSettingsPage;
