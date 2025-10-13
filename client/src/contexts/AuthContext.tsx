import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { queryClient } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://bjj-jits-journal.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  role?: string;
  createdAt: string;
  supabaseId?: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: any;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

async function getUserFromSupabaseId(supabaseId: string, email: string, metadata: any): Promise<User | null> {
  try {
    // Get user from server via supabaseId using the correct endpoint
    const response = await fetch(`${API_BASE_URL}/api/user/by-supabase-id/${supabaseId}`);
    
    if (response.ok) {
      const data = await response.json();
      // The endpoint returns the user object directly, not wrapped
      return {
        id: data.id.toString(),
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        subscriptionStatus: data.subscription_status || 'free',
        subscriptionPlan: data.subscription_plan,
        role: data.role || 'user',
        createdAt: data.created_at,
        supabaseId: data.supabase_uid,
      };
    }
    
    // If user not found, they need to complete signup process
    console.log('User not found in database for supabaseId:', supabaseId);
    return null;
  } catch (error) {
    console.error('Error in getUserFromSupabaseId:', error);
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedSupabaseIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata);
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = session.user.id;
            setIsLoading(false);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth().catch((error) => {
      console.error('Session check failed:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        if (event === 'TOKEN_REFRESHED' || loadedSupabaseIdRef.current === session.user.id) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        try {
          const userData = await getUserFromSupabaseId(session.user.id, session.user.email || '', session.user.user_metadata);
          if (userData) {
            queryClient.clear();
            setUser(userData);
            loadedSupabaseIdRef.current = session.user.id;
            setIsLoading(false);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setSupabaseUser(null);
            setIsLoading(false);
          }
        } catch (error) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        loadedSupabaseIdRef.current = null;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
