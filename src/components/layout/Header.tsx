import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  LayoutDashboard,
  CheckCircle2,
  Info,
  AlertCircle,
  Shield,
  Store,
  UserCircle,
  ChevronDown,
  Languages,
  CalendarDays // My Booking-க்கு பொருத்தமான ஐகான்
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

// ... (languages மற்றும் flags மாறிலிகள் அப்படியே இருக்கட்டும்)
const countryFlags: Record<string, string> = {
  'LK': '🇱🇰', 'MY': '🇲🇾', 'IN': '🇮🇳', 'TH': '🇹🇭', 'SG': '姍🇸🇬',
  'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳', 'MM': '🇲🇲', 'NP': '🇳🇵',
  'BD': '🇧🇩', 'PK': '🇵🇰', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦',
};

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', countries: ['GB', 'US', 'CA', 'AU', 'NZ', 'SG'] },
  { code: 'si', name: 'සිංහල', flag: '🇱🇰', countries: ['LK'] },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', countries: ['LK', 'IN', 'MY', 'SG'] },
  // ... மற்ற மொழிகள்
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'en');
  
  const { data: siteSettings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isVendor, activeViewRole, userRoles, switchRole, hasMultipleRoles } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const isAdminView = activeViewRole === 'admin';

  // --- இங்கதான் மாற்றம் செய்யப்பட்டுள்ளது ---
  // "My Booking" இப்போது அனைத்து Authenticated பயனர்களுக்கும் (Admin, Vendor, Customer) காட்டும்.
  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/temples', label: t('nav.temples') },
    { href: '/products', label: t('nav.products') },
    // பயனர் லாக்-இன் செய்திருந்தால் மட்டும் "My Booking" காட்டும்
    ...(user ? [{ href: '/booking', label: t('nav.myBooking') }] : []),
    // Admin மற்றும் Vendor அல்லாதவர்களுக்கு மட்டும் "Become a Vendor" காட்டும்
    ...(!isAdmin && !isVendor ? [{ href: '/become-vendor', label: t('nav.becomeVendor') }] : []),
  ];

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    i18n.changeLanguage(langCode);
    if (user) await supabase.from('profiles').update({ preferred_language: langCode }).eq('user_id', user.id);
  };

  const currentLanguage = languages.find(l => l.code === selectedLanguage) || languages[0];

  useEffect(() => {
    if (!user) return;
    const fetchUserProfile = async () => {
      const { data } = await supabase.from('profiles').select('country, preferred_language').eq('user_id', user.id).maybeSingle();
      if (data?.country) setUserCountry(data.country);
      if (data?.preferred_language) {
        setSelectedLanguage(data.preferred_language);
        i18n.changeLanguage(data.preferred_language);
      }
    };
    fetchUserProfile();
  }, [user, i18n]);

  // Notifications logic அப்படியே இருக்கட்டும்...
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n:any) => !n.read).length);
      }
    };
    fetchNotifications();
  }, [user]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (activeViewRole === 'admin') return '/admin';
    if (activeViewRole === 'vendor') return '/vendor';
    return '/dashboard';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'vendor': return <Store className="h-4 w-4" />;
      default: return <UserCircle className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin View';
      case 'vendor': return 'Vendor View';
      default: return 'Customer View';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">◇</span>
            </div>
            <span className="text-xl font-semibold text-primary">{siteSettings?.siteName || 'Temple Connect'}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language - Hide for Admin view */}
            {!isAdminView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 px-2">
                    <Languages className="h-4 w-4" />
                    <span className="hidden lg:inline">{currentLanguage.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
                   {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                      {lang.flag} {lang.name}
                    </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Profile & Role Switcher */}
            {user ? (
              <div className="flex items-center gap-2">
                {hasMultipleRoles && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                        {getRoleIcon(activeViewRole || 'customer')}
                        <span>{getRoleLabel(activeViewRole || 'customer')}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userRoles.map((role:any) => (
                        <DropdownMenuItem key={role} onClick={() => switchRole(role)} className="gap-2">
                          {getRoleIcon(role)} {getRoleLabel(role)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {user.email?.[0]?.toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/booking" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t bg-card md:hidden"
            >
              <nav className="container flex flex-col gap-2 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center py-2 px-3 text-sm font-medium hover:bg-muted rounded-md"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;