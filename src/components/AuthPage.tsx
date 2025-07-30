import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Sign up form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    employeeNumber: '',
    fullName: ''
  });

  // Sign in form state
  const [signinData, setSigninData] = useState({
    email: '',
    password: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!signupData.email.includes('@company.') && !signupData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please use your company email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            employee_number: signupData.employeeNumber,
            full_name: signupData.fullName,
            company_email: signupData.email
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            employee_number: signupData.employeeNumber,
            full_name: signupData.fullName,
            company_email: signupData.email
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signinData.email,
        password: signinData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome Back!",
        description: "Successfully signed in.",
      });
      
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to sign in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <CardTitle className="text-2xl">Employee Food Coupons</CardTitle>
          <p className="text-muted-foreground">Access your meal coupon portal</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Company Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.name@company.com"
                    value={signinData.email}
                    onChange={(e) => setSigninData({...signinData, email: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signinData.password}
                    onChange={(e) => setSigninData({...signinData, password: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full transition-spring hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your full name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-empno">Employee Number</Label>
                  <Input
                    id="signup-empno"
                    placeholder="Enter your employee number"
                    value={signupData.employeeNumber}
                    onChange={(e) => setSignupData({...signupData, employeeNumber: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Company Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.name@company.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full transition-spring hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Daily coupon value: ₹160</p>
            <p className="text-xs mt-1">Available Monday to Friday</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};