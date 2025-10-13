import { QueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { getAccessToken, refreshSession } from './sessionProvider';

// Get API base URL - use Render for mobile app, env var for web, or relative path
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const token = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('📱 Query with Authorization header');
        } else {
          console.warn('⚠️ No token available for query');
        }
        
        const url = `${API_BASE_URL}${queryKey[0] as string}`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('🔄 Auth failed - attempting token refresh');
            const newToken = await refreshSession();
            
            if (newToken) {
              // Retry with new token
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, { headers });
              if (retryResponse.ok) {
                return retryResponse.json();
              }
            }
            
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
  const token = await getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('📱 API request with Authorization header');
  } else {
    console.warn('⚠️ No token available for API request');
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
      console.log('🔄 Auth failed in API request - attempting token refresh');
      const newToken = await refreshSession();
      
      if (newToken) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        options.headers = headers;
        const retryResponse = await fetch(fullUrl, options);
        if (retryResponse.ok) {
          return retryResponse;
        }
      }
      
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
