import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Notes from './pages/Notes';
import Videos from './pages/Videos';
import Settings from './pages/Settings';
import Belts from './pages/belts';
import Social from './pages/Social';
import MyVideos from './pages/MyVideos';
import Drawing from './pages/Drawing';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Subscribe from './pages/Subscribe';
import SubscribeSuccess from './pages/SubscribeSuccess';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GamePlans from './pages/GamePlans';
import BottomNav from './components/BottomNav';

import { Toaster } from './components/ui/toaster';
import EnvCheck from './components/EnvCheck';

function AuthenticatedApp() {
  // Automatically scroll to top when navigating between pages
  useScrollToTop();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <EnvCheck />
      <main className="pb-20">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/classes" component={Classes} />
          <Route path="/notes" component={Notes} />
          <Route path="/videos" component={Videos} />
          <Route path="/game-plans" component={GamePlans} />
          <Route path="/settings" component={Settings} />
          <Route path="/belts" component={Belts} />
          <Route path="/social" component={Social} />
          <Route path="/my-videos" component={MyVideos} />
          <Route path="/drawing" component={Drawing} />
          <Route path="/contact" component={Contact} />
          <Route path="/admin" component={Admin} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscribe/success" component={SubscribeSuccess} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route>
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Page Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400">The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
      <BottomNav />

      
      <Toaster />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, loadingMessage, login } = useAuth();

  // Check if user is trying to access public routes (password reset, forgot password)
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === '/reset-password' || currentPath === '/forgot-password';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-600 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
          <p className="text-white/70 text-sm mt-2">This may take a moment if the server is starting up...</p>
        </div>
      </div>
    );
  }

  // Allow public routes even when not authenticated
  if (isPublicRoute) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
        </Switch>
        <Toaster />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={login} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}