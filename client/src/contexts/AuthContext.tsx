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

// Helper to fetch or create user profile from Supabase UUID
async function getUserFromSupabaseId(supabaseId: string, email: string, metadata: any): Promise<User | null> {
  try {
    // First, try to find existing user by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update auth_identities mapping if needed
      const { error: identityError } = await supabase
        .from('auth_identities')
        .upsert({
          user_id: existingUser.id,
          supabase_uid: supabaseId,
        });

      if (identityError) {
        console.error('Failed to update auth identity:', identityError);
      }

      return {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.first_name || metadata.firstName || '',
        lastName: existingUser.last_name || metadata.lastName || '',
        subscriptionStatus: existingUser.subscription_status || 'free',
        subscriptionPlan: existingUser.subscription_plan,
        createdAt: existingUser.created_at,
        supabaseId,
      };
    }

    // If no existing user, this is a new signup - user profile will be created in Auth.tsx
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
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
