import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'wouter';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://jitsjournal-backend.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const { setSignupInProgress } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log('Login attempt with:', { email: data.email, hasPassword: !!data.password });
      setErrorMessage(''); // Clear any previous errors
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      console.log('Login successful:', authData.user?.email);
      return authData;
    },
    onSuccess: (data) => {
      setErrorMessage('');
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // AuthContext will automatically detect the session change and load user data
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      let description = "Please check your credentials and try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        description = "Invalid email or password. If you haven't signed up yet, please create an account.";
      } else if (error.message?.includes('Email not confirmed')) {
        description = "Please check your email and confirm your account before logging in.";
      }
      
      setErrorMessage(description);
      
      toast({
        title: "Login failed",
        description: description,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Set flag to prevent AuthContext from interfering during signup
      setSignupInProgress(true);
      
      try {
        console.log('Signup attempt for:', data.email);
        
        // STEP 1: Create Supabase auth account
        console.log('Step 1: Creating Supabase auth account...');
        
        // Use production URL for email verification redirect (works on mobile)
        const redirectUrl = Capacitor.isNativePlatform()
          ? 'https://jitsjournal-backend.onrender.com/'
          : `${window.location.origin}/`;
        
        const { data: authData, error: signupError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (signupError || !authData.user) {
          console.error('Supabase signup error:', signupError);
          throw signupError || new Error('Failed to create auth account');
        }
        
        console.log('✅ Supabase account created:', authData.user.id);
        
        // STEP 2: Immediately sign out to prevent any issues
        await supabase.auth.signOut();
        console.log('✅ Signed out to prevent race condition');
        
        // STEP 3: Create PostgreSQL user profile with Supabase ID
        console.log('Step 2: Creating user profile in PostgreSQL database...');
        console.log('API URL:', `${API_BASE_URL}/api/auth/register`);
        
        // Add timeout to detect network issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        let profileResponse;
        try {
          profileResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              supabaseId: authData.user.id,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Network timeout. Please check your internet connection and try again.');
          }
          throw new Error(`Network error: ${fetchError.message || 'Could not connect to server'}`);
        }

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          // Note: If profile creation fails, the Supabase auth account remains.
          // Backend will handle cleanup if user tries to register again.
          throw new Error(errorData.message || 'Failed to create user profile');
        }

        const newUser = await profileResponse.json();
        console.log('✅ PostgreSQL profile created:', newUser.id);
        
        // STEP 4: Clear the flag before signing in so AuthContext can process the login
        setSignupInProgress(false);
        
        // STEP 5: Now manually sign in - this will trigger AuthContext with complete user data
        console.log('Step 3: Signing in...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (loginError) {
          console.error('Auto-login error:', loginError);
          throw new Error('Account created but login failed. Please try logging in manually.');
        }
        
        console.log('✅ Auto-login successful');
        return loginData;
      } catch (error) {
        // Make sure to clear the flag on error
        setSignupInProgress(false);
        throw error;
      }
    },
    onSuccess: (data) => {
      let description = "Welcome to Jits Journal. Your account has been created successfully.";
      
      // Check if email confirmation is required
      if (data.user && !data.user.confirmed_at) {
        description = "Please check your email to confirm your account before logging in.";
      }
      
      toast({
        title: "Account created!",
        description: description,
        duration: data.user?.confirmed_at ? 3000 : 6000,
      });
      // AuthContext will automatically detect the session change and load user data
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', error);
      const description = error.message || "Please try again.";
      setErrorMessage(description);
      toast({
        title: "Registration failed",
        description: description,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const handleLogin = (data: LoginFormData) => {
    console.log('Login attempt with:', { email: data.email, hasPassword: !!data.password });
    setErrorMessage('');
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormData) => {
    setErrorMessage('');
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">🥋</span>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Join Jits Journal'}
            </CardTitle>
            <CardDescription className="text-white/80">
              {isLogin 
                ? 'Sign in to continue your BJJ journey' 
                : 'Start tracking your BJJ progress today'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-300 text-sm">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-300 text-sm">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                {errorMessage && (
                  <div className="bg-red-600 border-2 border-red-400 rounded-lg p-4 shadow-lg">
                    <p className="text-white text-sm font-bold">⚠️ {errorMessage}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white font-medium"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn size={16} />
                      Sign In
                    </div>
                  )}
                </Button>
                
                <div className="text-center">
                  <Link href="/forgot-password">
                    <button className="text-white/80 hover:text-white text-sm underline">
                      Forgot your password?
                    </button>
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      {...registerForm.register('firstName')}
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-red-300 text-sm">{registerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      {...registerForm.register('lastName')}
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-red-300 text-sm">{registerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-300 text-sm">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                      {...registerForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-300 text-sm">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                {errorMessage && (
                  <div className="bg-red-600 border-2 border-red-400 rounded-lg p-4 shadow-lg">
                    <p className="text-white text-sm font-bold">⚠️ {errorMessage}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white font-medium"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus size={16} />
                      Create Account
                    </div>
                  )}
                </Button>
              </form>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage('');
                }}
                className="text-white/80 hover:text-white text-sm underline"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
