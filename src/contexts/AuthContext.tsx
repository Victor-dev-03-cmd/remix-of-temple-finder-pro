import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'vendor' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  userRoles: AppRole[];
  activeViewRole: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, country?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchRole: (role: AppRole) => void;
  isAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
  hasMultipleRoles: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [activeViewRole, setActiveViewRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = (userId: string) => {
    // Use setTimeout to avoid deadlock with onAuthStateChange
    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching user roles:', error);
          setUserRole('customer');
          setUserRoles(['customer']);
          setActiveViewRole('customer');
          return;
        }

        const roles = (data?.map(r => r.role as AppRole) || ['customer']);
        setUserRoles(roles);
        
        // Set primary role (admin > vendor > customer)
        const primaryRole = roles.includes('admin') ? 'admin' : 
                           roles.includes('vendor') ? 'vendor' : 'customer';
        setUserRole(primaryRole);
        
        // Check if there's a stored active role preference
        const storedRole = localStorage.getItem(`activeViewRole_${userId}`);
        if (storedRole && roles.includes(storedRole as AppRole)) {
          setActiveViewRole(storedRole as AppRole);
        } else {
          setActiveViewRole(primaryRole);
        }
      } catch (err) {
        console.error('Error in fetchUserRoles:', err);
        setUserRole('customer');
        setUserRoles(['customer']);
        setActiveViewRole('customer');
      }
    }, 0);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRoles(session.user.id);
        } else {
          setUserRole(null);
          setUserRoles([]);
          setActiveViewRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, country: string = 'LK') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          country: country,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserRoles([]);
    setActiveViewRole(null);
  };

  const switchRole = (role: AppRole) => {
    if (userRoles.includes(role)) {
      setActiveViewRole(role);
      if (user) {
        localStorage.setItem(`activeViewRole_${user.id}`, role);
      }
    }
  };

  const value = {
    user,
    session,
    userRole,
    userRoles,
    activeViewRole,
    loading,
    signUp,
    signIn,
    signOut,
    switchRole,
    isAdmin: activeViewRole === 'admin',
    isVendor: activeViewRole === 'vendor',
    isCustomer: activeViewRole === 'customer',
    hasMultipleRoles: userRoles.length > 1,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
