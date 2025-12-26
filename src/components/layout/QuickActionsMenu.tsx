import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Package,
  ShoppingBag,
  Settings,
  FileText,
  Calendar,
  BarChart3,
  Heart,
  MapPin,
  Ticket,
  Store,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  description?: string;
}

const adminActions: QuickAction[] = [
  { label: 'Manage Users', icon: Users, href: '/admin/users', description: 'View and manage user roles' },
  { label: 'Manage Temples', icon: MapPin, href: '/admin/temples', description: 'Add or edit temples' },
  { label: 'Vendor Applications', icon: FileText, href: '/admin/vendor-applications', description: 'Review applications' },
  { label: 'Site Settings', icon: Settings, href: '/admin/settings', description: 'Configure site options' },
  { label: 'Booking Management', icon: Calendar, href: '/admin/bookings', description: 'View all bookings' },
];

const vendorActions: QuickAction[] = [
  { label: 'Add Product', icon: Plus, href: '/vendor/products', description: 'Create a new product' },
  { label: 'View Orders', icon: ShoppingBag, href: '/vendor/orders', description: 'Manage customer orders' },
  { label: 'Manage Bookings', icon: Ticket, href: '/vendor/bookings', description: 'Temple visit bookings' },
  { label: 'Analytics', icon: BarChart3, href: '/vendor/analytics', description: 'View sales insights' },
  { label: 'My Temple', icon: Store, href: '/vendor/temple', description: 'Manage temple details' },
];

const customerActions: QuickAction[] = [
  { label: 'Browse Temples', icon: MapPin, href: '/temples', description: 'Explore sacred places' },
  { label: 'Shop Products', icon: Package, href: '/products', description: 'Temple merchandise' },
  { label: 'My Orders', icon: ShoppingBag, href: '/dashboard/orders', description: 'Track your orders' },
  { label: 'Favorites', icon: Heart, href: '/dashboard/favorites', description: 'Saved items' },
  { label: 'My Booking', icon: Ticket, href: '/booking', description: 'Check booking status' },
];

const QuickActionsMenu = () => {
  const navigate = useNavigate();
  const { activeViewRole, user } = useAuth();

  if (!user) return null;

  const getActions = (): QuickAction[] => {
    switch (activeViewRole) {
      case 'admin':
        return adminActions;
      case 'vendor':
        return vendorActions;
      default:
        return customerActions;
    }
  };

  const getRoleLabel = () => {
    switch (activeViewRole) {
      case 'admin':
        return 'Admin Actions';
      case 'vendor':
        return 'Vendor Actions';
      default:
        return 'Quick Actions';
    }
  };

  const actions = getActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          <span className="hidden lg:inline">Quick Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{getRoleLabel()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.href}
            onClick={() => navigate(action.href)}
            className="flex cursor-pointer items-start gap-3 py-2"
          >
            <action.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{action.label}</span>
              {action.description && (
                <span className="text-xs text-muted-foreground">{action.description}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickActionsMenu;
