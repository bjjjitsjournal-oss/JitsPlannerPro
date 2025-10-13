<<<<<<< HEAD
﻿import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
=======
import { QueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240

// Get API base URL - use Render for mobile app, env var for web, or relative path
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

<<<<<<< HEAD
async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (e) {
    console.error('Failed to get Supabase token:', e);
    return null;
  }
=======
// Helper to get JWT from Capacitor Preferences with retry (fixes race condition on mobile)
async function getTokenWithRetry(maxRetries = 3, delayMs = 100): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const { value: token } = await Preferences.get({ key: 'bjj_jwt_token' });
    if (token) {
      console.log('✅ JWT found in Capacitor Preferences');
      return token;
    }
    
    // If no token and this is the first try, wait a bit for AuthContext to save it
    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting for JWT (attempt ${i + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.warn('⚠️ No JWT found after retries');
  return null;
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
<<<<<<< HEAD
        let token = await getSupabaseToken();
        if (!token) {
          token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
        }
=======
        const token = await getTokenWithRetry();
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
<<<<<<< HEAD
          console.log('📱 Sending Authorization header with token');
=======
          console.log('📱 Query with Authorization header');
        } else {
          console.warn('⚠️ No token available for query');
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
        }
        
        const url = `${API_BASE_URL}${queryKey[0] as string}`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
<<<<<<< HEAD
            console.log('Authentication failed in query');
=======
            console.log('🔄 Auth failed - may need to refresh');
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
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
<<<<<<< HEAD
  let token = await getSupabaseToken();
  if (!token) {
    token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
  }
=======
  const token = await getTokenWithRetry();
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
<<<<<<< HEAD
    console.log('📱 Sending Authorization header with token in apiRequest');
=======
    console.log('📱 API request with Authorization header');
  } else {
    console.warn('⚠️ No token available for API request');
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
<<<<<<< HEAD
      console.log('Authentication failed in API request');
=======
      console.log('🔄 Auth failed in API request');
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
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
<<<<<<< HEAD

=======
>>>>>>> 086d4188abcbc865749134f9e2ff1e69585ba240
