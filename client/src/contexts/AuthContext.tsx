import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  authToken: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = 'http://localhost:5000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authToken, setAuthTokenState] = useState<string | null>(null);

  const setAuthToken = (token: string, rememberMe: boolean) => {
    setAuthTokenState(token);
    if (rememberMe) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      console.log('Calling API URL:', `${BACKEND_URL}/api/auth/login`);
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();

      if (userData && userData.token) {
        setAuthToken(userData.token, rememberMe);
      } else {
        throw new Error('Token missing in login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthTokenState(null);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};