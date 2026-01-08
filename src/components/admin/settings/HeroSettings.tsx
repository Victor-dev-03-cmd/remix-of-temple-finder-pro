import { useState, useEffect, useRef } from 'react';
import { Layout, Save, Loader2, Upload, X, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const HeroSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    heroTitle: 'Discover Sacred Temples',
    heroSubtitle: 'Connect with Hindu temples across Sri Lanka',
    heroImageUrl: null as string | null,
    heroCtaText: 'Become a Temple Vendor',
    heroCtaLink: '/become-vendor',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            heroTitle: data.hero_title || '',
            heroSubtitle: data.hero_subtitle || '',
            heroImageUrl: data.hero_image_url,
            heroCtaText: data.hero_cta_text || '',
            heroCtaLink: data.hero_cta_link || '',
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `hero/hero-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('site-assets').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);
      setSettings(prev => ({ ...prev, heroImageUrl: publicUrl }));
      toast({ title: 'Hero image uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSettings(prev => ({ ...prev, heroImageUrl: null }));
    toast({ title: 'Hero image removed', description: 'Save to apply permanently.' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        hero_title: settings.heroTitle,
        hero_subtitle: settings.heroSubtitle,
        hero_image_url: settings.heroImageUrl,
        hero_cta_text: settings.heroCtaText,
        hero_cta_link: settings.heroCtaLink,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Hero settings saved' });
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
          <h2 className="text-2xl font-bold text-foreground">Hero Section</h2>
          <p className="text-muted-foreground">Configure the homepage banner</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Content
            </CardTitle>
            <CardDescription>Hero text and call-to-action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={settings.heroTitle}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                placeholder="Main headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={settings.heroSubtitle}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                placeholder="Supporting text"
                rows={3}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input
                  value={settings.heroCtaText}
                  onChange={(e) => setSettings({ ...settings, heroCtaText: e.target.value })}
                  placeholder="Button label"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input
                  value={settings.heroCtaLink}
                  onChange={(e) => setSettings({ ...settings, heroCtaLink: e.target.value })}
                  placeholder="/path"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Background Image
            </CardTitle>
            <CardDescription>Optional hero background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.heroImageUrl ? (
              <div className="relative">
                <img
                  src={settings.heroImageUrl}
                  alt="Hero background"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 rounded-lg border border-dashed bg-muted/30">
                <div className="text-center">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No image set</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeroSettings;