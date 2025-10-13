import { supabase } from './supabase';

// In-memory session cache (NO localStorage)
let cachedAccessToken: string | null = null;
let sessionReady = false;
let sessionPromise: Promise<void> | null = null;

/**
 * Ensures Supabase session is loaded before any API calls
 * This prevents race conditions on mobile where queryClient fires before auth is ready
 */
export async function ensureSession(retries = 3): Promise<void> {
  // If already ready, return immediately
  if (sessionReady && cachedAccessToken) {
    return;
  }

  // If already loading, wait for that promise
  if (sessionPromise) {
    return sessionPromise;
  }

  // Start loading session
  sessionPromise = (async () => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔐 Loading Supabase session (attempt ${i + 1}/${retries})...`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          throw error;
        }

        if (session?.access_token) {
          cachedAccessToken = session.access_token;
          sessionReady = true;
          console.log('✅ Supabase session ready with token');
          return;
        } else {
          console.log('⚠️ No session found');
          sessionReady = true; // Mark ready even if no session (user not logged in)
          return;
        }
      } catch (error) {
        console.error(`Session load attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          sessionReady = true; // Give up after retries
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  })();

  return sessionPromise;
}

/**
 * Gets the current access token from in-memory cache
 * Falls back to fresh session check if cache is empty
 */
export async function getAccessToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // Otherwise, ensure session is loaded
  await ensureSession();
  return cachedAccessToken;
}

/**
 * Updates the cached token when Supabase session changes
 */
export function updateCachedToken(token: string | null): void {
  cachedAccessToken = token;
  if (token) {
    console.log('✅ Token updated in memory cache');
  } else {
    console.log('✅ Token cleared from memory cache');
  }
}

/**
 * Refreshes the Supabase session (useful for 401 handling)
 */
export async function refreshSession(): Promise<string | null> {
  try {
    console.log('🔄 Refreshing Supabase session...');
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh failed:', error);
      cachedAccessToken = null;
      return null;
    }

    if (session?.access_token) {
      cachedAccessToken = session.access_token;
      console.log('✅ Session refreshed with new token');
      return session.access_token;
    }

    return null;
  } catch (error) {
    console.error('Session refresh error:', error);
    cachedAccessToken = null;
    return null;
  }
}
