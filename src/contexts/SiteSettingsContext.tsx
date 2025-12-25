import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSiteSettings, SiteSettings } from '@/hooks/useSiteSettings';

interface SiteSettingsContextType {
  settings: SiteSettings | undefined;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useSiteSettings();

  // Apply CSS variables for fonts and colors globally
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply fonts
      root.style.setProperty('--font-sans', settings.primaryFont);
      root.style.setProperty('--font-display', settings.displayFont);
      
      // Apply colors
      root.style.setProperty('--primary', settings.primaryColor);
      root.style.setProperty('--accent', settings.accentColor);
      
      // Update document title with site name
      if (settings.siteName) {
        document.title = settings.siteName;
      }
    }
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettingsContext() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettingsContext must be used within a SiteSettingsProvider');
  }
  return context;
}
