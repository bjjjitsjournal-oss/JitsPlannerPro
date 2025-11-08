import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { queryClient, setCachedSupabaseId, setCachedAccessToken, setCachedSessionData, getCachedSessionData, hydrateAuthCache } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://jitsjournal-backend.onrender.com'
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

async function getUserFromSupabaseId(supabaseId: string, email: string, metadata: any, accessToken?: string, retries = 3): Promise<User | null> {
  const attemptNumber = 4 - retries;
  console.log('🔍 Loading user data for supabaseId:', supabaseId, `(attempt ${attemptNumber}/3)`);
  
  try {
    // Add timeout to fetch (10 seconds should be plenty)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('🔑 Including Supabase access token in request');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/user/by-supabase-id/${supabaseId}`, {
      signal: controller.signal,
      headers,
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
      if (retries > 1) {
        console.log('⏳ User not found yet (signup race condition), retrying in 1000ms...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getUserFromSupabaseId(supabaseId, email, metadata, accessToken, retries - 1);
      }
      // After 3 attempts, user really doesn't exist
      console.error('❌ User not found in database for supabaseId:', supabaseId);
      return null;
    }
    
    // Handle server errors (500, 502, 503, 504) - retry briefly
    if (response.status >= 500 && retries > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 5000); // Exponential backoff, max 5s
      console.log(`⚠️ Server error ${response.status}, retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return getUserFromSupabaseId(supabaseId, email, metadata, accessToken, retries - 1);
    }
    
    // Other errors (401, 403, etc.)
    const errorText = await response.text();
    console.error('❌ Unexpected error from backend:', response.status, errorText);
    return null;
    
  } catch (error: any) {
    // Network errors, timeouts, etc. - retry briefly
    if (retries > 0 && (error.name === 'AbortError' || error.message?.includes('fetch') || error.message?.includes('network'))) {
      const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 5000);
      console.log(`⚠️ Network error (${error.message}), retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return getUserFromSupabaseId(supabaseId, email, metadata, accessToken, retries - 1);
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
  const [cacheReady, setCacheReady] = useState(false);
  const loadedSupabaseIdRef = React.useRef<string | null>(null);
  const isSigningUpRef = React.useRef(false);

  // CRITICAL: Hydrate cache BEFORE rendering children (blocks app until ready)
  useEffect(() => {
    const bootstrapCache = async () => {
      await hydrateAuthCache();
      setCacheReady(true);
      console.log('✅ Auth cache hydrated - app ready to render');
    };
    bootstrapCache();
  }, []);

  useEffect(() => {
    if (!cacheReady) return; // Don't start auth flow until cache is ready
    
    const initAuth = async () => {
      setLoadingMessage('Checking session...');
      
      // OPTIMIZATION: On mobile with cached data, skip the slow getSession() call
      const cachedSession = getCachedSessionData();
      if (Capacitor.isNativePlatform() && cachedSession) {
        console.log('🚀 FAST PATH: Using cached session data on mobile - skipping slow getSession() call!');
        
        // Create mock session object from cached data
        const mockSession = {
          user: {
            id: cachedSession.id,
            email: cachedSession.email,
            user_metadata: cachedSession.metadata
          },
          access_token: cachedSession.token
        };
        
        setSession(mockSession);
        setSupabaseUser(mockSession.user as any);
        
        try {
          setLoadingMessage('Loading your data...');
          const userDataStart = performance.now();
          const userData = await getUserFromSupabaseId(cachedSession.id, cachedSession.email, cachedSession.metadata, cachedSession.token);
          const userDataDuration = performance.now() - userDataStart;
          console.log(`⏱️  getUserFromSupabaseId() took ${userDataDuration.toFixed(0)}ms`);
          
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = cachedSession.id;
            setIsLoading(false);
            console.log('✅ Fast path auth complete!');
            return; // Exit early - no need to call getSession()
          }
        } catch (error) {
          console.error('❌ Fast path failed, falling back to slow path:', error);
          // Fall through to slow path below
        }
      }
      
      // SLOW PATH: Call getSession() - required for web and mobile on first login
      const sessionStart = performance.now();
      const { data: { session } } = await supabase.auth.getSession();
      const sessionDuration = performance.now() - sessionStart;
      console.log(`⏱️  supabase.auth.getSession() took ${sessionDuration.toFixed(0)}ms`);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          // Cache the Supabase ID, access token, and session data for fast cold-start next time
          await Promise.all([
            setCachedSupabaseId(session.user.id),
            setCachedAccessToken(session.access_token),
            setCachedSessionData(session.user.email || null, session.user.user_metadata)
          ]);
          
          setLoadingMessage('Loading your data...');
          const userDataStart = performance.now();
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata, session.access_token);
          const userDataDuration = performance.now() - userDataStart;
          console.log(`⏱️  getUserFromSupabaseId() took ${userDataDuration.toFixed(0)}ms`);
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = session.user.id;
            setIsLoading(false);
          } else {
            await supabase.auth.signOut();
            await Promise.all([
              setCachedSupabaseId(null),
              setCachedAccessToken(null),
              setCachedSessionData(null, null)
            ]);
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          await supabase.auth.signOut();
          await Promise.all([
            setCachedSupabaseId(null),
            setCachedAccessToken(null),
            setCachedSessionData(null, null)
          ]);
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        await Promise.all([
          setCachedSupabaseId(null),
          setCachedAccessToken(null),
          setCachedSessionData(null, null)
        ]);
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
        // Cache the Supabase ID and access token immediately for fast API calls
        await Promise.all([
          setCachedSupabaseId(session.user.id),
          setCachedAccessToken(session.access_token)
        ]);
        
        if (event === 'TOKEN_REFRESHED' || loadedSupabaseIdRef.current === session.user.id) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        setLoadingMessage('Signing you in...');
        try {
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata, session.access_token);
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
              await Promise.all([
                setCachedSupabaseId(null),
                setCachedAccessToken(null)
              ]);
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
            await Promise.all([
              setCachedSupabaseId(null),
              setCachedAccessToken(null)
            ]);
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
          }
          setIsLoading(false);
        }
      } else {
        await Promise.all([
          setCachedSupabaseId(null),
          setCachedAccessToken(null)
        ]);
        setUser(null);
        loadedSupabaseIdRef.current = null;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [cacheReady]); // Re-run when cache is ready

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await Promise.all([
      setCachedSupabaseId(null),
      setCachedAccessToken(null)
    ]);
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    queryClient.clear();
  };

  const setSignupInProgress = (inProgress: boolean) => {
    console.log('🚦 Setting signup in progress:', inProgress);
    isSigningUpRef.current = inProgress;
  };

  // Don't render app until cache is ready (prevents race condition)
  if (!cacheReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Initializing...</p>
      </div>
    );
  }

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
