import { Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import { lazy, Suspense, useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Notes from './pages/Notes';
import Auth from './pages/Auth';
import BottomNav from './components/BottomNav';
import { Toaster } from './components/ui/toaster';
import EnvCheck from './components/EnvCheck';

const Videos = lazy(() => import('./pages/Videos'));
const Settings = lazy(() => import('./pages/Settings'));
const Belts = lazy(() => import('./pages/belts'));
const Social = lazy(() => import('./pages/Social'));
const MyVideos = lazy(() => import('./pages/MyVideos'));
const Drawing = lazy(() => import('./pages/Drawing'));
const Contact = lazy(() => import('./pages/Contact'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Subscribe = lazy(() => import('./pages/Subscribe'));
const SubscribeSuccess = lazy(() => import('./pages/SubscribeSuccess'));
const Admin = lazy(() => import('./pages/Admin'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const GamePlans = lazy(() => import('./pages/GamePlans'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function usePrefetchData() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const prefetchKeys = [
      '/api/notes',
      '/api/notes/shared',
      '/api/classes',
    ];
    prefetchKeys.forEach((key) => {
      queryClient.prefetchQuery({ queryKey: [key] });
    });
  }, [user]);
}

function AuthenticatedApp() {
  useScrollToTop();
  usePrefetchData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <EnvCheck />
      <main className="pb-20">
        <Suspense fallback={<PageLoader />}>
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
              <RedirectToHome />
            </Route>
          </Switch>
        </Suspense>
      </main>
      <BottomNav />

      
      <Toaster />
    </div>
  );
}

function RedirectToHome() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate('/'); }, []);
  return null;
}

function Router() {
  const { isAuthenticated, isLoading, loadingMessage, login } = useAuth();
  const [location] = useLocation();

  const isPublicRoute = location === '/reset-password' || location === '/forgot-password';

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

  if (isPublicRoute) {
    return (
      <div className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
          </Switch>
        </Suspense>
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
