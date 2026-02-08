import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User } from 'lucide-react';
import { type Belt } from '@shared/schema';

export default function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();

  // Fetch classes and belt data for stats
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: currentBelt } = useQuery<Belt>({
    queryKey: ['/api/belts/current'],
  });

  // Calculate this week's classes
  const today = new Date();
  const startOfWeek = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay() + 1);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  const classesThisWeek = Array.isArray(classes) ? classes.filter((cls: any) => {
    const classDate = new Date(cls.date);
    return classDate >= startOfWeek;
  }).length : 0;

  const totalClasses = Array.isArray(classes) ? classes.length : 0;
  
  const beltDisplay = currentBelt?.belt ? `${currentBelt.belt.charAt(0).toUpperCase() + currentBelt.belt.slice(1)} Belt` : 'No belt data';

  const handleLogout = () => {
    logout();
    setShowProfile(false);
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg relative z-[200]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
            JJ
          </div>
          <div>
            <h1 className="text-xl font-bold">BJJ Jits Journal</h1>
            <p className="text-sm opacity-90">Your BJJ Training Companion</p>
          </div>
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110"
          >
            <span className="text-sm">👤</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 bg-card dark:bg-card rounded-lg shadow-lg border border-border w-64 py-2 z-[100]">
              <div className="px-4 py-3 border-b border-border">
                <div className="font-semibold text-card-foreground">Training Stats</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <div>Classes this week: {classesThisWeek}</div>
                  <div>Total classes: {totalClasses}</div>
                  <div>Current belt: {beltDisplay}</div>
                </div>
              </div>
              
              <div className="py-1">
                <a
                  href="/settings"
                  className="block px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  Settings
                </a>
                <a
                  href="/classes"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  Log Class
                </a>
                <a
                  href="/notes"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  New Note
                </a>
                <button
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showProfile && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setShowProfile(false)}
        />
      )}
    </header>
  );
}