import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
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

  // Password update flow state
  const [isPasswordUpdateMode, setIsPasswordUpdateMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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

    if (!signupData.email.includes('@')) {
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
          emailRedirectTo: `${window.location.origin}`,
          data: {
            employee_number: signupData.employeeNumber,
            full_name: signupData.fullName,
            company_email: signupData.email
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast({
            title: "Account Created!",
            description: "Your account has been created successfully.",
          });
          onAuthSuccess();
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email and click the verification link before signing in.",
          });
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
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
      console.error('Sign in error:', error);
      let errorMessage = error.message || "Failed to sign in.";
      
      if (error.message === "Invalid login credentials") {
        errorMessage = "Invalid email or password. Please check your credentials and ensure your email is verified.";
      } else if (error.message === "Email not confirmed") {
        errorMessage = "Please check your email and click the verification link before signing in.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'https://f8fe9401-8b63-4363-ae21-b380386f0616.lovableproject.com/'
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent!",
        description: "Check your email for a password reset link.",
      });
      
      setIsResetMode(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for Supabase password recovery and handle code/token verification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change during recovery:', event, session?.user?.email);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordUpdateMode(true);
      }
    });

    const handleRecoveryToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      
      console.log('Recovery URL params:', { code, tokenHash, type, fullUrl: window.location.href });
      
      if (code) {
        // Modern approach: exchange code for session
        try {
          setIsLoading(true);
          console.log('Attempting to exchange code for session...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Code exchange failed:', error);
            toast({
              title: 'Invalid Reset Link',
              description: 'This password reset link has expired or is invalid. Please request a new one.',
              variant: 'destructive'
            });
          } else if (data.session) {
            console.log('Code exchange successful, session established:', data.session.user.email);
            setIsPasswordUpdateMode(true);
            toast({
              title: 'Reset Link Verified',
              description: 'You can now set your new password.',
            });
          }
        } catch (err) {
          console.error('Code exchange error:', err);
          toast({
            title: 'Verification Error',
            description: 'Failed to verify the reset link. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      } else if (tokenHash && type === 'recovery') {
        // Legacy approach: verify OTP token
        try {
          setIsLoading(true);
          console.log('Attempting to verify OTP token...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });
          
          if (error) {
            console.error('OTP verification failed:', error);
            toast({
              title: 'Invalid Reset Link',
              description: 'This password reset link has expired or is invalid. Please request a new one.',
              variant: 'destructive'
            });
          } else if (data.session) {
            console.log('OTP verification successful, session established:', data.session.user.email);
            setIsPasswordUpdateMode(true);
            toast({
              title: 'Reset Link Verified',
              description: 'You can now set your new password.',
            });
          }
        } catch (err) {
          console.error('OTP verification error:', err);
          toast({
            title: 'Verification Error',
            description: 'Failed to verify the reset link. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      } else if (window.location.search.includes('recovery=1')) {
        console.log('Manual recovery mode triggered');
        setIsPasswordUpdateMode(true);
      }
    };

    handleRecoveryToken();

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      console.log('About to update password...');
      
      // Check current session before updating
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session status:', { 
        hasSession: !!sessionData.session, 
        hasUser: !!sessionData.session?.user,
        userEmail: sessionData.session?.user?.email,
        sessionError 
      });
      
      if (!sessionData.session) {
        throw new Error('No active session found. Please click the reset link again.');
      }
      
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      console.log('Password update result:', { data, error });
      
      if (error) throw error;

      console.log('Password updated successfully');
      toast({ title: 'Password Updated', description: 'Please sign in with your new password.' });
      
      // End the recovery session and show the normal sign-in form
      await supabase.auth.signOut();
      setIsPasswordUpdateMode(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({ 
        title: 'Update Failed', 
        description: error.message || 'Could not update password. Please try clicking the reset link again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          ← Back to Home
        </Button>
      </div>
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
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
              {isPasswordUpdateMode ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Set New Password</h3>
                    <p className="text-sm text-muted-foreground">Enter and confirm your new password</p>
                  </div>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Create a new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        className="transition-smooth"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full transition-spring hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </>
              ) : !isResetMode ? (
                <>
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
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-sm p-0 h-auto"
                      onClick={() => setIsResetMode(true)}
                      type="button"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Reset Password</h3>
                    <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
                  </div>
                  
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Company Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your.name@company.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="transition-smooth"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        type="submit"
                        className="w-full transition-spring hover:scale-105"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setIsResetMode(false);
                          setResetEmail('');
                        }}
                        type="button"
                        disabled={isLoading}
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </form>
                </>
              )}
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