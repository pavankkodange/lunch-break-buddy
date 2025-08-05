import React, { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { CouponDisplay } from '@/components/CouponDisplay';
import { KioskScanner } from '@/components/KioskScanner';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type AppMode = 'home' | 'employee' | 'kiosk' | 'admin';

const Index = () => {
  const [mode, setMode] = useState<AppMode>('home');
  const { isAuthenticated, loading, signOut, isAutorabitEmployee, user } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => {}} />;
  }

  // Show mode selection after authentication
  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-elevated text-center">
            <CardHeader>
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
              </div>
              <CardTitle className="text-3xl">Employee Food Coupons</CardTitle>
              <p className="text-muted-foreground">Digital meal coupon system for employees</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleEmployeeAccess}
                  variant="default"
                  size="lg"
                  className="h-24 flex flex-col gap-2 transition-spring hover:scale-105"
                  disabled={!isAutorabitEmployee}
                >
                  <span className="text-2xl">👤</span>
                  <span>Employee Portal</span>
                  {!isAutorabitEmployee && (
                    <span className="text-xs opacity-70">Autorabit employees only</span>
                  )}
                </Button>
                
                <Button
                  onClick={() => setMode('kiosk')}
                  variant="secondary"
                  size="lg"
                  className="h-24 flex flex-col gap-2 transition-spring hover:scale-105"
                >
                  <span className="text-2xl">📱</span>
                  <span>Kiosk Scanner</span>
                </Button>
                
                <Button
                  onClick={() => setMode('admin')}
                  variant="outline"
                  size="lg"
                  className="h-24 flex flex-col gap-2 transition-spring hover:scale-105"
                >
                  <span className="text-2xl">📊</span>
                  <span>Admin Dashboard</span>
                </Button>
              </div>
              
              <div className="text-center space-y-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Logged in as:</strong> {user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Coupon Value:</strong> ₹160 per day
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Availability:</strong> Monday to Friday
                </p>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl">1️⃣</span>
                  </div>
                  <p className="font-medium">Login & Claim</p>
                  <p className="text-muted-foreground">Employees login and claim their daily coupon</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl">2️⃣</span>
                  </div>
                  <p className="font-medium">Show QR Code</p>
                  <p className="text-muted-foreground">Present QR code at food kiosk</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl">3️⃣</span>
                  </div>
                  <p className="font-medium">Scan & Redeem</p>
                  <p className="text-muted-foreground">Kiosk scans and validates the coupon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === 'employee') {
    return <CouponDisplay onLogout={handleLogout} onBack={handleBackToHome} />;
  }

  if (mode === 'kiosk') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={() => setMode('home')} variant="outline">
            ← Back to Home
          </Button>
        </div>
        <KioskScanner />
      </div>
    );
  }

  if (mode === 'admin') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={() => setMode('home')} variant="outline">
            ← Back to Home
          </Button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return null;
};

export default Index;
