// In-memory auth token broker for Capacitor
let authToken: string | null = null;
let tokenResolvers: Array<(token: string) => void> = [];

export function setAuthToken(token: string) {
  authToken = token;
  console.log('✅ Auth token set in memory store');
  
  // Resolve any pending waiters
  tokenResolvers.forEach(resolve => resolve(token));
  tokenResolvers = [];
}

export function clearAuthToken() {
  authToken = null;
  console.log('✅ Auth token cleared from memory store');
}

export function getAuthToken(): string | null {
  return authToken;
}

export function waitForAuthToken(timeoutMs: number = 5000): Promise<string | null> {
  // If token already available, return immediately
  if (authToken) {
    console.log('✅ Auth token already available');
    return Promise.resolve(authToken);
  }
  
  // Otherwise, wait for it with timeout
  console.log('⏳ Waiting for auth token...');
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('⚠️ Auth token wait timeout');
      resolve(null);
    }, timeoutMs);
    
    tokenResolvers.push((token) => {
      clearTimeout(timeout);
      resolve(token);
    });
  });
}
