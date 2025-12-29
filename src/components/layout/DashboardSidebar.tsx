import { Link, useLocation } from 'react-router-dom';
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
  Home,
  Shield,
  LogOut,
  Settings,
  MapPin,
  Ticket,
  Building,
  ClipboardList, 
  FilePlus
} from 'lucide-react';
import CountrySelector from '@/components/admin/CountrySelector';
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
import { Button } from '@/components/ui/button';

const adminMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Temples', url: '/admin/temples', icon: MapPin },
  { title: 'Bookings', url: '/admin/bookings', icon: Ticket },
  { title: 'Vendor Applications', url: '/admin/vendor-applications', icon: FileCheck },
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'Site Settings', url: '/admin/settings', icon: Settings },
];

const vendorMenuItems = [
  { title: 'Dashboard', url: '/vendor', icon: LayoutDashboard },
  { title: 'My Temple', url: '/vendor/temple', icon: Building },
  { title: 'Bookings', url: '/vendor/bookings', icon: Ticket },
  { title: 'Products', url: '/vendor/products', icon: Package },
  { title: 'Orders', url: '/vendor/orders', icon: ShoppingCart },
  { title: 'Analytics', url: '/vendor/analytics', icon: TrendingUp },
  { title: 'Inventory', url: '/vendor/inventory', icon: ClipboardList },
  { title: 'Invoices', url: '/vendor/invoices', icon: FilePlus },
];

const customerMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Orders', url: '/dashboard/orders', icon: ShoppingCart },
  { title: 'Favorites', url: '/dashboard/favorites', icon: Heart },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const commonLinks = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Become a Vendor', url: '/become-vendor', icon: Store },
];

const DashboardSidebar = () => {
  const { isAdmin, isVendor, user, signOut } = useAuth();
  const { temple, application } = useVendorTemple(user?.id);
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const getMenuItems = () => {
    if (isAdmin) return { items: adminMenuItems, label: 'Admin Panel', icon: Shield };
    if (isVendor) return { items: vendorMenuItems, label: 'Vendor Portal', icon: Store };
    return { items: customerMenuItems, label: 'My Account', icon: User };
  };

  const { items, label, icon: RoleIcon } = getMenuItems();

  const isActive = (url: string) => location.pathname === url;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <RoleIcon className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          )}
        </div>
        
        {/* Vendor Temple Info */}
        {isVendor && temple && !isCollapsed && (
          <div className="mt-3 rounded-lg bg-primary/5 p-2.5 border border-primary/10">
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
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
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
            <SidebarGroupLabel>Region</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">
                <CountrySelector />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8" />
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
