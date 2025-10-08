import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'wouter';

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
  const { toast } = useToast();

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
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Force page reload to clear browser cache and load fresh session
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      let description = "Please check your credentials and try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        description = "Invalid email or password. If you haven't signed up yet, please create an account.";
      } else if (error.message?.includes('Email not confirmed')) {
        description = "Please check your email and confirm your account before logging in.";
      }
      
      toast({
        title: "Login failed",
        description: description,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      console.log('Signup attempt for:', data.email);
      
      // Sign up with Supabase Auth - disable email confirmation
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
          emailRedirectTo: `${window.location.origin}/`,
          // Skip email confirmation
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }
      
      console.log('Supabase signup successful:', {
        userId: authData.user?.id,
        email: authData.user?.email,
        confirmed: authData.user?.confirmed_at,
      });
      
      // Create or update user profile in database
      if (authData.user) {
        console.log('Creating/updating user profile in database...');
        
        // Check if user profile already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', authData.user.email)
          .single();

        let userId: number;

        if (existingUser) {
          // Update existing profile with supabase_uid
          console.log('Existing user found, updating profile with supabase_uid...');
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              first_name: data.firstName,
              last_name: data.lastName,
              supabase_uid: authData.user.id, // CRITICAL: Link Supabase Auth to user
            })
            .eq('email', authData.user.email)
            .select()
            .single();

          if (updateError) {
            console.error('Profile update error:', updateError);
            throw new Error(`Failed to update profile: ${updateError.message}`);
          }
          
          userId = updatedUser.id;
          console.log('User profile updated with supabase_uid:', userId);
        } else {
          // Create new profile with supabase_uid
          console.log('Creating new user profile with Supabase UID...');
          const { data: newUser, error: profileError } = await supabase
            .from('users')
            .insert({
              email: authData.user.email,
              first_name: data.firstName,
              last_name: data.lastName,
              subscription_status: 'free',
              supabase_uid: authData.user.id, // Store Supabase UUID
            })
            .select()
            .single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }
          
          userId = newUser.id;
          console.log('User profile created with supabase_uid:', userId);
        }
      }

      return authData;
    },
    onSuccess: (data) => {
      let description = "Welcome to Jits Journal. Your account has been created successfully.";
      
      // Check if email confirmation is required
      if (data.user && !data.user.confirmed_at) {
        description = "Please check your email to confirm your account before logging in.";
        
        toast({
          title: "Account created!",
          description: description,
          duration: 6000,
        });
      } else {
        // User is auto-confirmed, redirect to dashboard
        toast({
          title: "Account created!",
          description: description,
          duration: 3000,
        });
        
        // Force page reload to clear browser cache and load fresh session
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const handleLogin = (data: LoginFormData) => {
    console.log('Login attempt with:', { email: data.email, hasPassword: !!data.password });
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormData) => {
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
                onClick={() => setIsLogin(!isLogin)}
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
