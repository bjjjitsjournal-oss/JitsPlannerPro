import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { queryClient, setCachedSupabaseId } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  role?: string;
  createdAt: string;
  supabaseId?: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: any;
  isLoading: boolean;
  loadingMessage: string;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setSignupInProgress: (inProgress: boolean) => void;
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

async function getUserFromSupabaseId(supabaseId: string, email: string, metadata: any, retries = 10): Promise<User | null> {
  const attemptNumber = 11 - retries;
  console.log('🔍 Loading user data for supabaseId:', supabaseId, `(attempt ${attemptNumber}/10)`);
  
  try {
    // Add timeout to fetch (60 seconds for cold starts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${API_BASE_URL}/api/user/by-supabase-id/${supabaseId}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('📡 User endpoint response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User data loaded successfully:', { id: data.id, email: data.email });
      return {
        id: data.id.toString(),
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        subscriptionStatus: data.subscription_status || 'free',
        subscriptionPlan: data.subscription_plan,
        role: data.role || 'user',
        createdAt: data.created_at,
        supabaseId: data.supabase_uid,
      };
    }
    
    // Handle different error scenarios
    if (response.status === 404) {
      // User genuinely doesn't exist in database - only retry a few times for signup race condition
      if (retries > 7) {
        console.log('⏳ User not found yet (signup race condition), retrying in 1000ms...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getUserFromSupabaseId(supabaseId, email, metadata, retries - 1);
      }
      // After 3 attempts, user really doesn't exist
      console.error('❌ User not found in database for supabaseId:', supabaseId);
      return null;
    }
    
    // Handle server errors (500, 502, 503, 504) - likely cold start or server issues
    if (response.status >= 500 && retries > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000); // Exponential backoff, max 10s
      console.log(`⚠️ Server error ${response.status} (likely cold start), retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return getUserFromSupabaseId(supabaseId, email, metadata, retries - 1);
    }
    
    // Other errors (401, 403, etc.)
    const errorText = await response.text();
    console.error('❌ Unexpected error from backend:', response.status, errorText);
    return null;
    
  } catch (error: any) {
    // Network errors, timeouts, etc. - retry with backoff
    if (retries > 0 && (error.name === 'AbortError' || error.message?.includes('fetch') || error.message?.includes('network'))) {
      const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
      console.log(`⚠️ Network error (${error.message}), retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return getUserFromSupabaseId(supabaseId, email, metadata, retries - 1);
    }
    
    console.error('❌ Fatal error in getUserFromSupabaseId:', error);
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const loadedSupabaseIdRef = React.useRef<string | null>(null);
  const isSigningUpRef = React.useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      setLoadingMessage('Checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          // Cache the Supabase ID immediately for fast API calls
          await setCachedSupabaseId(session.user.id);
          
          setLoadingMessage('Loading your data...');
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata);
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = session.user.id;
            setIsLoading(false);
          } else {
            await supabase.auth.signOut();
            await setCachedSupabaseId(null);
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          await supabase.auth.signOut();
          await setCachedSupabaseId(null);
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        await setCachedSupabaseId(null);
        setIsLoading(false);
      }
    };

    initAuth().catch((error) => {
      console.error('Session check failed:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, 'isSigningUp:', isSigningUpRef.current);
      
      // Ignore auth state changes during signup process
      if (isSigningUpRef.current) {
        console.log('⏭️ Ignoring auth state change during signup');
        return;
      }
      
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        // Cache the Supabase ID immediately for fast API calls
        await setCachedSupabaseId(session.user.id);
        
        if (event === 'TOKEN_REFRESHED' || loadedSupabaseIdRef.current === session.user.id) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        setLoadingMessage('Signing you in...');
        try {
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata);
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = session.user.id;
            setIsLoading(false);
          } else {
            // Only sign out if this is NOT a fresh sign-in event
            // Fresh sign-ins (SIGNED_IN) might not have user data ready yet
            if (event !== 'SIGNED_IN') {
              console.log('⚠️ User data not found, signing out (event:', event, ')');
              await supabase.auth.signOut();
              await setCachedSupabaseId(null);
              setUser(null);
              setSession(null);
              setSupabaseUser(null);
            } else {
              console.log('⏳ Fresh sign-in detected, user data not ready yet. Keeping session active.');
            }
            setIsLoading(false);
          }
        } catch (error) {
          // Only sign out on errors for non-SIGNED_IN events
          if (event !== 'SIGNED_IN') {
            await supabase.auth.signOut();
            await setCachedSupabaseId(null);
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
          }
          setIsLoading(false);
        }
      } else {
        await setCachedSupabaseId(null);
        setUser(null);
        loadedSupabaseIdRef.current = null;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await setCachedSupabaseId(null);
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    queryClient.clear();
  };

  const setSignupInProgress = (inProgress: boolean) => {
    console.log('🚦 Setting signup in progress:', inProgress);
    isSigningUpRef.current = inProgress;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        loadingMessage,
        login,
        logout,
        isAuthenticated: !!user,
        setSignupInProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
