import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Client Initialization');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('📱 Platform:', Capacitor.getPlatform());

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const capacitorStorage: SupportedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

const getStorage = (): SupportedStorage => {
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Using Capacitor Preferences for Supabase session storage');
    return capacitorStorage;
  }
  console.log('💻 Using localStorage for Supabase session storage');
  return window.localStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: getStorage(),
    flowType: 'pkce',
  },
});
