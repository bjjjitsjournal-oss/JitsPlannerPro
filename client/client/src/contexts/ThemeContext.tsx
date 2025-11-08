import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(true); // Default to dark mode

  useEffect(() => {
    // Check localStorage for saved preference, default to dark mode
    const savedDarkMode = localStorage.getItem('bjj_darkmode') !== 'false';
    
    // Set default if not already set
    if (!localStorage.getItem('bjj_darkmode')) {
      localStorage.setItem('bjj_darkmode', 'true');
    }
    
    setDarkModeState(savedDarkMode);
    applyTheme(savedDarkMode);
  }, []);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
    localStorage.setItem('bjj_darkmode', enabled.toString());
    applyTheme(enabled);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}