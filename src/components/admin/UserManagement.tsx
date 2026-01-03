import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, User, RefreshCw, Search, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type AppRole = 'admin' | 'vendor' | 'customer';

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  role: AppRole;
  created_at: string;
}

const roleIcons: Record<AppRole, React.ElementType> = {
  admin: ShieldCheck,
  vendor: Shield,
  customer: User,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/10 text-red-500',
  vendor: 'bg-blue-500/10 text-blue-500',
  customer: 'bg-gray-500/10 text-gray-500',
};

const countryFlags: Record<string, string> = {
    'LK': '🇱🇰', 'MY': '🇲🇾', 'IN': '🇮🇳', 'TH': '🇹🇭', 'SG': '🇸🇬',
    'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳', 'MM': '🇲🇲', 'NP': '🇳🇵',
    'BD': '🇧🇩', 'PK': '🇵🇰', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
    'AU': '🇦🇺', 'NZ': '🇳🇿', 'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦',
};

const createUserSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(8, "Password must be at least 8 characters."),
    full_name: z.string().min(2, "Full name must be at least 2 characters."),
    role: z.enum(['admin', 'vendor', 'customer']),
    country: z.string().min(2, "Country is required."),
});

const editUserSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters."),
    country: z.string().min(2, "Country is required."),
});

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);
  const [isEditUserOpen, setEditUserOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const createForm = useForm<z.infer<typeof createUserSchema>>({
      resolver: zodResolver(createUserSchema),
      defaultValues: { email: '', password: '', full_name: '', role: 'customer', country: 'LK' },
  });

  const editForm = useForm<z.infer<typeof editUserSchema>>({
      resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (selectedUser && isEditUserOpen) {
      editForm.reset({
        full_name: selectedUser.full_name || '',
        country: selectedUser.country || '',
      });
    }
  }, [selectedUser, isEditUserOpen, editForm]);


  // --- FETCH LOGIC (திருத்தப்பட்ட பகுதி) ---
  const fetchUsers = async () => {
      setLoading(true);
      try {
          // 1. Profiles டேபிளில் இருந்து அனைத்து பயனர்களையும் எடுத்தல்
          // இது Auth-ல் இருந்து Trigger வழியாக டேட்டாபேஸிற்கு வரும் தகவல்களைக் காட்டும்
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, email, full_name, country, created_at')
            .order('created_at', { ascending: false });

          if (profilesError) throw profilesError;

          // 2. Roles டேபிளில் இருந்து ரோல்களை எடுத்தல்
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

          if (rolesError) throw rolesError;

          // 3. இரண்டையும் இணைத்து ஒரே ஆப்ஜெக்ட்டாக மாற்றுதல்
          const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
              const userRole = roles?.find((r) => r.user_id === profile.user_id);
              return { 
                  ...profile, 
                  role: (userRole?.role as AppRole) || 'customer' 
              };
          });

          setUsers(usersWithRoles);
      } catch (error) {
          console.error('Error fetching users:', error);
          toast({ title: 'Error', description: 'Failed to fetch users from database.', variant: 'destructive' });
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });
        
      if (error) throw error;
      setUsers((prev) => prev.map((user) => user.user_id === userId ? { ...user, role: newRole } : user));
      toast({ title: 'Role Updated', description: `User role changed to ${newRole}.` });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: 'Failed to update user role.', variant: 'destructive' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (values: z.infer<typeof createUserSchema>) => {
      // Client-side Supabase SDK மூலம் நேரடியாக Auth பயனர் உருவாக்க முடியாது (Admin Key தேவை)
      // அதனால் இது ஒரு எட்ஜ் பங்க்ஷன் அல்லது சர்வர் பக்க லாஜிக் தேவைப்படும்
      toast({ 
        title: 'Development Mode', 
        description: 'Creating users requires Supabase Admin API or an Edge Function.', 
        variant: 'default' 
      });
      setCreateUserOpen(false);
  }

  const handleUpdateUser = async (values: z.infer<typeof editUserSchema>) => {
    if (!selectedUser) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: values.full_name, country: values.country })
            .eq('user_id', selectedUser.user_id);
        if (error) throw error;
        toast({ title: 'User Updated', description: 'User details updated successfully.' });
        setEditUserOpen(false);
        fetchUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      // Profile நீக்குதல் (Auth User-ஐ நீக்க Admin API தேவை)
      const { error } = await supabase.from('profiles').delete().eq('user_id', selectedUser.user_id);
      if (error) throw error;
      toast({ title: 'User Removed', description: 'Profile removed from database.' });
      setDeleteAlertOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to delete user profile.', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const RoleIcon = ({ role }: { role: AppRole }) => {
    const Icon = roleIcons[role];
    return <Icon className="h-4 w-4" />;
  };

  const truncate = (str: string | null, n: number) => {
    if (!str) return 'N/A';
    return str.length > n ? str.substring(0, n - 1) + '...' : str;
  }

  return (
    <>
        {/* Create User Dialog */}
        <Dialog open={isCreateUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create New User</DialogTitle><DialogDescription>Fill out the form to add a new user.</DialogDescription></DialogHeader>
                <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="grid gap-4 py-4">
                        <FormField control={createForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter full name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={createForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="Enter email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={createForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Create a strong password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={createForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={createForm.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(countryFlags).map(([code, flag]) => <SelectItem key={code} value={code}>{flag} {code}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.formState.isSubmitting}>{createForm.formState.isSubmitting ? 'Creating...' : 'Create User'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setEditUserOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Edit User Details</DialogTitle><DialogDescription>Update the user's information below.</DialogDescription></DialogHeader>
                 <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="grid gap-4 py-4">
                        <FormField control={editForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter full name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={editForm.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(countryFlags).map(([code, flag]) => <SelectItem key={code} value={code}>{flag} {code}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.formState.isSubmitting}>{editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        {/* Delete User Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the user account and remove their data from our servers.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete User</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
                    <Button onClick={() => setCreateUserOpen(true)} className="w-full sm:w-auto flex items-center gap-2"><PlusCircle className="h-4 w-4"/> Create User</Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="border-b"><tr className="text-left text-muted-foreground"><th className="p-4 font-medium">User</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Country</th><th className="p-4 font-medium">Joined Date</th><th className="p-4 font-medium text-right">Actions</th></tr></thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-muted/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${roleColors[user.role]}`}><RoleIcon role={user.role} /></div>
                                                <div>
                                                    <p className="font-semibold text-foreground truncate max-w-[150px]" title={user.full_name || ''}>{truncate(user.full_name, 20)}</p>
                                                    <p className="text-muted-foreground truncate max-w-[200px]" title={user.email || ''}>{truncate(user.email, 25)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><Badge variant="secondary" className={roleColors[user.role]}>{user.role}</Badge></td>
                                        <td className="p-4"><span className="flex items-center gap-2">{countryFlags[user.country || ''] || ''} {user.country}</span></td>
                                        <td className="p-4 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Select value={user.role} onValueChange={(value: AppRole) => handleRoleChange(user.user_id, value)} disabled={updatingUserId === user.user_id}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setEditUserOpen(true); }}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setDeleteAlertOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No users found.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <CardContent key={user.user_id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${roleColors[user.role]}`}><RoleIcon role={user.role} /></div>
                                        <div>
                                            <p className="font-semibold text-foreground">{truncate(user.full_name, 20)}</p>
                                            <p className="text-sm text-muted-foreground">{truncate(user.email, 25)}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className={roleColors[user.role]}>{user.role}</Badge>
                                                <span className="text-xs text-muted-foreground">{countryFlags[user.country || ''] || ''} {user.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => { setSelectedUser(user); setEditUserOpen(true); }}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => handleRoleChange(user.user_id, 'customer')}>Set as Customer</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleRoleChange(user.user_id, 'vendor')}>Set as Vendor</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleRoleChange(user.user_id, 'admin')}>Set as Admin</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => { setSelectedUser(user); setDeleteAlertOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        ))
                    )}
                </div>
            </Card>
        </motion.div>
    </>
  );
};

export default UserManagement;