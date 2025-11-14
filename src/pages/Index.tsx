import React, { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { CouponDisplay } from '@/components/CouponDisplay';
import { ProfileEdit } from '@/components/ProfileEdit';
import { VendorQRGenerator } from '@/components/VendorQRGenerator';
import { Reports } from '@/components/Reports';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';

import { VendorReports } from '@/components/VendorReports';

type AppMode = 'home' | 'employee' | 'reports' | 'vendor_reports' | 'vendor_qr' | 'profile';

const Index = () => {
  const [mode, setMode] = useState<AppMode>('home');
  const { isAuthenticated, loading, signOut, isAutorabitEmployee, user } = useAuth();
  const { hasHRAccess, loading: roleLoading } = useAdminRole();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    setMode('home');
  };

  const handleBackToHome = () => {
    setMode('home');
  };

  const handleAuthSuccess = () => {
    // User is authenticated, show mode selection
    // Will be handled by useEffect below to route based on role
  };

  const handleEmployeeAccess = () => {
    if (!isAutorabitEmployee) {
      toast({
        title: "Access Denied",
        description: "Employee portal is only available for Autorabit employees. Please use an @autorabit.com email address.",
        variant: "destructive",
      });
      return;
    }
    setMode('employee');
  };

  const handleDashboardAccess = () => {
    // Only allow dashboard access to HR roles
    setMode('home'); // This will show dashboard for HR users, or access denied for others
  };

  // Auto-redirect regular employees to employee portal
  useEffect(() => {
    // Only run redirect logic after both auth and role are FULLY loaded
    if (!isAuthenticated || mode !== 'home' || loading || roleLoading) {
      return; // Don't do anything if still loading
    }
    
    const isVendor = user?.email && !user.email.includes('@autorabit.com');
    
    // Log current state for debugging
    console.log('Checking redirect:', { 
      isAutorabitEmployee, 
      hasHRAccess, 
      isVendor,
      email: user?.email 
    });
    
    // If user is a regular employee (autorabit employee but not HR admin and role check is complete)
    if (isAutorabitEmployee && !hasHRAccess && !isVendor) {
      console.log('Regular employee confirmed, redirecting to employee portal');
      setMode('employee');
    } else if (hasHRAccess) {
      console.log('HR access confirmed, staying on dashboard');
    } else if (isVendor) {
      console.log('Vendor confirmed, staying on dashboard');
    }
  }, [isAuthenticated, mode, loading, roleLoading, isAutorabitEmployee, hasHRAccess, user]);

  // Add loading timeout protection
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing app to continue');
        // Force continue by refreshing the page if stuck too long
        window.location.reload();
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Show loading screen while authenticating or determining roles
  if (loading || (isAuthenticated && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="mt-2">Loading...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {loading ? 'Initializing your session...' : 'Verifying your role...'}
          </p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => {}} />;
  }

  // Show dashboard as main page after authentication
  if (mode === 'home') {
    return <Dashboard onNavigate={(section) => setMode(section as AppMode)} />;
  }

  if (mode === 'employee') {
    return <CouponDisplay onLogout={handleLogout} onBack={handleBackToHome} />;
  }

  if (mode === 'reports') {
    return <Reports onBack={handleBackToHome} />;
  }

  if (mode === 'vendor_reports') {
    return <VendorReports onBack={handleBackToHome} />;
  }

  if (mode === 'vendor_qr') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={() => setMode('home')} variant="outline">
            ← Back to Home
          </Button>
        </div>
        <VendorQRGenerator />
      </div>
    );
  }

  if (mode === 'profile') {
    return <ProfileEdit onBack={handleBackToHome} />;
  }

  return null;
};

export default Index;
