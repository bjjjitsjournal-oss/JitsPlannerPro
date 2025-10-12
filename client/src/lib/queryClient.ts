import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile app, env var for web, or relative path
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

// Helper to get Supabase user ID (for mobile workaround)
async function getSupabaseUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (e) {
    console.error('Failed to get Supabase user ID:', e);
    return null;
  }
}

// Helper to get Supabase access token
async function getSupabaseToken(): Promise<string | null> {
  try {
    // MOBILE FIX: Check localStorage first (where AuthContext persists the token)
    const storedToken = localStorage.getItem('supabase_access_token');
    console.log('[DEBUG] getSupabaseToken - localStorage check:', storedToken ? 'TOKEN FOUND' : 'NO TOKEN');
    
    if (storedToken) {
      console.log('✅ Using stored Supabase token from localStorage');
      return storedToken;
    }
    
    // Fallback to session (for web/desktop browsers)
    console.log('[DEBUG] Trying supabase.auth.getSession fallback...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[DEBUG] Session access_token:', session?.access_token ? 'EXISTS' : 'MISSING');
    return session?.access_token || null;
  } catch (e) {
    console.error('Failed to get Supabase session:', e);
    return null;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        // Get Supabase access token (preferred) or fallback to legacy token
        let token = await getSupabaseToken();
        if (!token) {
          token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
        }
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = `${API_BASE_URL}${queryKey[0] as string}`;
        const response = await fetch(url, {
          headers,
        });
        
        if (!response.ok) {
          // Handle authentication errors - but don't auto-logout to prevent short-time logouts
          if (response.status === 401 || response.status === 403) {
            console.log('Authentication failed in query - keeping user logged in to prevent auto-logout');
            // Don't clear tokens or reload - let user stay logged in
            sessionStorage.setItem('auth_failure', 'true'); // Flag for showing message
          }
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
    },
  },
});

// API request helper
export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authentication token if available
  // Get Supabase access token (preferred) or fallback to legacy token
  let token = await getSupabaseToken();
  if (!token) {
    token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
  }
  
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  } else if (Capacitor.isNativePlatform()) {
    // MOBILE WORKAROUND: If no token on mobile, add supabaseId to request body
    const supabaseId = await getSupabaseUserId();
    if (supabaseId) {
      console.log('📱 Adding supabaseId to request body for mobile auth workaround');
      data = { ...data, supabaseId };
    }
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    // Handle authentication errors - but don't auto-logout to prevent short-time logouts
    if (response.status === 401 || response.status === 403) {
      console.log('Authentication failed in API request - keeping user logged in to prevent auto-logout');
      
      // Throw error instead of returning undefined so mutations handle it properly
      throw new Error('Authentication required. Please refresh the page and try again.');
    }
    
    // Try to parse error as JSON, fallback to text
    let errorMessage = `${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const errorText = await response.text();
      // Check if it's HTML being returned instead of JSON (service worker caching issue)
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
        console.error('🚨 Service Worker returned HTML instead of JSON - forcing cache clear');
        // Auto-fix caching issue
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => caches.delete(cacheName));
          });
        }
        // Unregister service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
          });
        }
        errorMessage = `${response.status}: App cache issue detected and fixed. Please try again.`;
      } else {
        errorMessage = `${response.status}: ${errorText}`;
      }
    }
    throw new Error(errorMessage);
  }

  return response;
}