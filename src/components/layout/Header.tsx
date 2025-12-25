import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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
  MapPin,
  Package,
  CheckCircle2,
  Info,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  name: string;
  type: 'temple' | 'product';
  description?: string;
  image_url?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

const countryFlags: Record<string, string> = {
  'LK': '🇱🇰', 'MY': '🇲🇾', 'IN': '🇮🇳', 'TH': '🇹🇭', 'SG': '🇸🇬',
  'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳', 'MM': '🇲🇲', 'NP': '🇳🇵',
  'BD': '🇧🇩', 'PK': '🇵🇰', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦',
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  
  const { data: siteSettings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isAdmin, isVendor } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/temples', label: 'Temples' },
    { href: '/products', label: 'Products' },
    { href: '/booking', label: 'My Booking' },
    { href: '/become-vendor', label: 'Become a Vendor' },
  ];

  // Fetch user's country from profile
  useEffect(() => {
    if (!user) {
      setUserCountry(null);
      return;
    }

    const fetchUserCountry = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('country')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.country) {
        setUserCountry(data.country);
      }
    };

    fetchUserCountry();
  }, [user]);

  // Fetch notifications from database
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Search functionality
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search temples
        const { data: temples } = await supabase
          .from('temples')
          .select('id, name, description, image_url')
          .ilike('name', `%${searchQuery}%`)
          .eq('is_active', true)
          .limit(5);

        // Search products
        const { data: products } = await supabase
          .from('products')
          .select('id, name, description, image_url')
          .ilike('name', `%${searchQuery}%`)
          .eq('status', 'approved')
          .limit(5);

        const results: SearchResult[] = [
          ...(temples || []).map(t => ({ ...t, type: 'temple' as const })),
          ...(products || []).map(p => ({ ...p, type: 'product' as const })),
        ];

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery]);

  const isActive = (href: string) => location.pathname === href;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been signed out successfully.',
    });
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isVendor) return '/vendor';
    return '/dashboard';
  };

  const getRoleBadge = () => {
    if (isAdmin) return 'Admin';
    if (isVendor) return 'Vendor';
    return 'Customer';
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'temple') {
      navigate(`/temples/${result.id}`);
    } else {
      navigate(`/products/${result.id}`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {siteSettings?.logoUrl ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={siteSettings.logoUrl}
                alt={siteSettings.siteName}
                className="h-9 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <motion.div
                whileHover={{ rotate: 10 }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"
              >
                <span className="text-lg font-bold text-primary-foreground">◇</span>
              </motion.div>
            )}
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
                  isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {user ? (
                  notifications.length > 0 ? (
                    <ScrollArea className="h-64">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex gap-3 px-3 py-3 hover:bg-muted/50 cursor-pointer',
                            !notification.read && 'bg-muted/30'
                          )}
                        >
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign in to see your notifications
                    </p>
                    <Link to="/auth">
                      <Button size="sm" variant="outline">Sign In</Button>
                    </Link>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {userCountry && countryFlags[userCountry] && (
                      <span className="text-base" title={userCountry}>{countryFlags[userCountry]}</span>
                    )}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {getRoleBadge()}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex cursor-pointer items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-card md:hidden"
            >
              <nav className="container flex flex-col gap-2 py-4">
                {/* Mobile Search */}
                <div className="px-3 pb-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                  >
                    <Search className="h-4 w-4" />
                    Search temples & products...
                  </Button>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {user && (
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                )}

                <div className="my-2 border-t border-border" />

                {user ? (
                  <div className="px-3">
                    <p className="mb-2 text-sm text-muted-foreground">
                      Signed in as <span className="font-medium text-foreground">{user.email}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3">
                    <Link to="/auth" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search temples and products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            {isSearching && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}

            {searchResults.length > 0 && (
              <ScrollArea className="max-h-80">
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSearchResultClick(result)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted transition-colors"
                    >
                      {result.image_url ? (
                        <img
                          src={result.image_url}
                          alt={result.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          {result.type === 'temple' ? (
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {result.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {searchQuery.length < 2 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
