import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Shield, Eye, EyeOff } from 'lucide-react';

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
    fullName: '',
    role: '',
    userType: 'employee' // 'employee' or 'vendor'
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

  // Password visibility state
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Geofencing state
  const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied' | 'outside'>('checking');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationDebug, setShowLocationDebug] = useState(false);
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Office coordinates - Twitza Building, Hyderabad
  // Updated to actual office location: 17.433749°N, 78.375504°E
  const OFFICE_LOCATION = { lat: 17.433749, lng: 78.375504 };
  const OFFICE_RADIUS_METERS = 200; // Allow login within 200 meters of office

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if user is within office location
  const checkLocationPermission = async () => {
    // Skip location check in demo mode
    if (demoMode) {
      setLocationStatus('allowed');
      setUserLocation({ lat: OFFICE_LOCATION.lat, lng: OFFICE_LOCATION.lng });
      return true;
    }

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive'
      });
      return false;
    }

    return new Promise<boolean>((resolve) => {
      setLocationStatus('checking');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          const distance = calculateDistance(
            latitude, 
            longitude, 
            OFFICE_LOCATION.lat, 
            OFFICE_LOCATION.lng
          );
          
          console.log('User location:', { latitude, longitude });
          console.log('Office location:', OFFICE_LOCATION);
          console.log('Distance from office:', Math.round(distance), 'meters');
          
          if (distance <= OFFICE_RADIUS_METERS) {
            setLocationStatus('allowed');
            toast({
              title: 'Location Verified',
              description: `You are ${Math.round(distance)}m from the office.`,
            });
            resolve(true);
          } else {
            setLocationStatus('outside');
            toast({
              title: 'Location Restricted',
              description: `You must be within ${OFFICE_RADIUS_METERS}m of the office to login. Currently ${Math.round(distance)}m away.`,
              variant: 'destructive'
            });
            resolve(false);
          }
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus('denied');
          
          let errorMessage = 'Unable to access your location.';
          if (error.code === 1) {
            errorMessage = 'Location access denied. Please allow location access and try again.';
          } else if (error.code === 2) {
            errorMessage = 'Location unavailable. Please check your device settings.';
          } else if (error.code === 3) {
            errorMessage = 'Location request timed out. Please try again.';
          }
          
          toast({
            title: 'Location Access Required',
            description: errorMessage,
            variant: 'destructive'
          });
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache location for 1 minute
        }
      );
    });
  };

  // Check location and email verification setting on component mount
  useEffect(() => {
    checkLocationPermission();
    fetchEmailVerificationSetting();
  }, []);

  const fetchEmailVerificationSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('email_verification_enabled')
        .limit(1)
        .single();
      
      if (!error && data) {
        setEmailVerificationEnabled(data.email_verification_enabled ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch email verification setting:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on user type
    if (signupData.userType === 'employee') {
      // Check if role is selected for employees
      if (!signupData.role) {
        toast({
          title: "Role Required",
          description: "Please select your role (HR or Employee).",
          variant: "destructive",
        });
        return;
      }
      
      // Check if employee number is provided for employees
      if (!signupData.employeeNumber.trim()) {
        toast({
          title: "Employee Number Required",
          description: "Please enter your employee number.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For vendors, we don't require role or employee number
      // We'll generate a vendor ID automatically
    }
    
    // Check location first for signup as well
    if (locationStatus !== 'allowed') {
      const isLocationVerified = await checkLocationPermission();
      if (!isLocationVerified) {
        return;
      }
    }
    
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
      // Generate employee number for vendors if not provided
      const employeeNumber = signupData.userType === 'vendor' 
        ? `VENDOR_${Date.now()}` 
        : signupData.employeeNumber;

      // Determine department based on user type and role
      let department = 'Employee';
      if (signupData.userType === 'vendor') {
        department = 'Vendor';
      } else if (signupData.role === 'hr') {
        department = 'HR';
      }

      const signupOptions: any = {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          employee_number: employeeNumber,
          full_name: signupData.fullName,
          company_email: signupData.email,
          department: department
        }
      };

      // Skip email confirmation if disabled
      if (!emailVerificationEnabled) {
        signupOptions.emailRedirectTo = undefined;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: signupOptions
      });

      if (error) throw error;

      if (data.user) {
        // Assign role to the user only for employees
        if (signupData.userType === 'employee' && signupData.role) {
          const roleValue = signupData.role === 'hr' ? 'hr_admin' : 'employee';
          
          try {
            const { error: roleError } = await supabase
              .from('admin_roles')
              .insert({
                user_id: data.user.id,
                role: roleValue
              });
            
            if (roleError) {
              console.error('Role assignment error:', roleError);
              // Don't fail the signup for role assignment issues
            }
          } catch (roleAssignError) {
            console.error('Role assignment failed:', roleAssignError);
          }
        }
        
        if (data.user.email_confirmed_at || !emailVerificationEnabled) {
          const accountType = signupData.userType === 'vendor' ? 'Vendor' : 
                            (signupData.role === 'hr' ? 'HR' : 'Employee');
          toast({
            title: "Account Created!",
            description: `Your ${accountType} account has been created successfully.`,
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
    
    // Check location first
    if (locationStatus !== 'allowed') {
      const isLocationVerified = await checkLocationPermission();
      if (!isLocationVerified) {
        return;
      }
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signinData.email,
        password: signinData.password,
      });

      if (error) {
        console.log('Sign in error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          emailVerificationEnabled
        });
        
        // If email verification is disabled and error is "Email not confirmed", 
        // provide helpful instructions
        if (error.message === "Email not confirmed" && !emailVerificationEnabled) {
          toast({
            title: "Account Needs Activation",
            description: "Your account exists but isn't activated. Please delete your account from Supabase dashboard and sign up again, or ask an admin to activate it.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Welcome Back!",
        description: "Successfully signed in.",
      });
      
      onAuthSuccess();
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = error.message || "Failed to sign in.";
      
      if (error.message === "Invalid login credentials") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message === "Email not confirmed") {
        if (!emailVerificationEnabled) {
          errorMessage = "Account needs verification. Please delete your account from Supabase dashboard and sign up again, or contact admin to enable your account.";
        } else {
          errorMessage = "Please check your email and click the verification link before signing in.";
        }
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
                       <div className="relative">
                         <Input
                           id="new-password"
                           type={showNewPassword ? "text" : "password"}
                           placeholder="Create a new password"
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           required
                           className="transition-smooth pr-10"
                         />
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                           onClick={() => setShowNewPassword(!showNewPassword)}
                         >
                           {showNewPassword ? (
                             <EyeOff className="h-4 w-4 text-muted-foreground" />
                           ) : (
                             <Eye className="h-4 w-4 text-muted-foreground" />
                           )}
                         </Button>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                       <div className="relative">
                         <Input
                           id="confirm-new-password"
                           type={showConfirmNewPassword ? "text" : "password"}
                           placeholder="Confirm your new password"
                           value={confirmNewPassword}
                           onChange={(e) => setConfirmNewPassword(e.target.value)}
                           required
                           className="transition-smooth pr-10"
                         />
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                           onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                         >
                           {showConfirmNewPassword ? (
                             <EyeOff className="h-4 w-4 text-muted-foreground" />
                           ) : (
                             <Eye className="h-4 w-4 text-muted-foreground" />
                           )}
                         </Button>
                       </div>
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
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSigninPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signinData.password}
                          onChange={(e) => setSigninData({...signinData, password: e.target.value})}
                          required
                          className="transition-smooth pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowSigninPassword(!showSigninPassword)}
                        >
                          {showSigninPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Location Status Indicator */}
                    <div className="flex items-center justify-center space-x-2 p-3 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        {locationStatus === 'checking' && (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">Checking location...</span>
                          </>
                        )}
                        {locationStatus === 'allowed' && (
                          <>
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Location verified ✓</span>
                          </>
                        )}
                        {locationStatus === 'outside' && (
                          <>
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Must be at office location</span>
                          </>
                        )}
                        {locationStatus === 'denied' && (
                          <>
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600">Location access required</span>
                          </>
                        )}
                      </div>
                      {(locationStatus === 'denied' || locationStatus === 'outside') && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={checkLocationPermission}
                          disabled={isLoading}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full transition-spring hover:scale-105"
                      disabled={isLoading || locationStatus !== 'allowed'}
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
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="user-type">Account Type</Label>
                  <Select 
                    value={signupData.userType} 
                    onValueChange={(value) => setSignupData({
                      ...signupData, 
                      userType: value,
                      // Reset role and employee number when switching types
                      role: value === 'vendor' ? '' : signupData.role,
                      employeeNumber: value === 'vendor' ? '' : signupData.employeeNumber
                    })}
                  >
                    <SelectTrigger id="user-type" className="transition-smooth">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="employee">Employee (Internal)</SelectItem>
                      <SelectItem value="vendor">Vendor (External)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {signupData.userType === 'employee' 
                      ? 'Choose this if you work for the company' 
                      : 'Choose this if you are an external vendor or partner'
                    }
                  </p>
                </div>

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
                
                {/* Employee Number - Only show for employees */}
                {signupData.userType === 'employee' && (
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
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    {signupData.userType === 'employee' ? 'Company Email' : 'Business Email'}
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={signupData.userType === 'employee' ? 'your.name@company.com' : 'your.name@business.com'}
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required
                    className="transition-smooth"
                  />
                </div>
                
                {/* Role Selection - Only show for employees */}
                {signupData.userType === 'employee' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select value={signupData.role} onValueChange={(value) => setSignupData({...signupData, role: value})}>
                      <SelectTrigger id="signup-role" className="transition-smooth">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        <SelectItem value="hr">HR (Admin Access)</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      required
                      className="transition-smooth pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                      required
                      className="transition-smooth pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Location Status Indicator */}
                <div className="flex items-center justify-center space-x-2 p-3 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {locationStatus === 'checking' && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Checking location...</span>
                      </>
                    )}
                    {locationStatus === 'allowed' && (
                      <>
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Location verified ✓</span>
                      </>
                    )}
                    {locationStatus === 'outside' && (
                      <>
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Must be at office location</span>
                      </>
                    )}
                    {locationStatus === 'denied' && (
                      <>
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-600">Location access required</span>
                      </>
                    )}
                  </div>
                  {(locationStatus === 'denied' || locationStatus === 'outside') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={checkLocationPermission}
                      disabled={isLoading}
                    >
                      Retry
                    </Button>
                  )}
                </div>
                
                <Button 
                  type="submit"
                  className="w-full transition-spring hover:scale-105"
                  disabled={isLoading || locationStatus !== 'allowed'}
                >
                  {isLoading ? "Creating Account..." : `Create ${signupData.userType === 'vendor' ? 'Vendor' : 'Employee'} Account`}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center text-sm text-muted-foreground mt-4 space-y-2">
            <p>Daily coupon value: ₹160</p>
            <p className="text-xs">Available Monday to Friday</p>
            <div className="flex items-center justify-center space-x-1 text-xs">
              <MapPin className="h-3 w-3" />
              <span>Office location access required (Plus Code: C9MF+PW)</span>
            </div>
            
            {/* Demo Mode Toggle */}
            <div className="mt-3 border-t pt-3">
              <Button
                type="button"
                variant={demoMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDemoMode(!demoMode);
                  if (!demoMode) {
                    setLocationStatus('allowed');
                    setUserLocation({ lat: OFFICE_LOCATION.lat, lng: OFFICE_LOCATION.lng });
                    toast({
                      title: "🎭 Demo Mode Enabled",
                      description: "Location check bypassed. Use test credentials below.",
                    });
                  } else {
                    setLocationStatus('checking');
                    toast({
                      title: "Demo Mode Disabled",
                      description: "Location verification required again.",
                    });
                  }
                }}
                className="text-xs"
              >
                {demoMode ? '🎭 Demo Mode ON' : '🎭 Enable Demo Mode'}
              </Button>
              
              {demoMode && (
                <div className="mt-2 p-3 bg-primary/10 rounded-lg text-left border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 text-primary">🎭 Demo Test Credentials</h4>
                  <div className="space-y-2 text-xs">
                    <div className="bg-background/50 p-2 rounded">
                      <p className="font-medium mb-1">Sign Up with:</p>
                      <p><strong>Email:</strong> test@autorabit.com</p>
                      <p><strong>Password:</strong> Test123!</p>
                      <p><strong>Employee #:</strong> AR12345</p>
                      <p><strong>Name:</strong> Demo User</p>
                      <p><strong>Role:</strong> Software Engineer</p>
                    </div>
                    <p className="text-muted-foreground italic">
                      ⚠️ Location verification is bypassed in demo mode
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location Debug Panel */}
            <div className="mt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLocationDebug(!showLocationDebug)}
                className="text-xs h-6"
              >
                {showLocationDebug ? 'Hide' : 'Show'} Location Debug
              </Button>
              
              {showLocationDebug && (
                <div className="mt-2 p-3 bg-muted rounded-lg text-left">
...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};