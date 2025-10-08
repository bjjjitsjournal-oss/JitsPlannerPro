import React from 'react';
import { useLocation, Link } from 'wouter';

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/classes', label: 'Classes', icon: '📅' },
    { path: '/notes', label: 'Notes', icon: '📝' },
    { path: '/game-plans', label: 'Plans', icon: '🎯' },
    { path: '/videos', label: 'Videos', icon: '📺' },
    { path: '/social', label: 'Social', icon: '👥' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-700 border-t border-border shadow-lg z-50">
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