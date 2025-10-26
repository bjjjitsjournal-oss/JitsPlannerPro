import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Get API base URL - use Render for mobile app, env var for web, or relative path
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

// In-memory cache for fast access (but cleared on app restart)
let cachedSupabaseId: string | null = null;
let cachedAccessToken: string | null = null;
let cacheHydrated = false;

// Bootstrap function to preload cache from Preferences (call ASAP on app start)
export async function hydrateAuthCache() {
  if (cacheHydrated) return; // Only run once
  
  if (Capacitor.isNativePlatform()) {
    const startTime = performance.now();
    try {
      const [idResult, tokenResult] = await Promise.all([
        Preferences.get({ key: 'supabase_user_id' }),
        Preferences.get({ key: 'supabase_access_token' })
      ]);
      
      if (idResult.value) {
        cachedSupabaseId = idResult.value;
      }
      if (tokenResult.value) {
        cachedAccessToken = tokenResult.value;
      }
      
      const duration = performance.now() - startTime;
      console.log(`⚡ BOOTSTRAP: Hydrated auth cache from Preferences in ${duration.toFixed(1)}ms`, {
        hasId: !!cachedSupabaseId,
        hasToken: !!cachedAccessToken
      });
    } catch (e) {
      console.error('Failed to hydrate auth cache:', e);
    }
  }
  
  cacheHydrated = true;
}

// Persist to Capacitor Preferences for mobile (survives app restarts)
export async function setCachedSupabaseId(id: string | null) {
  cachedSupabaseId = id;
  
  if (Capacitor.isNativePlatform()) {
    if (id) {
      await Preferences.set({ key: 'supabase_user_id', value: id });
      console.log('💾 Persisted Supabase ID to Preferences');
    } else {
      await Preferences.remove({ key: 'supabase_user_id' });
      console.log('🗑️ Cleared Supabase ID from Preferences');
    }
  }
}

// Cache and persist access token for Authorization headers
export async function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  
  if (Capacitor.isNativePlatform()) {
    if (token) {
      await Preferences.set({ key: 'supabase_access_token', value: token });
      console.log('🔑 Persisted access token to Preferences');
    } else {
      await Preferences.remove({ key: 'supabase_access_token' });
      console.log('🗑️ Cleared access token from Preferences');
    }
  }
}

async function getSupabaseId(): Promise<string | null> {
  const startTime = performance.now();
  
  // 1. Check in-memory cache (fastest)
  if (cachedSupabaseId) {
    const duration = performance.now() - startTime;
    console.log(`⚡ getSupabaseId from cache in ${duration.toFixed(1)}ms`);
    return cachedSupabaseId;
  }
  
  // 2. On mobile, check Capacitor Preferences (fast, persistent) - should be hydrated already
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: 'supabase_user_id' });
      if (value) {
        cachedSupabaseId = value; // Hydrate in-memory cache
        const duration = performance.now() - startTime;
        console.log(`📱 Loaded Supabase ID from Preferences in ${duration.toFixed(1)}ms (cache miss - should have been preloaded!)`);
        return value;
      }
    } catch (e) {
      console.error('Failed to read from Preferences:', e);
    }
  }
  
  // 3. Fallback to fetching from Supabase (slow on mobile, only happens once)
  try {
    console.log('🐌 SLOW PATH: Falling back to getSession() - this should only happen once after first login');
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id || null;
    if (id) {
      await setCachedSupabaseId(id); // Cache for next time
    }
    const duration = performance.now() - startTime;
    console.log(`⚠️ getSession() took ${duration.toFixed(1)}ms`);
    return id;
  } catch (e) {
    console.error('Failed to get Supabase user:', e);
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const startTime = performance.now();
  
  // 1. Check in-memory cache (fastest)
  if (cachedAccessToken) {
    const duration = performance.now() - startTime;
    console.log(`⚡ getAccessToken from cache in ${duration.toFixed(1)}ms`);
    return cachedAccessToken;
  }
  
  // 2. On mobile, check Capacitor Preferences (fast, persistent) - should be hydrated already
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: 'supabase_access_token' });
      if (value) {
        cachedAccessToken = value; // Hydrate in-memory cache
        const duration = performance.now() - startTime;
        console.log(`🔑 Loaded access token from Preferences in ${duration.toFixed(1)}ms (cache miss - should have been preloaded!)`);
        return value;
      }
    } catch (e) {
      console.error('Failed to read access token from Preferences:', e);
    }
  }
  
  // 3. Fallback to fetching from Supabase (slow on mobile)
  try {
    console.log('🐌 SLOW PATH: Falling back to getSession() for token - this should only happen once after first login');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || null;
    if (token) {
      await setCachedAccessToken(token); // Cache for next time
    }
    const duration = performance.now() - startTime;
    console.log(`⚠️ getSession() for token took ${duration.toFixed(1)}ms`);
    return token;
  } catch (e) {
    console.error('Failed to get access token:', e);
    return null;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const [supabaseId, accessToken] = await Promise.all([
          getSupabaseId(),
          getAccessToken()
        ]);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add Authorization header for fast backend JWT verification
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
          console.log('🔑 Query with Authorization header (fast path!)');
        } else if (supabaseId) {
          // Fallback: use supabaseId query param for flexibleAuth
          console.log('📱 Query with supabaseId (fallback path)');
        } else {
          console.warn('⚠️ No auth available for query');
        }
        
        // Add supabaseId as query param for backward compatibility
        let url = `${API_BASE_URL}${queryKey[0] as string}`;
        if (supabaseId) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}supabaseId=${supabaseId}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('🔄 Auth failed - may need to refresh');
            sessionStorage.setItem('auth_failure', 'true');
          }
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
    },
  },
});

export async function apiRequest(method: string, url: string, data?: any) {
  const [supabaseId, accessToken] = await Promise.all([
    getSupabaseId(),
    getAccessToken()
  ]);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header for fast backend JWT verification
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    console.log('🔑 Mutation with Authorization header (fast path!)');
  } else {
    console.log('📱 Mutation with supabaseId (fallback path)');
  }
  
  const options: RequestInit = {
    method,
    headers,
  };

  // Add supabaseId to request body for backward compatibility
  if (data) {
    options.body = JSON.stringify({
      ...data,
      supabaseId,
    });
  } else if (supabaseId) {
    options.body = JSON.stringify({ supabaseId });
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.log('🔄 Auth failed in API request');
      throw new Error('Authentication required. Please refresh the page and try again.');
    }
    
    let errorMessage = `${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const errorText = await response.text();
      errorMessage = `${response.status}: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  return response;
}
