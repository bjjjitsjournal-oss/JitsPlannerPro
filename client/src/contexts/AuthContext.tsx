import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { queryClient } from '@/lib/queryClient';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

interface User {
  id: string; // UUID varchar to match production database
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
    
    // Use backend API instead of direct Supabase query to avoid timeouts
    console.log('Fetching user from backend API...');
    
    const response = await fetch(`${API_BASE_URL}/api/user/by-supabase-id/${supabaseId}`);
    
    if (response.ok) {
      const existingUser = await response.json();
      console.log('Found existing user from backend:', existingUser.id);
      
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
  const loadedSupabaseIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      // Exchange Supabase token for server JWT (mobile fix)
      if (session?.user) {
        // CRITICAL FIX: Mobile PKCE flow doesn't provide access_token, so refresh first
        let accessToken = session.access_token;
        
        if (!accessToken) {
          console.log('📱 No access_token - refreshing session to get one...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session?.access_token) {
            accessToken = refreshData.session.access_token;
            console.log('✅ Got access_token from refresh');
          } else {
            console.error('❌ Failed to get access_token even after refresh:', refreshError?.message);
          }
        }
        
        if (accessToken) {
          console.log('📱 Exchanging Supabase token for server JWT...');
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/supabase-exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ supabaseAccessToken: accessToken }),
            });
            
            if (response.ok) {
              const { token } = await response.json();
              await Preferences.set({ key: 'bjj_jwt_token', value: token });
              console.log('✅ Server JWT saved to Capacitor Preferences');
              // Invalidate queries to refetch with new auth
              queryClient.invalidateQueries();
            } else {
              console.error('❌ Failed to exchange token:', response.status);
            }
          } catch (error) {
            console.error('❌ Token exchange error:', error);
          }
        } else {
          console.error('❌ NO TOKEN AVAILABLE - Cannot exchange for server JWT');
        }
      }
      
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
            loadedSupabaseIdRef.current = session.user.id; // Track loaded Supabase ID
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      // Exchange Supabase token for server JWT (mobile fix)
      if (session?.user) {
        // CRITICAL FIX: Mobile PKCE flow doesn't provide access_token, so refresh first
        let accessToken = session.access_token;
        
        if (!accessToken && event !== 'TOKEN_REFRESHED') {
          console.log('📱 No access_token on auth change - refreshing session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session?.access_token) {
            accessToken = refreshData.session.access_token;
            console.log('✅ Got access_token from refresh on auth change');
          } else {
            console.error('❌ Failed to get access_token on auth change:', refreshError?.message);
          }
        }
        
        if (accessToken) {
          console.log('📱 Exchanging Supabase token for server JWT on auth change...');
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/supabase-exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ supabaseAccessToken: accessToken }),
            });
            
            if (response.ok) {
              const { token } = await response.json();
              await Preferences.set({ key: 'bjj_jwt_token', value: token });
              console.log('✅ Server JWT saved to Capacitor Preferences on auth change');
              // Invalidate queries to refetch with new auth
              queryClient.invalidateQueries();
            } else {
              console.error('❌ Failed to exchange token on auth change:', response.status);
            }
          } catch (error) {
            console.error('❌ Token exchange error on auth change:', error);
          }
        } else {
          console.error('❌ NO TOKEN AVAILABLE on auth change - Cannot exchange');
        }
      }
      
      if (session?.user) {
        // CRITICAL FIX: Skip database query on token refresh to avoid timeout
        if (event === 'TOKEN_REFRESHED' || loadedSupabaseIdRef.current === session.user.id) {
          console.log('Token refresh detected - skipping database query for:', session.user.email);
          setIsLoading(false);
          return;
        }
        
        // Only query database on actual sign-in
        setIsLoading(true);
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
            loadedSupabaseIdRef.current = session.user.id; // Track loaded Supabase ID
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
        // Clear JWT from Capacitor Preferences
        await Preferences.remove({ key: 'bjj_jwt_token' });
        console.log('✅ Cleared JWT from Capacitor Preferences');
        setUser(null);
        loadedSupabaseIdRef.current = null; // Clear ref on logout
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
    // Clear JWT from Capacitor Preferences
    await Preferences.remove({ key: 'bjj_jwt_token' });
    console.log('✅ Cleared JWT on logout');
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