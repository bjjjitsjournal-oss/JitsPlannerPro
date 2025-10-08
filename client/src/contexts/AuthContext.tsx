import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { queryClient } from '@/lib/queryClient';

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
      
      // If supabase_uid is missing, update it for future logins
      if (!existingUser.supabase_uid) {
        console.log('Backfilling missing supabase_uid for user:', existingUser.id);
        await supabase
          .from('users')
          .update({ supabase_uid: supabaseId })
          .eq('id', existingUser.id);
      }
      
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

    // Fallback: Try to find user by email (for legacy accounts without supabase_uid)
    const { data: emailUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (emailUser) {
      console.log('Found user by email, updating supabase_uid:', emailUser.id);
      // Update with supabase_uid for future logins
      await supabase
        .from('users')
        .update({ supabase_uid: supabaseId })
        .eq('id', emailUser.id);

      return {
        id: emailUser.id,
        email: emailUser.email,
        firstName: emailUser.first_name || '',
        lastName: emailUser.last_name || '',
        subscriptionStatus: emailUser.subscription_status || 'free',
        subscriptionPlan: emailUser.subscription_plan,
        role: emailUser.role || 'user',
        createdAt: emailUser.created_at,
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
        // Keep loading until user profile is fetched
        try {
          const userData = await getUserFromSupabaseId(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata
          );
          
          if (userData) {
            console.log('User data loaded:', userData.email);
            console.log('Setting user with ID:', userData.id, 'type:', typeof userData.id);
            // CRITICAL: Clear ALL cache before setting user to prevent UUID pollution
            queryClient.clear();
            setUser(userData);
            setIsLoading(false); // Only stop loading after user data is ready
          } else {
            console.error('getUserFromSupabaseId returned null - user profile not found');
            // Force logout if profile lookup fails
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          // Force logout on error
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        // No session, stop loading immediately
        setIsLoading(false);
      }
    }).catch((error) => {
      console.error('Session check failed:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      
      // Start loading when auth state changes
      setIsLoading(true);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userData = await getUserFromSupabaseId(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata
          );
          
          if (userData) {
            console.log('User data loaded after auth change:', userData.email);
            console.log('Setting user with ID:', userData.id, 'type:', typeof userData.id);
            // CRITICAL: Clear ALL cache before setting user to prevent UUID pollution
            queryClient.clear();
            setUser(userData);
            setIsLoading(false); // Stop loading after user data is ready
          } else {
            console.error('getUserFromSupabaseId returned null after auth change - forcing logout');
            // Force logout if profile lookup fails
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Failed to load user data after auth change:', error);
          // Force logout on error
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
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
    isAuthenticated: !!(session && user), // Require BOTH session AND user profile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
