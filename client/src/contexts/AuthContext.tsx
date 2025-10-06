import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: any;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        // Map Supabase user to our User interface
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.firstName || '',
          lastName: session.user.user_metadata?.lastName || '',
          subscriptionStatus: session.user.user_metadata?.subscriptionStatus || 'free',
          subscriptionPlan: session.user.user_metadata?.subscriptionPlan,
          createdAt: session.user.created_at,
        };
        setUser(userData);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile data from database
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: profileData?.first_name || session.user.user_metadata?.firstName || '',
          lastName: profileData?.last_name || session.user.user_metadata?.lastName || '',
          subscriptionStatus: profileData?.subscription_status || 'free',
          subscriptionPlan: profileData?.subscription_plan,
          createdAt: session.user.created_at,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: User) => {
    // This is mainly for compatibility - Supabase handles login automatically
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
