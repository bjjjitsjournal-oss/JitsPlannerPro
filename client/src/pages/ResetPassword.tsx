import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  // Extract token from URL params using window.location.search
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "The reset link is invalid or has expired.",
        variant: "destructive",
      });
    }
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been successfully updated.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-4">
                The reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password">
                <Button>Request New Reset Link</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Reset Password
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your new password below.
          </p>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Password must be at least 8 characters long.</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Password Reset Successful</h3>
                <p className="text-gray-600 mt-1">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}