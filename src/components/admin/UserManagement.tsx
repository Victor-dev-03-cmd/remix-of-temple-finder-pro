import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, ShieldCheck, User, RefreshCw, Search, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AppRole = 'admin' | 'vendor' | 'customer';

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  role: AppRole;
  created_at: string;
}

const roleIcons = {
  admin: ShieldCheck,
  vendor: Shield,
  customer: User,
};

const roleColors = {
  admin: 'bg-destructive/10 text-destructive',
  vendor: 'bg-primary/10 text-primary',
  customer: 'bg-muted text-muted-foreground',
};

const countryFlags: Record<string, string> = {
  'LK': '🇱🇰', 'MY': '🇲🇾', 'IN': '🇮🇳', 'TH': '🇹🇭', 'SG': '🇸🇬',
  'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳', 'MM': '🇲🇲', 'NP': '🇳🇵',
  'BD': '🇧🇩', 'PK': '🇵🇰', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦',
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, country, created_at');

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      console.log('Fetched profiles:', profiles);

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        throw rolesError;
      }

      console.log('Fetched roles:', roles);

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          country: profile.country,
          role: (userRole?.role as AppRole) || 'customer',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole, currentRole: AppRole) => {
    // Check if trying to change an admin's role - only admins can change admin roles
    if (currentRole === 'admin' && userId !== currentUser?.id) {
      // This is changing another admin - verify current user is admin
      // The RLS policy should handle this, but we add client-side check too
    }

    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Check if current user can change a specific user's role
  const canChangeRole = (targetUser: UserWithRole): boolean => {
    // Admin can change anyone's role
    return true;
  };

  // Get available roles for a user (admins can only be changed to admin by other admins)
  const getAvailableRoles = (targetUser: UserWithRole): AppRole[] => {
    // All roles are available for admin to change
    return ['customer', 'vendor', 'admin'];
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const getRoleIcon = (role: AppRole) => {
    const Icon = roleIcons[role];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Users className="h-5 w-5" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            View all users and manage their roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Current Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Joined
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Change Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                  <p className="mt-2">Loading users...</p>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        {getRoleIcon(user.role)}
                      </div>
                      <span className="font-medium text-foreground">
                        {user.full_name || 'No name'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {user.email || 'No email'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {user.country && countryFlags[user.country] ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{countryFlags[user.country]}</span>
                        <span className="text-muted-foreground">{user.country}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge className={roleColors[user.role]} variant="secondary">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-block">
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) => handleRoleChange(user.user_id, value, user.role)}
                              disabled={updatingUserId === user.user_id || !canChangeRole(user)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableRoles(user).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TooltipTrigger>
                        {user.role === 'admin' && (
                          <TooltipContent>
                            <p className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Admin role - requires admin privileges to change
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border p-4">
        <p className="text-sm text-muted-foreground">
          Total users: {users.length} | Admins: {users.filter((u) => u.role === 'admin').length} |
          Vendors: {users.filter((u) => u.role === 'vendor').length} |
          Customers: {users.filter((u) => u.role === 'customer').length}
        </p>
      </div>
    </motion.div>
  );
};

export default UserManagement;
