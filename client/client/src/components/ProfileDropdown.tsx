import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { classesQueries, beltsQueries } from '../lib/supabaseQueries';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Get total classes count
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await classesQueries.getAll(user.id);
    },
    enabled: !!user?.id,
  });

  // Get current belt
  const { data: currentBelt } = useQuery({
    queryKey: ['current-belt', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log('ProfileDropdown - Fetching belt for user ID:', user.id);
      const belt = await beltsQueries.getCurrent(user.id);
      console.log('ProfileDropdown - Belt data received:', belt);
      return belt;
    },
    enabled: !!user?.id,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No promotions yet';
    return new Date(dateString).toLocaleDateString();
  };

  const getBeltDisplay = () => {
    if (!currentBelt) return 'White Belt';
    const { belt, stripes } = currentBelt;
    const beltName = belt.charAt(0).toUpperCase() + belt.slice(1);
    const stripeText = stripes > 0 ? ` (${stripes} stripe${stripes > 1 ? 's' : ''})` : '';
    return `${beltName} Belt${stripeText}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName || 'User'}
          </p>
          <p className="text-xs text-gray-500">
            {getBeltDisplay()}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* User Profile Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-sm font-medium text-blue-600">
                  {getBeltDisplay()}
                </p>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Progress</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Total Classes</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {classes.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Last Promotion</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(currentBelt?.promotion_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link href="/settings">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </Link>
            
            <Link href="/belts">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>Belt Progress</span>
              </button>
            </Link>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}