import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(queryKey[0] as string, {
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
  const token = sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Handle authentication errors - but don't auto-logout to prevent short-time logouts
    if (response.status === 401 || response.status === 403) {
      console.log('Authentication failed in API request - keeping user logged in to prevent auto-logout');
      
      // Don't store any failure flags to prevent automatic form switching and pre-filling
      return;
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