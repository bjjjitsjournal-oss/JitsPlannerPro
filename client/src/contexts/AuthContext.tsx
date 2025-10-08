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
  role?: string; // user, admin
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
    console.log('Looking up user with Supabase ID:', supabaseId, 'email:', email);
    
    // Query by supabase_uid to work with RLS policies
    console.log('Querying users table with supabase_uid:', supabaseId);
    
    // Add timeout to detect hanging queries
    // Use * to get all columns from the users table
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('supabase_uid', supabaseId)
      .maybeSingle(); // Use maybeSingle to handle not found without error
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 5s')), 5000)
    );
    
    const { data: existingUser, error: userError } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]).catch(err => {
      console.error('Query failed or timed out:', err);
      return { data: null, error: err };
    }) as any;

    console.log('Query result:', { existingUser, userError });
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Database query error:', userError);
      return null;
    }

    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      return {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.first_name || '',
        lastName: existingUser.last_name || '',
        subscriptionStatus: existingUser.subscription_status || 'free',
        subscriptionPlan: existingUser.subscription_plan,
        role: existingUser.role || 'user',
        createdAt: existingUser.created_at,
        supabaseId,
      };
    }

    // Create new user if not found
    console.log('Creating new user with supabase_uid:', supabaseId);
    
    // Check if this is an admin email
    const adminEmails = ['bjjjitsjournal@gmail.com', 'Bjjjitsjournal@gmail.com'];
    const isAdmin = adminEmails.some(adminEmail => email.toLowerCase() === adminEmail.toLowerCase());
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        first_name: metadata.firstName || '',
        last_name: metadata.lastName || '',
        subscription_status: isAdmin ? 'premium' : 'free',
        role: isAdmin ? 'admin' : 'user',
        supabase_uid: supabaseId, // Important: Set this for RLS policies
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return null;
    }

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name || '',
      lastName: newUser.last_name || '',
      subscriptionStatus: newUser.subscription_status || 'free',
      subscriptionPlan: newUser.subscription_plan,
      role: newUser.role || 'user',
      createdAt: newUser.created_at,
      supabaseId,
    };
  } catch (error) {
    console.error('Error in getUserFromSupabaseId:', error);
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
