import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Heart,
  User,
  Users,
  FileCheck,
  Store,
  TrendingUp,
  Shield,
  LogOut,
  Settings,
  MapPin,
  Ticket,
  Building,
  ClipboardList, 
  FilePlus,
  Globe,
  GalleryHorizontal,
  Layers,
  Bell,
  Palette,
  Paintbrush,
  Type,
  Layout,
  Mail,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorTemple } from '@/hooks/useVendorTemple';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

const adminMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Temples', url: '/admin/temples', icon: MapPin },
  { title: 'Bookings', url: '/admin/bookings', icon: Ticket },
  { title: 'Countries', url: '/admin/countries', icon: Globe },
  { title: 'Vendor Management', url: '/admin/vendors', icon: Store },
  { title: 'Vendor Applications', url: '/admin/vendor-applications', icon: FileCheck },
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'Vendor Balances', url: '/admin/vendor-balances', icon: CreditCard },
  { title: 'Support Chat', url: '/admin/chat', icon: MessageSquare },
];

const adminSettingsMenuItems = [
    { title: 'General', url: '/admin/settings/general', icon: Settings },
    { title: 'Layout', url: '/admin/settings/layout', icon: Layout },
    { title: 'Security', url: '/admin/settings/security', icon: Shield },
    { title: 'Notifications', url: '/admin/settings/notifications', icon: Bell },
    { title: 'Appearance', url: '/admin/settings/appearance', icon: Palette },
    { title: 'Colors', url: '/admin/settings/colors', icon: Paintbrush },
    { title: 'Typography', url: '/admin/settings/typography', icon: Type },
    { title: 'Hero Section', url: '/admin/settings/hero', icon: Layout },
    { title: 'Footer', url: '/admin/settings/footer', icon: Globe },
    { title: 'Email Templates', url: '/admin/settings/email-templates', icon: Mail },
    { title: 'Home Gallery', url: '/admin/settings/home-gallery', icon: GalleryHorizontal },
    { title: 'Services', url: '/admin/settings/services', icon: Layers }
]

const vendorMenuItems = [
  { title: 'Dashboard', url: '/vendor', icon: LayoutDashboard },
  { title: 'My Temple', url: '/vendor/temple', icon: Building },
  { title: 'My Earnings', url: '/vendor/earnings', icon: CreditCard },
  { title: 'Bookings', url: '/vendor/bookings', icon: Ticket },
  { title: 'Products', url: '/vendor/products', icon: Package },
  { title: 'Orders', url: '/vendor/orders', icon: ShoppingCart },
  { title: 'Analytics', url: '/vendor/analytics', icon: TrendingUp },
  { title: 'Inventory', url: '/vendor/inventory', icon: ClipboardList },
  { title: 'Invoices', url: '/vendor/invoices', icon: FilePlus },
  { title: 'Post Upload', url: '/vendor/postupload', icon: FileCheck },
];

const customerMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Orders', url: '/dashboard/orders', icon: ShoppingCart },
  { title: 'Favorites', url: '/dashboard/favorites', icon: Heart },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const DashboardSidebar = () => {
  const { isAdmin, isVendor, user, signOut } = useAuth();
  const { temple } = useVendorTemple(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getMenuItems = () => {
    if (isAdmin) return { items: adminMenuItems, label: 'Admin Panel', icon: Shield };
    if (isVendor) return { items: vendorMenuItems, label: 'Vendor Portal', icon: Store };
    return { items: customerMenuItems, label: 'My Account', icon: User };
  };

  const { items, label, icon: RoleIcon } = getMenuItems();

  const isActive = (url: string) => location.pathname === url;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  /**
   * லிங்க் கிளிக் செய்யும் போது மொபைல் வியூவில் மட்டும் சைட்பாரை மூட வேண்டும்.
   * டெஸ்க்டாப் வியூவில் 'state' மாறாது, எனவே collapsed நிலையில் இருந்தால் அப்படியே இருக்கும்.
   */
  const handleItemClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <RoleIcon className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
              <span className="font-semibold text-foreground truncate">{label}</span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          )}
        </div>
        
        {isVendor && temple && !isCollapsed && (
          <div className="mt-3 rounded-lg bg-primary/5 p-2.5 border border-primary/10 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{temple.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {temple.district}, {temple.province}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} onClick={handleItemClick}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {!isCollapsed && <span>Settings</span>}
                  </div>
                  {!isCollapsed && (
                    settingsOpen ? (
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform" />
                    )
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminSettingsMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                        >
                          <Link to={item.url} onClick={handleItemClick}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-8 w-8 shrink-0" />
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive overflow-hidden"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">Sign Out</span>
              </Button>
            )}
          </div>
          {/* Collapse ஆக இருக்கும் போது Sign Out ஐகான் மட்டும் தெரிய */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
