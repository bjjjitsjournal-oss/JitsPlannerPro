import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import WeeklyGoals from '../components/WeeklyGoals';
import ProfileDropdown from '../components/ProfileDropdown';
import { type Belt } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { beltsQueries, classesQueries } from '@/lib/supabaseQueries';

// BJJ Quotes Component
const BJJQuoteBanner = () => {
  const bjjQuotes = [
    {
      quote: "The ground is my ocean, I'm the shark, and most people don't even know how to swim",
      author: "Rickson Gracie"
    },
    {
      quote: "A belt only covers two inches of your ass. You have to cover the rest",
      author: "Royce Gracie"
    },
    {
      quote: "Always assume that your opponent is going to be bigger, stronger and faster than you",
      author: "Helio Gracie"
    },
    {
      quote: "If you think, you are late. If you are late, you use strength. If you use strength, you tire. And if you tire, you die",
      author: "Saulo Ribeiro"
    }
  ];

  const [currentQuote] = useState(() => {
    return bjjQuotes[Math.floor(Math.random() * bjjQuotes.length)];
  });

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold mb-3 leading-tight">
        "{currentQuote.quote}"
      </h2>
      <p className="text-blue-100 text-sm">- {currentQuote.author}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch current belt
  const { data: currentBelt, refetch: refetchBelt } = useQuery<Belt>({
    queryKey: ['belts', 'current', user?.id],
    queryFn: () => beltsQueries.getCurrent(user!.id),
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  console.log('Current belt data:', currentBelt);

  // Fetch user's classes for statistics  
  const { data: classes = [], refetch: refetchClasses } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: () => classesQueries.getAll(user!.id),
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Force refresh data when component mounts
  React.useEffect(() => {
    refetchBelt();
    refetchClasses();
  }, [refetchBelt, refetchClasses]);
  


  // Calculate statistics from real data  
  const today = new Date();
  const startOfWeek = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay() + 1);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  const classesThisWeek = Array.isArray(classes) ? classes.filter((cls: any) => {
    const classDate = new Date(cls.date);
    return classDate >= startOfWeek;
  }).length : 0;

  const totalClasses = Array.isArray(classes) ? classes.length : 0;
  
  const totalMinutes = Array.isArray(classes) ? classes.reduce((total: number, cls: any) => {
    return total + (cls.duration || 0);
  }, 0) : 0;

  const stats = {
    classesThisWeek,
    totalClasses,
    totalMinutes
  };

  // Belt visual component (simplified version from belts page)
  const BeltVisual = ({ belt, stripes }: { belt: string; stripes: number }) => {
    const getBeltColor = (beltColor: string) => {
      const colors = {
        white: "bg-white border-2 border-gray-400",
        blue: "bg-blue-600",
        purple: "bg-purple-600", 
        brown: "bg-amber-800",
        black: "bg-black"
      };
      return colors[beltColor as keyof typeof colors] || "bg-gray-400";
    };

    const getBeltTipColor = (beltColor: string) => {
      const colors = {
        white: "bg-gray-800",
        blue: "bg-blue-800",
        purple: "bg-purple-800", 
        brown: "bg-amber-900",
        black: "bg-gray-900"
      };
      return colors[beltColor as keyof typeof colors] || "bg-gray-600";
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`${getBeltColor(belt)} w-20 h-5 rounded-sm shadow-md relative flex items-center justify-center`}>
          <div className={`${getBeltTipColor(belt)} absolute left-0 top-0 bottom-0 w-1.5 rounded-l-sm`}></div>
          <span className={`${belt === 'white' ? 'text-black' : 'text-white'} font-bold text-xs`}>BJJ</span>
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-0.5">
            {Array.from({ length: stripes }).map((_, i) => (
              <div key={i} className="w-1 h-3 bg-gray-300 rounded-sm"></div>
            ))}
          </div>
        </div>
        <div className="text-xs font-medium capitalize text-gray-800 dark:text-white">
          {belt} Belt {stripes > 0 && `(${stripes} stripe${stripes !== 1 ? 's' : ''})`}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Dropdown */}
      <div className="flex justify-end mb-4">
        <ProfileDropdown />
      </div>
      
      {/* BJJ Quote Banner */}
      <div className="mb-8 relative overflow-hidden rounded-3xl z-0 glow-pulse">
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-8 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-8 translate-x-8 bounce-fun"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/30 rounded-full translate-y-8 -translate-x-8 bounce-fun" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-300/20 rounded-full bounce-fun" style={{animationDelay: '0.5s'}}></div>
          <div className="relative z-10">
            <BJJQuoteBanner />
          </div>
        </div>
      </div>

      {/* Weekly Goals Widget */}
      <div className="mb-8">
        <WeeklyGoals />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Quick Actions ⚡
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/classes"
            className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200 block"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-bold text-lg mb-1">Log Class</div>
            <div className="text-sm opacity-90">Record your training</div>
          </Link>
          <Link
            to="/notes"
            className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200 block"
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="font-bold text-lg mb-1">New Note</div>
            <div className="text-sm opacity-90">Save techniques</div>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200">
          <div className="text-3xl font-bold mb-2">{stats.classesThisWeek}</div>
          <div className="text-sm opacity-90">Classes This Week</div>
          <div className="mt-2 text-2xl">🔥</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200">
          <div className="text-3xl font-bold mb-2">{stats.totalClasses}</div>
          <div className="text-sm opacity-90">Total Classes</div>
          <div className="mt-2 text-2xl">💪</div>
        </div>
        <Link 
          to="/belts"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200 block"
        >
          <div className="mb-2">
            {currentBelt ? (
              <BeltVisual belt={currentBelt.belt} stripes={currentBelt.stripes} />
            ) : (
              <div className="text-sm text-purple-100">No belt recorded</div>
            )}
          </div>
          <div className="text-sm opacity-90">Current Belt</div>
          <div className="mt-2 text-2xl">🥋</div>
        </Link>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover-scale transition-all duration-200">
          <div className="text-3xl font-bold mb-2">{stats.totalMinutes}min</div>
          <div className="text-sm opacity-90">Total Minutes</div>
          <div className="mt-2 text-2xl">⏱️</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {Array.isArray(classes) && classes.length > 0 ? (
            classes.slice(0, 3).map((cls: any) => (
              <div key={cls.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">📅</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{cls.classType} Class</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(cls.date).toLocaleDateString()} • {cls.duration}min
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p>No recent activity</p>
              <p className="text-sm">Start by logging your first class!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}