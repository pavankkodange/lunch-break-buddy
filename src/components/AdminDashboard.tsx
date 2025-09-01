import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { CouponDisplay } from './CouponDisplay';
import { KioskScanner } from './KioskScanner';

interface DayStats {
  date: string;
  claimed: number;
  redeemed: number;
  value: number;
}

export const AdminDashboard: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<DayStats[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState({ redeemed: 0, value: 0 });
  const [activeView, setActiveView] = useState<'dashboard' | 'employee' | 'kiosk'>('dashboard');
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const { toast } = useToast();
  const { adminRole, isAutorabitAdmin, isViewOnlyAdmin, loading: roleLoading } = useAdminRole();

  useEffect(() => {
    generateStats();
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
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
      console.error('Failed to fetch company settings:', error);
    }
  };

  const updateEmailVerificationSetting = async (enabled: boolean) => {
    if (!isAutorabitAdmin) {
      toast({
        title: "Access Denied",
        description: "Only Autorabit administrators can modify settings.",
        variant: "destructive"
      });
      return;
    }

    setLoadingSettings(true);
    try {
      // First check if settings exist
      const { data: existing, error: fetchError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('company_settings')
          .update({ email_verification_enabled: enabled })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new settings record
        const { error } = await supabase
          .from('company_settings')
          .insert({ email_verification_enabled: enabled });
        
        if (error) throw error;
      }

      setEmailVerificationEnabled(enabled);
      toast({
        title: "Settings Updated",
        description: `Email verification has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      console.error('Failed to update email verification setting:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive"
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const generateStats = () => {
    const stats: DayStats[] = [];
    const today = new Date();
    
    // Generate stats for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count coupons for this date
      const claimed = countCouponsForDate(dateStr, 'claimed');
      const redeemed = countCouponsForDate(dateStr, 'redeemed');
      
      stats.push({
        date: dateStr,
        claimed,
        redeemed,
        value: redeemed * 160
      });
    }
    
    setWeeklyStats(stats);
    
    // Calculate monthly total
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let monthlyRedeemed = 0;
    
    for (let day = 1; day <= today.getDate(); day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      const dateStr = checkDate.toISOString().split('T')[0];
      monthlyRedeemed += countCouponsForDate(dateStr, 'redeemed');
    }
    
    setMonthlyTotal({
      redeemed: monthlyRedeemed,
      value: monthlyRedeemed * 160
    });
  };

  const countCouponsForDate = (date: string, type: 'claimed' | 'redeemed'): number => {
    const allKeys = Object.keys(localStorage);
    
    if (type === 'claimed') {
      return allKeys.filter(key => 
        key.startsWith('coupon_') && key.includes(date)
      ).length;
    } else {
      return allKeys.filter(key => 
        key.startsWith('used_') && key.includes(date)
      ).length;
    }
  };

  const exportMonthlyReport = () => {
    const report = generateMonthlyReport();
    downloadCSV(report, `food-coupon-report-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}.csv`);
    
    toast({
      title: "Report Exported",
      description: "Monthly billing report has been downloaded.",
    });
  };

  const generateMonthlyReport = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let csvContent = "Date,Day,Claimed,Redeemed,Value (₹)\n";
    let totalRedeemed = 0;
    let totalValue = 0;
    
    for (let day = 1; day <= Math.min(daysInMonth, today.getDate()); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-IN', { weekday: 'long' });
      
      const claimed = countCouponsForDate(dateStr, 'claimed');
      const redeemed = countCouponsForDate(dateStr, 'redeemed');
      const value = redeemed * 160;
      
      totalRedeemed += redeemed;
      totalValue += value;
      
      csvContent += `${dateStr},${dayName},${claimed},${redeemed},${value}\n`;
    }
    
    csvContent += `\nTOTAL,,${totalRedeemed},${totalRedeemed},${totalValue}\n`;
    csvContent += `\nReport generated on: ${new Date().toISOString()}\n`;
    
    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = weeklyStats.find(stat => stat.date === today);
    return todayData || { claimed: 0, redeemed: 0, value: 0 };
  };

  const todayStats = getTodayStats();

  if (activeView === 'employee') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={() => setActiveView('dashboard')} variant="outline">
            ← Back to Admin Dashboard
          </Button>
        </div>
        <CouponDisplay onLogout={() => setActiveView('dashboard')} onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }

  if (activeView === 'kiosk') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={() => setActiveView('dashboard')} variant="outline">
            ← Back to Admin Dashboard
          </Button>
        </div>
        <KioskScanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <span className="text-3xl">📊</span>
              Food Coupon Admin Dashboard
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-muted-foreground">Monitor coupon usage and generate billing reports</p>
              <Badge variant={isAutorabitAdmin ? "default" : "secondary"}>
                {isAutorabitAdmin ? "Autorabit Admin" : "View Only"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Admin Quick Access */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <p className="text-muted-foreground">
              {isAutorabitAdmin ? "Access all application features" : "View-only access to all features"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setActiveView('employee')}
                variant="default"
                size="lg"
                className="h-20 flex flex-col gap-2 transition-spring hover:scale-105"
              >
                <span className="text-2xl">👤</span>
                <span>Employee Portal</span>
              </Button>
              
              <Button
                onClick={() => setActiveView('kiosk')}
                variant="secondary"
                size="lg"
                className="h-20 flex flex-col gap-2 transition-spring hover:scale-105"
              >
                <span className="text-2xl">📱</span>
                <span>Kiosk Scanner</span>
              </Button>
            </div>
            {!isAutorabitAdmin && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  ⚠️ You have view-only access. Some features may be restricted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{todayStats.claimed}</div>
              <p className="text-sm text-muted-foreground">Today Claimed</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success">{todayStats.redeemed}</div>
              <p className="text-sm text-muted-foreground">Today Redeemed</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-warning">{monthlyTotal.redeemed}</div>
              <p className="text-sm text-muted-foreground">Month Redeemed</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-destructive">₹{monthlyTotal.value}</div>
              <p className="text-sm text-muted-foreground">Month Total</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Overview */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyStats.map((day) => (
                  <div key={day.date} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-IN', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{day.date}</p>
                      </div>
                      <Badge variant={day.redeemed > 0 ? "default" : "secondary"}>
                        {day.redeemed > 0 ? "Active" : "No Activity"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Claimed</p>
                        <p className="font-semibold">{day.claimed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Redeemed</p>
                        <p className="font-semibold text-success">{day.redeemed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Value</p>
                        <p className="font-semibold">₹{day.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        {/* System Settings */}
        {isAutorabitAdmin && (
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <p className="text-muted-foreground">Configure application behavior</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="email-verification" className="text-sm font-medium">
                    Email Verification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {emailVerificationEnabled ? 'Users must verify their email after signup' : 'Users can login immediately after signup'}
                  </p>
                </div>
                <Switch
                  id="email-verification"
                  checked={emailVerificationEnabled}
                  onCheckedChange={updateEmailVerificationSetting}
                  disabled={loadingSettings}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing & Reports */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Billing & Reports</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gradient-coupon">
                <h3 className="font-semibold mb-2">Monthly Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Coupons Redeemed:</span>
                    <span className="font-semibold">{monthlyTotal.redeemed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold text-success">₹{monthlyTotal.value}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Rate per coupon:</span>
                    <span>₹160</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={exportMonthlyReport} 
                disabled={!isAutorabitAdmin}
                className="w-full transition-spring hover:scale-105"
                size="lg"
              >
                {isAutorabitAdmin ? "Export Monthly Report (CSV)" : "Export Restricted (Autorabit Only)"}
              </Button>
              {!isAutorabitAdmin && (
                <p className="text-xs text-muted-foreground text-center">
                  Only Autorabit administrators can export billing reports.
                </p>
              )}

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Report Period: {new Date().toLocaleDateString('en-IN', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Only weekdays (Monday-Friday) are included in billing
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Coupon Rules</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• One coupon per employee per day</li>
                  <li>• Available Monday to Friday only</li>
                  <li>• Value: ₹160 per coupon</li>
                  <li>• Expires at end of day</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Billing Process</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Export monthly reports for vendor billing</li>
                  <li>• Reports include daily redemption counts</li>
                  <li>• Total amount calculated automatically</li>
                  <li>• Weekend coupons not included</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};