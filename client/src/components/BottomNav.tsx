import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';

export default function BottomNav() {
  const [location] = useLocation();
  const [bottomInset, setBottomInset] = useState(0);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/classes', label: 'Classes', icon: '📅' },
    { path: '/notes', label: 'Notes', icon: '📝' },
    { path: '/game-plans', label: 'Plans', icon: '🎯' },
    { path: '/social', label: 'Social', icon: '👥' },
  ];

  useEffect(() => {
    const calculateBottomInset = () => {
      // Calculate bottom occlusion only (not top UI like URL bars)
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        // Bottom inset = total height - (viewport height + top offset)
        // This isolates bottom system UI like navigation bars
        const bottomInset = window.innerHeight - (viewport.height + viewport.offsetTop);
        
        // Clamp to reasonable range: 0-80px (typical Android nav bar is ~48px)
        const clampedInset = Math.max(0, Math.min(bottomInset, 80));
        
        // Only apply if meaningful (>= 16px), otherwise use CSS env() fallback
        setBottomInset(clampedInset >= 16 ? clampedInset : 0);
      }
    };

    // Calculate on mount and viewport changes
    calculateBottomInset();
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', calculateBottomInset);
      window.visualViewport.addEventListener('scroll', calculateBottomInset);
    }

    window.addEventListener('resize', calculateBottomInset);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', calculateBottomInset);
        window.visualViewport.removeEventListener('scroll', calculateBottomInset);
      }
      window.removeEventListener('resize', calculateBottomInset);
    };
  }, []);

  return (
    <nav 
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-700 border-t border-border shadow-lg z-50"
      style={{ 
        paddingBottom: `max(${bottomInset}px, env(safe-area-inset-bottom), 0.25rem)` 
      }}
    >
      <div className="flex justify-around py-1">
        {navItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-3 transition-all duration-200 ${
              location === item.path
                ? 'text-yellow-300 font-bold'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}