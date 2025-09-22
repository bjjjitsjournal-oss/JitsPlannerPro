import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, rememberMe?: boolean) => void;
  logout: () => void;
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

// Helper functions for token management with domain isolation
const getAuthToken = () => {
  return sessionStorage.getItem('bjj_auth_token') || localStorage.getItem('bjj_auth_token');
};

const setAuthToken = (token: string, remember: boolean = true) => {
  console.log('Setting auth token, remember:', remember);
  // Always use localStorage for mobile app experience to prevent idle logouts
  localStorage.setItem('bjj_auth_token', token);
  sessionStorage.removeItem('bjj_auth_token'); // Clear session storage
  console.log('Token saved to localStorage for persistence');
};

const clearAuthToken = () => {
  localStorage.removeItem('bjj_auth_token');
  sessionStorage.removeItem('bjj_auth_token');
  // Also clear legacy token for migration
  localStorage.removeItem('token');
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by checking localStorage
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        console.log('Checking auth on mount, token found:', !!token);
        if (token) {
          // Verify token and get user data
          const response = await apiRequest('GET', '/api/auth/me');
          if (response) {
            const userData = await response.json();
            console.log('Auth check successful, user:', userData.email);
            setUser(userData);
          }
        } else {
          console.log('No token found during auth check');
        }
      } catch (error: any) {
        console.log('Auth check failed:', error);
        // If it's a 401 error, the token is invalid or user doesn't exist
        if (error.message && error.message.includes('401')) {
          console.log('Authentication failed - clearing tokens');
          
          // Simply clear tokens without memory reset detection to prevent auto-switching to register
          clearAuthToken();
          setUser(null);
          // Don't set auth_failure flags to prevent automatic form switching
        } else {
          // Other errors might be network issues, don't clear tokens immediately
          console.log('Network or other error during auth check, keeping tokens');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (userData: User, rememberMe: boolean = true) => {
    console.log('Login called with rememberMe:', rememberMe);
    setUser(userData);
    
    // Store auth token if provided
    if ((userData as any).token) {
      setAuthToken((userData as any).token, rememberMe);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthToken();
    // Force page refresh to clear any cached state
    window.location.reload();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};