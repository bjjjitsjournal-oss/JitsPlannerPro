import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: number; // Keep integer ID for compatibility with existing database
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  createdAt: string;
  supabaseId?: string; // Store Supabase UUID for reference
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

// TEMPORARY: Bypass database and use Supabase Auth directly
async function getUserFromSupabaseId(supabaseId: string, email: string, metadata: any): Promise<User | null> {
  try {
    console.log('Using Supabase user directly (DB queries disabled):', email);
    
    // Return user directly from Supabase Auth metadata
    // Using a hash of the UUID as a pseudo-integer ID
    const pseudoId = Math.abs(supabaseId.split('-')[0].split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    
    return {
      id: pseudoId,
      email: email,
      firstName: metadata?.firstName || '',
      lastName: metadata?.lastName || '',
      subscriptionStatus: 'free',
      subscriptionPlan: undefined,
      createdAt: new Date().toISOString(),
      supabaseId,
    };
  } catch (error) {
    console.error('Error creating user from Supabase:', error);
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userData = await getUserFromSupabaseId(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata
          );
          console.log('User data loaded:', userData?.email);
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          setUser(null);
        }
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Session check failed:', error);
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
        try {
          const userData = await getUserFromSupabaseId(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata
          );
          console.log('User data loaded:', userData?.email);
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          setUser(null);
        }
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
