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

async function getSupabaseId(): Promise<string | null> {
  // 1. Check in-memory cache (fastest)
  if (cachedSupabaseId) {
    return cachedSupabaseId;
  }
  
  // 2. On mobile, check Capacitor Preferences (fast, persistent)
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: 'supabase_user_id' });
      if (value) {
        cachedSupabaseId = value; // Hydrate in-memory cache
        console.log('📱 Loaded Supabase ID from Preferences (instant!)');
        return value;
      }
    } catch (e) {
      console.error('Failed to read from Preferences:', e);
    }
  }
  
  // 3. Fallback to fetching from Supabase (slow on mobile, only happens once)
  try {
    console.log('⚠️ Falling back to getSession() - this should only happen once');
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id || null;
    if (id) {
      await setCachedSupabaseId(id); // Cache for next time
    }
    return id;
  } catch (e) {
    console.error('Failed to get Supabase user:', e);
    return null;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const supabaseId = await getSupabaseId();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add supabaseId as query param for GET requests (flexibleAuth support)
        let url = `${API_BASE_URL}${queryKey[0] as string}`;
        if (supabaseId) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}supabaseId=${supabaseId}`;
          console.log('📱 Query with supabaseId');
        } else {
          console.warn('⚠️ No supabaseId available for query');
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
  const supabaseId = await getSupabaseId();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };

  // Add supabaseId to request body for POST/PATCH/DELETE (flexibleAuth support)
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
