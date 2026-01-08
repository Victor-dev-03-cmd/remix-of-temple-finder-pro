import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Loader2, Upload, X, Image, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CountrySelector from '../CountrySelector';

const GeneralSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    siteName: 'Temple Connect',
    defaultCountry: 'LK',
    maintenanceMode: false,
    commissionRate: 10,
    logoUrl: null as string | null,
    logoDarkUrl: null as string | null,
    logoSize: 40,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            siteName: data.site_name || 'Temple Connect',
            defaultCountry: data.default_country || 'LK',
            maintenanceMode: data.maintenance_mode || false,
            commissionRate: (data as any).commission_rate || 10,
            logoUrl: data.logo_url,
            logoDarkUrl: (data as any).logo_dark_url || null,
            logoSize: (data as any).logo_size || 40,
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'light') setUploadingLight(true);
    else setUploadingDark(true);

    try {
      const filePath = `logos/${type}-logo-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('site-assets').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);

      if (type === 'light') {
        setSettings(prev => ({ ...prev, logoUrl: publicUrl }));
      } else {
        setSettings(prev => ({ ...prev, logoDarkUrl: publicUrl }));
      }
      toast({ title: `${type === 'light' ? 'Light' : 'Dark'} mode logo uploaded` });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      if (type === 'light') setUploadingLight(false);
      else setUploadingDark(false);
    }
  };

  const handleRemoveLogo = (type: 'light' | 'dark') => {
    if (type === 'light') {
      setSettings(prev => ({ ...prev, logoUrl: null }));
    } else {
      setSettings(prev => ({ ...prev, logoDarkUrl: null }));
    }
    toast({ title: `${type === 'light' ? 'Light' : 'Dark'} mode logo removed`, description: "Save changes to apply permanently." });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        site_name: settings.siteName,
        default_country: settings.defaultCountry,
        maintenance_mode: settings.maintenanceMode,
        commission_rate: settings.commissionRate,
        logo_url: settings.logoUrl,
        logo_dark_url: settings.logoDarkUrl,
        logo_size: settings.logoSize,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Settings saved successfully' });
    } catch (err) {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
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
          <h2 className="text-2xl font-bold text-foreground">General Settings</h2>
          <p className="text-muted-foreground">Basic platform configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Site Information
            </CardTitle>
            <CardDescription>Configure basic site details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                placeholder="Enter site name"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionRate">Vendor Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Percentage commission taken from vendor sales
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Default Country</Label>
              <CountrySelector
                value={settings.defaultCountry}
                onChange={(value) => setSettings({ ...settings, defaultCountry: value })}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable the site for users
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Site Logos
            </CardTitle>
            <CardDescription>Upload logos for light and dark modes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Light Mode Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <Label>Light Mode Logo</Label>
              </div>
              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <div className="relative">
                    <img
                      src={settings.logoUrl}
                      alt="Light mode logo"
                      className="object-contain rounded border border-border bg-white p-2"
                      style={{ height: `${settings.logoSize}px`, maxWidth: '150px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLogo('light')}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded border border-dashed border-border bg-white" style={{ height: `${settings.logoSize}px`, width: '100px' }}>
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={lightLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'light')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => lightLogoInputRef.current?.click()}
                    disabled={uploadingLight}
                  >
                    {uploadingLight ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dark Mode Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-400" />
                <Label>Dark Mode Logo</Label>
              </div>
              <div className="flex items-center gap-4">
                {settings.logoDarkUrl ? (
                  <div className="relative">
                    <img
                      src={settings.logoDarkUrl}
                      alt="Dark mode logo"
                      className="object-contain rounded border border-border bg-slate-900 p-2"
                      style={{ height: `${settings.logoSize}px`, maxWidth: '150px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLogo('dark')}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded border border-dashed border-border bg-slate-900" style={{ height: `${settings.logoSize}px`, width: '100px' }}>
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={darkLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'dark')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => darkLogoInputRef.current?.click()}
                    disabled={uploadingDark}
                  >
                    {uploadingDark ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Logo Size Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Logo Size</Label>
                <span className="text-sm text-muted-foreground">{settings.logoSize}px</span>
              </div>
              <Slider
                value={[settings.logoSize]}
                onValueChange={(value) => setSettings({ ...settings, logoSize: value[0] })}
                min={24}
                max={80}
                step={2}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust the display size of your site logo (24px - 80px)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeneralSettings;