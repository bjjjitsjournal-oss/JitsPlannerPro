import { supabase } from './supabase';

let cachedAccessToken: string | null = null;
let sessionReady = false;
let sessionPromise: Promise<void> | null = null;

export async function ensureSession(retries = 3): Promise<void> {
  if (sessionReady && cachedAccessToken) {
    return;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Loading session (attempt ${i + 1}/${retries})`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.access_token) {
          cachedAccessToken = session.access_token;
          sessionReady = true;
          console.log('Session ready');
          return;
        } else {
          sessionReady = true;
          return;
        }
      } catch (error) {
        console.error(`Session load attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          sessionReady = true;
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  })();

  return sessionPromise;
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  await ensureSession();
  return cachedAccessToken;
}

export function updateCachedToken(token: string | null): void {
  cachedAccessToken = token;
  if (token) {
    console.log('Token cached');
  } else {
    console.log('Token cleared');
  }
}

export async function refreshSession(): Promise<string | null> {
  try {
    console.log('Refreshing session');
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      cachedAccessToken = null;
      return null;
    }

    if (session?.access_token) {
      cachedAccessToken = session.access_token;
      console.log('Session refreshed');
      return session.access_token;
    }

    return null;
  } catch (error) {
    console.error('Session refresh error:', error);
    cachedAccessToken = null;
    return null;
  }
}
