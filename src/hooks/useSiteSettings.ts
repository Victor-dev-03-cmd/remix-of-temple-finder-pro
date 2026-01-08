import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  siteName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  primaryFont: string;
  displayFont: string;
  footerTagline: string;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  heroCtaText: string;
  heroCtaLink: string;
  commissionRate: number;
  defaultCountry: string;
  maintenanceMode: boolean;
  // Services
  service1Title: string | null;
  service1Description: string | null;
  service2Title: string | null;
  service2Description: string | null;
  service3Title: string | null;
  service3Description: string | null;
  service4Title: string | null;
  service4Description: string | null;
  service5Title: string | null;
  service5Description: string | null;
  service6Title: string | null;
  service6Description: string | null;
}

const defaultSettings: SiteSettings = {
  siteName: 'Asroz Info',
  logoUrl: null,
  primaryColor: '217 91% 60%',
  accentColor: '43 96% 56%',
  primaryFont: 'Outfit',
  displayFont: 'Playfair Display',
  footerTagline: 'Connecting devotees with Hindu temples across Sri Lanka.',
  socialFacebook: null,
  socialInstagram: null,
  socialTwitter: null,
  socialLinkedin: null,
  socialYoutube: null,
  heroTitle: 'Discover Sacred Temples',
  heroSubtitle: 'Connect with Hindu temples across Sri Lanka and explore sacred traditions',
  heroImageUrl: null,
  heroCtaText: 'Become a Temple Vendor',
  heroCtaLink: '/become-vendor',
  commissionRate: 10,
  defaultCountry: 'LK',
  maintenanceMode: false,
  service1Title: null,
  service1Description: null,
  service2Title: null,
  service2Description: null,
  service3Title: null,
  service3Description: null,
  service4Title: null,
  service4Description: null,
  service5Title: null,
  service5Description: null,
  service6Title: null,
  service6Description: null,
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error }: any = await supabase
    .from('site_settings')
    .select('site_name, logo_url, primary_color, accent_color, primary_font, display_font, footer_tagline, social_facebook, social_instagram, social_twitter, social_linkedin, social_youtube, hero_title, hero_subtitle, hero_image_url, hero_cta_text, hero_cta_link, commission_rate, default_country, maintenance_mode, service_1_title, service_1_description, service_2_title, service_2_description, service_3_title, service_3_description, service_4_title, service_4_description, service_5_title, service_5_description, service_6_title, service_6_description')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    siteName: data.site_name || defaultSettings.siteName,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color || defaultSettings.primaryColor,
    accentColor: data.accent_color || defaultSettings.accentColor,
    primaryFont: data.primary_font || defaultSettings.primaryFont,
    displayFont: data.display_font || defaultSettings.displayFont,
    footerTagline: data.footer_tagline || defaultSettings.footerTagline,
    socialFacebook: data.social_facebook,
    socialInstagram: data.social_instagram,
    socialTwitter: data.social_twitter,
    socialLinkedin: data.social_linkedin,
    socialYoutube: data.social_youtube,
    heroTitle: data.hero_title || defaultSettings.heroTitle,
    heroSubtitle: data.hero_subtitle || defaultSettings.heroSubtitle,
    heroImageUrl: data.hero_image_url,
    heroCtaText: data.hero_cta_text || defaultSettings.heroCtaText,
    heroCtaLink: data.hero_cta_link || defaultSettings.heroCtaLink,
    commissionRate: data.commission_rate || defaultSettings.commissionRate,
    defaultCountry: data.default_country || defaultSettings.defaultCountry,
    maintenanceMode: data.maintenance_mode ?? defaultSettings.maintenanceMode,
    service1Title: data.service_1_title,
    service1Description: data.service_1_description,
    service2Title: data.service_2_title,
    service2Description: data.service_2_description,
    service3Title: data.service_3_title,
    service3Description: data.service_3_description,
    service4Title: data.service_4_title,
    service4Description: data.service_4_description,
    service5Title: data.service_5_title,
    service5Description: data.service_5_description,
    service6Title: data.service_6_title,
    service6Description: data.service_6_description,
  };
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}