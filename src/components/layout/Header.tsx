import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Bell, Menu, X, ShoppingCart, User, Sun, Moon, LogOut, LayoutDashboard,
  CheckCircle2, Info, AlertCircle, Shield, Store, UserCircle, ChevronDown, Languages, Globe, Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

// --- Interface Definitions from your code ---
interface SearchResult { id: string; name: string; type: 'temple' | 'product'; description?: string; image_url?: string; }
interface Notification { id: string; type: string; title: string; message: string; read: boolean; link?: string; created_at: string; }

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', countries: ['GB', 'US', 'CA', 'AU', 'NZ', 'SG'] },
  { code: 'si', name: 'සිංහල', flag: '🇱🇰', countries: ['LK'] },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', countries: ['LK', 'IN', 'MY', 'SG'] },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', countries: ['IN', 'NP'] },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'en');
  
  const { data: siteSettings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isVendor, activeViewRole, userRoles, switchRole, hasMultipleRoles } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/temples', label: t('nav.temples') },
    { href: '/products', label: t('nav.products') },
    ...(user ? [{ href: '/booking', label: t('nav.myBooking') }] : []),
  ];

  const currentLanguage = languages.find(l => l.code === selectedLanguage) || languages[0];

  // --- DATABASE LOGIC: Notifications & Search (Taken from your original code) ---
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      if (data) { setNotifications(data); setUnreadCount(data.filter(n => !n.read).length); }
    };
    fetchNotifications();

    const channel = supabase.channel('notif-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
      const newNotif = payload.new as Notification;
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast({ title: newNotif.title, description: newNotif.message });
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length < 2) return setSearchResults([]);
      const { data: temples } = await supabase.from('temples').select('id, name, description, image_url').ilike('name', `%${searchQuery}%`).eq('is_active', true).limit(3);
      const { data: products } = await supabase.from('products').select('id, name, description, image_url').ilike('name', `%${searchQuery}%`).eq('status', 'approved').limit(3);
      setSearchResults([...(temples || []).map(t => ({...t, type: 'temple' as const})), ...(products || []).map(p => ({...p, type: 'product' as const}))]);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    i18n.changeLanguage(langCode);
    if (user) await supabase.from('profiles').update({ preferred_language: langCode }).eq('user_id', user.id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    if (!error) { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0); }
  };

  const getDashboardLink = () => isAdmin ? '/admin' : isVendor ? '/vendor' : '/dashboard';
  const getRoleBadge = () => activeViewRole === 'admin' ? 'Admin' : activeViewRole === 'vendor' ? 'Vendor' : 'Customer';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{siteSettings?.siteName || 'Temple Connect'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} className={cn('text-sm font-medium transition-colors hover:text-primary', location.pathname === link.href ? 'text-primary' : 'text-muted-foreground')}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* --- DESKTOP ACTIONS --- */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}><Search className="h-5 w-5" /></Button>
            
            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && <span className="absolute -right-1 -top-1 bg-primary text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">{totalItems}</span>}
            </Button>

            {/* Desktop Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 bg-destructive text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">{unreadCount}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>Mark all read</Button>
                </div>
                <ScrollArea className="h-72">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} onClick={() => n.link && navigate(n.link)} className={cn("p-3 border-b hover:bg-muted/50 cursor-pointer", !n.read && "bg-muted/20")}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                    </div>
                  )) : <div className="p-8 text-center text-sm text-muted-foreground">No new notifications</div>}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => {setIsDark(!isDark); document.documentElement.classList.toggle('dark');}}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs">{user.email?.[0].toUpperCase()}</div>
                    <span>{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b">
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {/* Role Badge - desktop dashboard kku kela added here */}
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide uppercase">
                      {getRoleBadge()}
                    </span>
                  </div>
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>Profile Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/auth')}>Sign Up</Button>
              </div>
            )}
          </div>

          {/* --- MOBILE ACTIONS (Search & Notification added to Header) --- */}
          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}><Search className="h-5 w-5" /></Button>
            
            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && <span className="absolute -right-1 -top-1 bg-primary text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center">{totalItems}</span>}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 bg-destructive text-[10px] text-white rounded-full h-3.5 w-3.5 flex items-center justify-center">{unreadCount}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px]">
                <div className="p-3 text-sm font-semibold border-b">Notifications</div>
                <ScrollArea className="h-64">
                   {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="p-3 border-b"><p className="text-xs font-medium">{n.title}</p></div>
                  )) : <div className="p-4 text-center text-xs text-muted-foreground">No new notifications</div>}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* --- MOBILE TOGGLE MENU (Role & Language within settings) --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t bg-card overflow-hidden">
              <div className="container py-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("px-4 py-3 rounded-lg text-sm font-medium", location.pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-border mx-2" />

                <div className="px-4 space-y-4">
                  {user ? (
                    <>
                      <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => { navigate(getDashboardLink()); setIsMobileMenuOpen(false); }}>
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}>
                        <SettingsIcon className="h-4 w-4" /> Profile Settings
                      </Button>

                      {/* Language Selector inside Mobile Menu */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-primary" /> Language</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              {currentLanguage.flag} {currentLanguage.name} <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {languages.map(l => (
                              <DropdownMenuItem key={l.code} onClick={() => handleLanguageChange(l.code)}>{l.flag} {l.name}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Button variant="destructive" className="w-full justify-start gap-3 h-11" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <Button variant="outline" onClick={() => {navigate('/auth'); setIsMobileMenuOpen(false);}}>Login</Button>
                      <Button onClick={() => {navigate('/auth'); setIsMobileMenuOpen(false);}}>Sign Up</Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- Search Dialog (Logic from your code) --- */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="p-0 sm:max-w-[550px] overflow-hidden">
          <div className="flex items-center p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <Input placeholder="Search temples or products..." className="border-none focus-visible:ring-0 shadow-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
          </div>
          <ScrollArea className="max-h-[350px] p-2">
            {searchResults.length > 0 ? searchResults.map(r => (
              <div key={r.id} onClick={() => { navigate(`/${r.type}s/${r.id}`); setIsSearchOpen(false); }} className="p-3 hover:bg-muted rounded-md cursor-pointer flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                </div>
                <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-1 rounded">{r.type}</span>
              </div>
            )) : searchQuery.length > 1 && <div className="p-8 text-center text-sm text-muted-foreground">No results found for "{searchQuery}"</div>}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;