import { useState, useEffect } from 'react';
import { Paintbrush, Save, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const colorPresets = [
  { name: 'Blue', primary: '217 91% 60%', accent: '43 96% 56%' },
  { name: 'Purple', primary: '262 83% 58%', accent: '280 65% 60%' },
  { name: 'Green', primary: '142 71% 45%', accent: '160 84% 39%' },
  { name: 'Red', primary: '0 84% 60%', accent: '25 95% 53%' },
  { name: 'Orange', primary: '25 95% 53%', accent: '38 92% 50%' },
  { name: 'Teal', primary: '173 80% 40%', accent: '187 92% 69%' },
];

const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.replace(/%/g, '').split(' ').map((v) => parseFloat(v));
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lDecimal - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '217 91% 60%';
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const ColorSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    primaryColor: '217 91% 60%',
    accentColor: '43 96% 56%',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
        if (error) throw error;
        if (data) {
          setSettingsId(data.id);
          setSettings({
            primaryColor: data.primary_color || '217 91% 60%',
            accentColor: data.accent_color || '43 96% 56%',
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
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--accent', settings.accentColor);
  }, [settings.primaryColor, settings.accentColor]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
      };

      if (settingsId) {
        await supabase.from('site_settings').update(updateData).eq('id', settingsId);
      } else {
        const { data } = await supabase.from('site_settings').insert(updateData).select().single();
        if (data) setSettingsId(data.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Color settings saved' });
    } catch (err) {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSettings({ primaryColor: preset.primary, accentColor: preset.accent });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-4">
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
          <h2 className="text-2xl font-bold text-foreground">Color Theme</h2>
          <p className="text-muted-foreground">Customize your brand colors</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Color Presets
          </CardTitle>
          <CardDescription>Quick select a color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  settings.primaryColor === preset.primary ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: hslToHex(preset.primary) }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: hslToHex(preset.accent) }} />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
                {settings.primaryColor === preset.primary && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Colors</CardTitle>
          <CardDescription>Fine-tune your color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.primaryColor)}
                  onChange={(e) => setSettings({ ...settings, primaryColor: hexToHsl(e.target.value) })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={hslToHex(settings.primaryColor)}
                  onChange={(e) => setSettings({ ...settings, primaryColor: hexToHsl(e.target.value) })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.accentColor)}
                  onChange={(e) => setSettings({ ...settings, accentColor: hexToHsl(e.target.value) })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={hslToHex(settings.accentColor)}
                  onChange={(e) => setSettings({ ...settings, accentColor: hexToHsl(e.target.value) })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorSettings;