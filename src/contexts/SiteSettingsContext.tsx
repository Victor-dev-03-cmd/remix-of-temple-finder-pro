import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useSiteSettings, SiteSettings } from '@/hooks/useSiteSettings';

interface SiteSettingsContextType {
  settings: SiteSettings | undefined;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// --- 1. COUNTDOWN TIMER COMPONENT ---
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center p-3 bg-primary/10 rounded-xl border border-primary/20 min-w-[70px] md:min-w-[80px]">
      <span className="text-2xl md:text-3xl font-bold text-primary">{value.toString().padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-3 md:gap-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Mins" />
      <TimeUnit value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

// --- 2. ENHANCED MAINTENANCE OVERLAY UI ---
const MaintenanceOverlay = ({ settings }: { settings: SiteSettings | undefined }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-center p-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-accent/10 rounded-full blur-[100px]" />

      <div className="relative flex flex-col items-center gap-6 md:gap-8 max-w-2xl animate-in fade-in zoom-in duration-700">
        
        {/* Logo Section */}
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt="Logo" className="h-20 md:h-28 w-auto object-contain drop-shadow-md" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <span className="text-5xl text-primary font-bold">ૐ</span>
          </div>
        )}

        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground font-display">
            Under Maintenance
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            We are currently updating {settings?.siteName || 'our sacred space'} to serve you better. 
            We'll be back online shortly.
          </p>
        </div>

        {/* Countdown Section */}
        <CountdownTimer />

        {/* Social Links Section */}
        <div className="flex items-center gap-5 mt-2">
          {settings?.socialFacebook && (
            <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          )}
          {settings?.socialInstagram && (
            <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          )}
          {settings?.socialTwitter && (
            <a href={settings.socialTwitter} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="text-sm text-primary/70 italic font-medium">Namaste!</div>
          <a href="/auth" className="text-[10px] text-muted-foreground/20 hover:text-primary transition-all underline underline-offset-2">
            Administrator Access
          </a>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN PROVIDER COMPONENT ---
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useSiteSettings();

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply Dynamic CSS Variables
      root.style.setProperty('--font-sans', settings.primaryFont);
      root.style.setProperty('--font-display', settings.displayFont);
      root.style.setProperty('--primary', settings.primaryColor);
      root.style.setProperty('--accent', settings.accentColor);
      
      // Dynamic Font Loader (Refresh Fix)
      const fontId = 'dynamic-site-fonts';
      let fontLink = document.getElementById(fontId) as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontId;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      
      const primary = settings.primaryFont.replace(/\s+/g, '+');
      const display = settings.displayFont.replace(/\s+/g, '+');
      fontLink.href = `https://fonts.googleapis.com/css2?family=${primary}:wght@400;500;600;700&family=${display}:wght@400;500;600;700&display=swap`;

      // Metadata & Favicon
      if (settings.siteName) document.title = settings.siteName;
      if (settings.logoUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) favicon.href = settings.logoUrl;
      }
    }
  }, [settings]);

  // Maintenance Logic
  const currentPath = window.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin') || 
                      currentPath.startsWith('/auth') || 
                      currentPath === '/auth';
  
  const isMaintenanceActive = settings?.maintenance_mode === true;
  const showMaintenance = isMaintenanceActive && !isAdminPath;

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading }}>
      {showMaintenance ? <MaintenanceOverlay settings={settings} /> : children}
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