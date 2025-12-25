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
}

const defaultSettings: SiteSettings = {
  siteName: 'Temple Connect',
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
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('site_name, logo_url, primary_color, accent_color, primary_font, display_font, footer_tagline, social_facebook, social_instagram, social_twitter, social_linkedin, social_youtube, hero_title, hero_subtitle, hero_image_url, hero_cta_text, hero_cta_link, commission_rate')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    siteName: data.site_name,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color || defaultSettings.primaryColor,
    accentColor: data.accent_color || defaultSettings.accentColor,
    primaryFont: data.primary_font,
    displayFont: data.display_font,
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
