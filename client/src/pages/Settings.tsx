import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { isPremiumUser, getSubscriptionPlan, FREE_TIER_LIMITS } from '../utils/subscription';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Building2, Users, Trash2, Check, Infinity, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const [showSubscription, setShowSubscription] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [gymCode, setGymCode] = useState('');
  const appVersion = '1.0.34'; // Will be auto-updated by build process
  const { darkMode, setDarkMode } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check if user has premium access
  const isPremium = isPremiumUser(user?.email, user?.subscriptionStatus, (user as any)?.subscriptionExpiresAt);
  const subscriptionPlan = getSubscriptionPlan(user?.email, user?.subscriptionStatus, (user as any)?.subscriptionExpiresAt);

  // Load settings from localStorage on component mount with defaults
  useEffect(() => {
    // Default to true for auto-sync if not set
    const savedAutoSync = localStorage.getItem('bjj_autosync') !== 'false';
    const savedNotifications = localStorage.getItem('bjj_notifications') !== 'false';
    
    // Set defaults on first load
    if (!localStorage.getItem('bjj_autosync')) {
      localStorage.setItem('bjj_autosync', 'true');
    }
    
    setAutoSync(savedAutoSync);
    setNotifications(savedNotifications);
  }, []);

  // Toggle functions
  const toggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('bjj_autosync', newValue.toString());
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('bjj_notifications', newValue.toString());
  };

  // Fetch user's actual stats and classes/notes count
  const { data: userStats } = useQuery({
    queryKey: ['/api/user-stats'],
  });

  const { data: userClasses } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: userNotes } = useQuery({
    queryKey: ['/api/notes'],
  });

  // Fetch user's gym membership
  const { data: gymMembership } = useQuery<{ id: number; name: string; code: string } | null>({
    queryKey: ['/api/my-gym'],
  });

  // Join gym mutation
  const joinGymMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('POST', '/api/gyms/join', { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-gym'] });
      toast({
        title: "Success!",
        description: "You've joined the gym!",
      });
      setGymCode('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join gym",
        variant: "destructive",
      });
    }
  });

  const handleJoinGym = () => {
    if (!gymCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gym code",
        variant: "destructive",
      });
      return;
    }
    joinGymMutation.mutate(gymCode.trim().toUpperCase());
  };

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/user/delete-account');
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-6 max-w-md mx-auto dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>

      {/* App Store Subscription Info Modal */}
      {showSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Upgrade to Premium</h3>
              <button
                onClick={() => setShowSubscription(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                âœ•
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-bold">Premium Plan</h4>
                  <p className="text-sm opacity-90">Unlock unlimited potential</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-green-500">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited class logging</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited notes with sharing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">Advanced video library</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">Cloud backup & sync</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500">âœ“</span>
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 dark:text-white mb-2">How to Subscribe:</h5>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>1. Visit your device's app store</li>
                  <li>2. Search for "Jits Journal"</li>
                  <li>3. Select premium subscription</li>
                  <li>4. Complete purchase through app store</li>
                </ol>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setShowSubscription(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                >
                  Got it!
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Subscriptions are managed through your app store
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Plan</span>
            <span className={`text-sm px-2 py-1 rounded ${
              isPremium 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {subscriptionPlan}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Classes Logged</span>
            <span className="text-gray-600 dark:text-gray-400">{Array.isArray(userClasses) ? userClasses.length : 0} classes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Notes Created</span>
            <span className="text-gray-600 dark:text-gray-400">{Array.isArray(userNotes) ? userNotes.length : 0} notes</span>
          </div>
          {!isPremium && (
            <button 
              onClick={() => setLocation('/subscribe')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>

      {/* Gym Community */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Gym Community
        </h3>
        <div className="space-y-4">
          {gymMembership ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800 dark:text-white">{gymMembership.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code: <span className="font-mono font-bold">{gymMembership.code}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                You're a member of this gym community
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Join a gym community to share notes with your training partners
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter gym code..."
                  value={gymCode}
                  onChange={(e) => setGymCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinGym()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-gym-code"
                />
                <button
                  onClick={handleJoinGym}
                  disabled={joinGymMutation.isPending || !gymCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-join-gym"
                >
                  {joinGymMutation.isPending ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          )}
          
          {user?.role === 'admin' && (
            <button 
              onClick={() => setLocation('/admin')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              data-testid="button-admin-panel"
            >
              <Building2 className="w-4 h-4" />
              Manage Gyms (Admin)
            </button>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">App Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Notifications</span>
            <button 
              onClick={toggleNotifications}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                notifications ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Auto-sync</span>
            <button 
              onClick={toggleAutoSync}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                autoSync ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                autoSync ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
            <button 
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                darkMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                darkMode ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </button>
          </div>
        </div>
      </div>


      {/* Subscription Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Subscription</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Current Plan</span>
            <span className={`text-sm px-2 py-1 rounded ${
              isPremium 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {subscriptionPlan}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Classes Limit</span>
            <span className="text-gray-600 dark:text-gray-400">
              {Array.isArray(userClasses) ? userClasses.length : 0} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.classes}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Notes Limit</span>
            <span className="text-gray-600 dark:text-gray-400">
              {Array.isArray(userNotes) ? userNotes.length : 0} / {isPremium ? "Unlimited" : FREE_TIER_LIMITS.notes}
            </span>
          </div>
          {!isPremium && (
            <>
              <button 
                onClick={() => setLocation('/subscribe')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                View Plans & Subscribe
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Secure payments via Stripe
              </div>
            </>
          )}
          {isPremium && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Premium Active</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                You have unlimited access to all features
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Features */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Premium Features</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Unlimited class logging</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Unlimited notes with sharing</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Advanced video library</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Cloud backup & sync</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Advanced progress analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Priority support</span>
          </div>
        </div>
      </div>

      {/* Legal & Privacy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Legal & Privacy</h3>
        <div className="space-y-3">
          <Link href="/privacy"><button data-testid="button-privacy-policy" className="w-full text-left text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white py-2 flex items-center justify-between">
            <span>Privacy Policy</span>
            <span className="text-gray-400">â†’</span>
          </button></Link>
          <Link href="/terms"><button data-testid="button-terms-of-service" className="w-full text-left text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white py-2 flex items-center justify-between">
            <span>Terms of Service</span>
            <span className="text-gray-400">â†’</span>
          </button></Link>
        </div>
      </div>


      {/* Account Deletion */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Danger Zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              data-testid="button-delete-account"
              className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account & All Data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white dark:bg-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>All training classes and sessions</li>
                  <li>All notes and technique breakdowns</li>
                  <li>Belt progression history</li>
                  <li>Competition game plans</li>
                  <li>Gym memberships</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Yes, delete everything'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* Support & Feedback */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Support & Feedback</h3>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/contact'}
            className="w-full text-left text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white py-2 flex items-center justify-between"
          >
            <span>Contact Support</span>
            <span className="text-gray-400">â†’</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">App Info</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Version</span>
            <span>{appVersion}</span>
          </div>
          <div className="flex justify-between">
            <span>Build</span>
            <span>2025.01.05</span>
          </div>
          <div className="flex justify-between">
            <span>Developer</span>
            <span>Jits Journal Team</span>
          </div>
        </div>
      </div>
    </div>
  );
}
