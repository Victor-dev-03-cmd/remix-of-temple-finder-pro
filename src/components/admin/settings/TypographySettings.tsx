import { useState, useEffect } from 'react';
import { Type, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const fontOptions = [
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
];

const displayFontOptions = [
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Poppins', label: 'Poppins' },
];

const TypographySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    primaryFont: 'Outfit',
    displayFont: 'Playfair Display',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            primaryFont: data.primary_font || 'Outfit',
            displayFont: data.display_font || 'Playfair Display',
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

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-sans', settings.primaryFont);
    root.style.setProperty('--font-display', settings.displayFont);

    const fontId = 'dynamic-site-fonts';
    let link = document.getElementById(fontId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const primary = settings.primaryFont.replace(/\s+/g, '+');
    const display = settings.displayFont.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${primary}:wght@400;500;600;700&family=${display}:wght@400;500;600;700&display=swap`;
  }, [settings.primaryFont, settings.displayFont]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        primary_font: settings.primaryFont,
        display_font: settings.displayFont,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Typography settings saved' });
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
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Typography</h2>
          <p className="text-muted-foreground">Configure fonts for your site</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Font Selection
          </CardTitle>
          <CardDescription>Choose fonts for body text and headings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Primary Font (Body Text)</Label>
            <Select value={settings.primaryFont} onValueChange={(value) => setSettings({ ...settings, primaryFont: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm mt-2" style={{ fontFamily: settings.primaryFont }}>
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Display Font (Headings)</Label>
            <Select value={settings.displayFont} onValueChange={(value) => setSettings({ ...settings, displayFont: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {displayFontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xl font-semibold mt-2" style={{ fontFamily: settings.displayFont }}>
              Heading Example Text
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographySettings;