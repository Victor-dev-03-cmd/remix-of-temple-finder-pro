import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Bell, Shield, Palette, Type, Loader2, Paintbrush, Upload, X, Image, Globe, Layout, Mail, ChevronDown, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CountrySelector from './CountrySelector';

const settingsSections = [
  { id: 'settings-general', label: 'General Settings', icon: Settings, keywords: ['site name', 'logo', 'commission', 'country', 'maintenance'] },
  { id: 'settings-notifications', label: 'Notifications', icon: Bell, keywords: ['email', 'alerts', 'chat', 'sound', 'vendor', 'order'] },
  { id: 'settings-security', label: 'Security', icon: Shield, keywords: ['password', 'auth', 'login', 'two-factor', '2fa'] },
  { id: 'settings-appearance', label: 'Appearance', icon: Palette, keywords: ['dark mode', 'compact', 'theme', 'layout'] },
  { id: 'settings-colors', label: 'Color Theme', icon: Paintbrush, keywords: ['primary', 'accent', 'color', 'preset', 'hex'] },
  { id: 'settings-typography', label: 'Typography', icon: Type, keywords: ['font', 'display', 'text', 'heading'] },
  { id: 'settings-hero', label: 'Hero Section', icon: Layout, keywords: ['banner', 'title', 'subtitle', 'cta', 'image', 'background'] },
  { id: 'settings-footer', label: 'Footer', icon: Globe, keywords: ['tagline', 'social', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube'] },
  { id: 'settings-email', label: 'Email Templates', icon: Mail, keywords: ['booking', 'vendor', 'approval', 'rejection', 'order', 'template', 'subject', 'message'] },
];

const fontOptions = [
  { value: 'Outfit', label: 'Outfit', preview: 'font-outfit' },
  { value: 'Inter', label: 'Inter', preview: 'font-inter' },
  { value: 'Poppins', label: 'Poppins', preview: 'font-poppins' },
  { value: 'Roboto', label: 'Roboto', preview: 'font-roboto' },
];

const displayFontOptions = [
  { value: 'Playfair Display', label: 'Playfair Display', preview: 'font-playfair' },
  { value: 'Outfit', label: 'Outfit', preview: 'font-outfit' },
  { value: 'Poppins', label: 'Poppins', preview: 'font-poppins' },
];

const colorPresets = [
  { name: 'Blue', primary: '217 91% 60%', accent: '43 96% 56%' },
  { name: 'Purple', primary: '262 83% 58%', accent: '280 65% 60%' },
  { name: 'Green', primary: '142 71% 45%', accent: '160 84% 39%' },
  { name: 'Red', primary: '0 84% 60%', accent: '25 95% 53%' },
  { name: 'Orange', primary: '25 95% 53%', accent: '38 92% 50%' },
  { name: 'Teal', primary: '173 80% 40%', accent: '187 92% 69%' },
];

// Convert HSL string to hex for color input
const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map((v) => parseFloat(v));
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

// Convert hex to HSL string
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '217 91% 60%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
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

const SiteSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('settings-general');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    siteName: 'Temple Connect',
    defaultCountry: 'LK',
    maintenanceMode: false,
    emailNotifications: true,
    newVendorAlerts: true,
    orderAlerts: true,
    chatNotifications: true,
    chatNotificationSound: true,
    primaryFont: 'Outfit',
    displayFont: 'Playfair Display',
    darkMode: false,
    compactMode: false,
    primaryColor: '217 91% 60%',
    accentColor: '43 96% 56%',
    logoUrl: null as string | null,
    footerTagline: 'Connecting devotees with Hindu temples across Sri Lanka.',
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialLinkedin: '',
    socialYoutube: '',
    heroTitle: 'Discover Sacred Temples',
    heroSubtitle: 'Connect with Hindu temples across Sri Lanka and explore sacred traditions',
    heroImageUrl: null as string | null,
    heroCtaText: 'Become a Temple Vendor',
    heroCtaLink: '/become-vendor',
    commissionRate: 10,
    // Email template settings
    emailFromName: 'Temple Connect',
    emailFromAddress: 'onboarding@resend.dev',
    bookingEmailSubject: 'Booking Confirmation - {{temple_name}}',
    bookingEmailGreeting: 'Namaste, {{customer_name}}!',
    bookingEmailMessage: 'Your temple visit has been confirmed. Please present this QR code at the temple entrance.',
    bookingEmailInstructions: 'Please arrive 15 minutes before your scheduled visit|Carry a valid ID proof along with this confirmation|Dress code: Traditional or modest attire recommended|Photography rules vary by temple - please check at entrance',
    vendorApprovalEmailSubject: 'Your Vendor Application has been Approved!',
    vendorApprovalEmailMessage: 'Congratulations! Your application to become a vendor on Temple Connect has been approved. You can now access your vendor dashboard and start managing your temple products.',
    vendorRejectionEmailSubject: 'Update on Your Vendor Application',
    vendorRejectionEmailMessage: 'Thank you for your interest in becoming a vendor on Temple Connect. After careful review, we are unable to approve your application at this time. Please feel free to reapply or contact us for more information.',
    newOrderEmailSubject: 'New Order Received - Order #{{order_id}}',
    newOrderEmailMessage: 'You have received a new order. Please check your vendor dashboard for order details and process it promptly.',
  });

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettingsId(data.id);
          setSettings({
            siteName: data.site_name,
            defaultCountry: data.default_country,
            maintenanceMode: data.maintenance_mode,
            emailNotifications: data.email_notifications,
            newVendorAlerts: data.new_vendor_alerts,
            orderAlerts: data.order_alerts,
            chatNotifications: (data as any).chat_notifications ?? true,
            chatNotificationSound: (data as any).chat_notification_sound ?? true,
            primaryFont: data.primary_font,
            displayFont: data.display_font,
            darkMode: data.dark_mode,
            compactMode: data.compact_mode,
            primaryColor: data.primary_color || '217 91% 60%',
            accentColor: data.accent_color || '43 96% 56%',
            logoUrl: data.logo_url,
            footerTagline: data.footer_tagline || 'Connecting devotees with Hindu temples across Sri Lanka.',
            socialFacebook: data.social_facebook || '',
            socialInstagram: data.social_instagram || '',
            socialTwitter: data.social_twitter || '',
            socialLinkedin: data.social_linkedin || '',
            socialYoutube: data.social_youtube || '',
            heroTitle: data.hero_title || 'Discover Sacred Temples',
            heroSubtitle: data.hero_subtitle || 'Connect with Hindu temples across Sri Lanka and explore sacred traditions',
            heroImageUrl: data.hero_image_url,
            heroCtaText: data.hero_cta_text || 'Become a Temple Vendor',
            heroCtaLink: data.hero_cta_link || '/become-vendor',
            commissionRate: (data as any).commission_rate || 10,
            // Email templates
            emailFromName: (data as any).email_from_name || 'Temple Connect',
            emailFromAddress: (data as any).email_from_address || 'onboarding@resend.dev',
            bookingEmailSubject: (data as any).booking_email_subject || 'Booking Confirmation - {{temple_name}}',
            bookingEmailGreeting: (data as any).booking_email_greeting || 'Namaste, {{customer_name}}!',
            bookingEmailMessage: (data as any).booking_email_message || 'Your temple visit has been confirmed. Please present this QR code at the temple entrance.',
            bookingEmailInstructions: (data as any).booking_email_instructions || 'Please arrive 15 minutes before your scheduled visit|Carry a valid ID proof along with this confirmation|Dress code: Traditional or modest attire recommended|Photography rules vary by temple - please check at entrance',
            vendorApprovalEmailSubject: (data as any).vendor_approval_email_subject || 'Your Vendor Application has been Approved!',
            vendorApprovalEmailMessage: (data as any).vendor_approval_email_message || 'Congratulations! Your application to become a vendor on Temple Connect has been approved. You can now access your vendor dashboard and start managing your temple products.',
            vendorRejectionEmailSubject: (data as any).vendor_rejection_email_subject || 'Update on Your Vendor Application',
            vendorRejectionEmailMessage: (data as any).vendor_rejection_email_message || 'Thank you for your interest in becoming a vendor on Temple Connect. After careful review, we are unable to approve your application at this time. Please feel free to reapply or contact us for more information.',
            newOrderEmailSubject: (data as any).new_order_email_subject || 'New Order Received - Order #{{order_id}}',
            newOrderEmailMessage: (data as any).new_order_email_message || 'You have received a new order. Please check your vendor dashboard for order details and process it promptly.',
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast({
          title: 'Error loading settings',
          description: 'Could not load site settings. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Apply font and color changes to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', settings.primaryFont);
    document.documentElement.style.setProperty('--font-display', settings.displayFont);
    document.documentElement.style.setProperty('--primary', settings.primaryColor);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }, [settings.primaryFont, settings.displayFont, settings.primaryColor, settings.accentColor]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      setSettings({ ...settings, logoUrl: publicUrl });
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded. Click Save to apply changes.',
      });
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setSettings({ ...settings, logoUrl: null });
  };

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingHero(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      setSettings({ ...settings, heroImageUrl: publicUrl });
      toast({
        title: 'Hero image uploaded',
        description: 'Your hero image has been uploaded. Click Save to apply changes.',
      });
    } catch (err) {
      console.error('Error uploading hero image:', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload hero image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveHeroImage = () => {
    setSettings({ ...settings, heroImageUrl: null });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        site_name: settings.siteName,
        default_country: settings.defaultCountry,
        maintenance_mode: settings.maintenanceMode,
        email_notifications: settings.emailNotifications,
        new_vendor_alerts: settings.newVendorAlerts,
        order_alerts: settings.orderAlerts,
        chat_notifications: settings.chatNotifications,
        chat_notification_sound: settings.chatNotificationSound,
        primary_font: settings.primaryFont,
        display_font: settings.displayFont,
        dark_mode: settings.darkMode,
        compact_mode: settings.compactMode,
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
        logo_url: settings.logoUrl,
        footer_tagline: settings.footerTagline,
        social_facebook: settings.socialFacebook || null,
        social_instagram: settings.socialInstagram || null,
        social_twitter: settings.socialTwitter || null,
        social_linkedin: settings.socialLinkedin || null,
        social_youtube: settings.socialYoutube || null,
        hero_title: settings.heroTitle,
        hero_subtitle: settings.heroSubtitle,
        hero_image_url: settings.heroImageUrl,
        hero_cta_text: settings.heroCtaText,
        hero_cta_link: settings.heroCtaLink,
        commission_rate: settings.commissionRate,
        // Email template settings
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
        const { error } = await supabase
          .from('site_settings')
          .update(updateData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('site_settings')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        setSettingsId(data.id);
      }

      toast({
        title: 'Settings saved',
        description: 'Your site settings have been updated successfully.',
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error saving settings',
        description: 'Could not save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setSettings({
      ...settings,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchQuery(''); // Clear search when navigating
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter sections based on search query
  const filteredSections = searchQuery.trim()
    ? settingsSections.filter(
        (section) =>
          section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : settingsSections;

  return (
    <div className="flex gap-6">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-3">
          {/* Search Input */}
          <div className="relative px-3">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <h3 className="text-sm font-semibold text-muted-foreground px-3">
            {searchQuery ? `Results (${filteredSections.length})` : 'Settings'}
          </h3>
          
          <div className="space-y-1">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground px-3 py-2">No settings found</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Site Settings</h2>
            <p className="text-muted-foreground">Manage your platform configuration</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Mobile Dropdown with Sidebar Navigation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto lg:hidden">
                  Jump to Section
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 bg-popover">
                {/* Search in dropdown */}
                <div className="px-2 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search settings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {searchQuery ? `Results (${filteredSections.length})` : 'Settings Sections'}
                  </p>
                </div>
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {filteredSections.length > 0 ? (
                    filteredSections.map((section) => (
                      <DropdownMenuItem
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`cursor-pointer rounded-md px-3 py-2.5 ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground font-medium'
                            : ''
                        }`}
                      >
                        <section.icon className="mr-3 h-4 w-4" />
                        {section.label}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground px-3 py-2">No settings found</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSave} className="w-full sm:w-auto" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card id="settings-general">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
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
            <div className="space-y-2">
              <Label>Site Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <div className="relative">
                    <img
                      src={settings.logoUrl}
                      alt="Site logo"
                      className="h-16 w-auto max-w-[120px] object-contain rounded border border-border bg-muted/30 p-1"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max 2MB. PNG, JPG, or SVG.
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default Country</Label>
              <CountrySelector
                value={settings.defaultCountry}
                onChange={(value) => setSettings({ ...settings, defaultCountry: value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable the site
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

{/* Notification Settings */}
<Card id="settings-notifications" className="relative overflow-hidden">
          {/* Background GIF */}
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src="/assets/New Mail.gif" 
              alt="" 
              className="w-full h-full object-cover opacity-10"
            />
          </div>
          
          {/* Content with relative positioning to appear above GIF */}
          <div className="relative z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Vendor Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new applications
                  </p>
                </div>
                <Switch
                  checked={settings.newVendorAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, newVendorAlerts: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify on new orders
                  </p>
                </div>
                <Switch
                  checked={settings.orderAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, orderAlerts: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Chat Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new chat messages
                  </p>
                </div>
                <Switch
                  checked={settings.chatNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, chatNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Chat Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound for new messages
                  </p>
                </div>
                <Switch
                  checked={settings.chatNotificationSound}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, chatNotificationSound: checked })
                  }
                />
              </div>
              
              {/* New Mail GIF positioned under Chat Sound */}
              <div className="flex justify-center pt-4">
                <img 
                  src="/assets/New Mail.gif" 
                  alt="New Mail Animation" 
                  className="w-32 h-32 object-contain opacity-30"
                />
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Security Settings */}
        <Card id="settings-security">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admins
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Auto logout after inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card id="settings-appearance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark theme
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, darkMode: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing in UI
                </p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, compactMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Theme Settings */}
        <Card id="settings-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5" />
              Color Theme
            </CardTitle>
            <CardDescription>Customize your brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:bg-muted transition-colors"
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: hslToHex(preset.primary) }}
                    />
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={hslToHex(settings.primaryColor)}
                  onChange={(e) =>
                    setSettings({ ...settings, primaryColor: hexToHsl(e.target.value) })
                  }
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Primary</p>
                  <p className="text-xs text-muted-foreground">
                    Main brand color for buttons and links
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="accentColor"
                  value={hslToHex(settings.accentColor)}
                  onChange={(e) =>
                    setSettings({ ...settings, accentColor: hexToHsl(e.target.value) })
                  }
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Accent</p>
                  <p className="text-xs text-muted-foreground">
                    Secondary color for highlights
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Preview</p>
              <div className="flex gap-2">
                <Button size="sm">Primary Button</Button>
                <Button size="sm" variant="outline">Outline</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Settings */}
        <Card id="settings-typography">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </CardTitle>
            <CardDescription>Choose your preferred fonts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Font</Label>
              <Select
                value={settings.primaryFont}
                onValueChange={(value) => setSettings({ ...settings, primaryFont: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.preview}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for body text and UI elements
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Display Font</Label>
              <Select
                value={settings.displayFont}
                onValueChange={(value) => setSettings({ ...settings, displayFont: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {displayFontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.preview}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for headings and titles
              </p>
            </div>
            <Separator />
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground mb-2">Preview</p>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Temple Connect
              </h3>
              <p className="text-sm text-muted-foreground">
                This is how your text will appear with the selected fonts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section Settings */}
        <Card id="settings-hero" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Hero Section
            </CardTitle>
            <CardDescription>Customize your home page hero content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    placeholder="Discover Sacred Temples"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Input
                    id="heroSubtitle"
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    placeholder="Connect with Hindu temples..."
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="heroCtaText">CTA Button Text</Label>
                  <Input
                    id="heroCtaText"
                    value={settings.heroCtaText}
                    onChange={(e) => setSettings({ ...settings, heroCtaText: e.target.value })}
                    placeholder="Become a Temple Vendor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroCtaLink">CTA Button Link</Label>
                  <Input
                    id="heroCtaLink"
                    value={settings.heroCtaLink}
                    onChange={(e) => setSettings({ ...settings, heroCtaLink: e.target.value })}
                    placeholder="/become-vendor"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label>Hero Background Image</Label>
                <div className="flex flex-col gap-4">
                  {settings.heroImageUrl ? (
                    <div className="relative">
                      <img
                        src={settings.heroImageUrl}
                        alt="Hero background"
                        className="h-40 w-full object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveHeroImage}
                        className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <div className="text-center">
                        <Image className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No image set</p>
                        <p className="text-xs text-muted-foreground">Default image will be used</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                    id="hero-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHero}
                  >
                    {uploadingHero ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploadingHero ? 'Uploading...' : 'Upload Hero Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1920x1080px. Max 5MB. PNG or JPG.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Settings */}
        <Card id="settings-footer" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Footer Settings
            </CardTitle>
            <CardDescription>Customize your footer content and social links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="footerTagline">Footer Tagline</Label>
              <Input
                id="footerTagline"
                value={settings.footerTagline}
                onChange={(e) => setSettings({ ...settings, footerTagline: e.target.value })}
                placeholder="Your site tagline..."
              />
              <p className="text-xs text-muted-foreground">
                Displayed below the logo in the footer
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <Label>Social Media Links</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty to hide a social link
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="socialFacebook" className="text-xs">Facebook URL</Label>
                  <Input
                    id="socialFacebook"
                    value={settings.socialFacebook}
                    onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialInstagram" className="text-xs">Instagram URL</Label>
                  <Input
                    id="socialInstagram"
                    value={settings.socialInstagram}
                    onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialTwitter" className="text-xs">Twitter/X URL</Label>
                  <Input
                    id="socialTwitter"
                    value={settings.socialTwitter}
                    onChange={(e) => setSettings({ ...settings, socialTwitter: e.target.value })}
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialLinkedin" className="text-xs">LinkedIn URL</Label>
                  <Input
                    id="socialLinkedin"
                    value={settings.socialLinkedin}
                    onChange={(e) => setSettings({ ...settings, socialLinkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialYoutube" className="text-xs">YouTube URL</Label>
                  <Input
                    id="socialYoutube"
                    value={settings.socialYoutube}
                    onChange={(e) => setSettings({ ...settings, socialYoutube: e.target.value })}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Templates Settings */}
        <Card id="settings-email-templates" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>Customize email notifications sent to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Sender Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Sender Settings</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailFromName">From Name</Label>
                  <Input
                    id="emailFromName"
                    value={settings.emailFromName}
                    onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                    placeholder="Temple Connect"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFromAddress">From Email Address</Label>
                  <Input
                    id="emailFromAddress"
                    value={settings.emailFromAddress}
                    onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                    placeholder="noreply@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a verified domain in Resend
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Booking Confirmation Email */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Booking Confirmation Email</h4>
              <p className="text-xs text-muted-foreground">
                Variables: {'{{customer_name}}'}, {'{{temple_name}}'}, {'{{visit_date}}'}, {'{{booking_code}}'}
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="bookingEmailSubject">Subject Line</Label>
                  <Input
                    id="bookingEmailSubject"
                    value={settings.bookingEmailSubject}
                    onChange={(e) => setSettings({ ...settings, bookingEmailSubject: e.target.value })}
                    placeholder="Booking Confirmation - {{temple_name}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingEmailGreeting">Greeting</Label>
                  <Input
                    id="bookingEmailGreeting"
                    value={settings.bookingEmailGreeting}
                    onChange={(e) => setSettings({ ...settings, bookingEmailGreeting: e.target.value })}
                    placeholder="Namaste, {{customer_name}}!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingEmailMessage">Main Message</Label>
                  <Input
                    id="bookingEmailMessage"
                    value={settings.bookingEmailMessage}
                    onChange={(e) => setSettings({ ...settings, bookingEmailMessage: e.target.value })}
                    placeholder="Your temple visit has been confirmed..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingEmailInstructions">Instructions (separate with |)</Label>
                  <Input
                    id="bookingEmailInstructions"
                    value={settings.bookingEmailInstructions}
                    onChange={(e) => setSettings({ ...settings, bookingEmailInstructions: e.target.value })}
                    placeholder="Instruction 1|Instruction 2|Instruction 3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Each instruction separated by | will appear as a bullet point
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vendor Notification Emails */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Vendor Approval Email</h4>
              <p className="text-xs text-muted-foreground">
                Variables: {'{{vendor_name}}'}, {'{{business_name}}'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendorApprovalEmailSubject">Subject Line</Label>
                  <Input
                    id="vendorApprovalEmailSubject"
                    value={settings.vendorApprovalEmailSubject}
                    onChange={(e) => setSettings({ ...settings, vendorApprovalEmailSubject: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vendorApprovalEmailMessage">Message</Label>
                  <Input
                    id="vendorApprovalEmailMessage"
                    value={settings.vendorApprovalEmailMessage}
                    onChange={(e) => setSettings({ ...settings, vendorApprovalEmailMessage: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Vendor Rejection Email</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendorRejectionEmailSubject">Subject Line</Label>
                  <Input
                    id="vendorRejectionEmailSubject"
                    value={settings.vendorRejectionEmailSubject}
                    onChange={(e) => setSettings({ ...settings, vendorRejectionEmailSubject: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vendorRejectionEmailMessage">Message</Label>
                  <Input
                    id="vendorRejectionEmailMessage"
                    value={settings.vendorRejectionEmailMessage}
                    onChange={(e) => setSettings({ ...settings, vendorRejectionEmailMessage: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* New Order Email */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">New Order Notification (to Vendor)</h4>
              <p className="text-xs text-muted-foreground">
                Variables: {'{{order_id}}'}, {'{{customer_name}}'}, {'{{total_amount}}'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newOrderEmailSubject">Subject Line</Label>
                  <Input
                    id="newOrderEmailSubject"
                    value={settings.newOrderEmailSubject}
                    onChange={(e) => setSettings({ ...settings, newOrderEmailSubject: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="newOrderEmailMessage">Message</Label>
                  <Input
                    id="newOrderEmailMessage"
                    value={settings.newOrderEmailMessage}
                    onChange={(e) => setSettings({ ...settings, newOrderEmailMessage: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
