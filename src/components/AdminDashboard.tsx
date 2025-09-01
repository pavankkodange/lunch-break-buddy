import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';

interface DayStats {
  date: string;
  claimed: number;
  redeemed: number;
  value: number;
}

interface RedemptionRecord {
  id: string;
  user_id: string;
  employee_number: string;
  redemption_date: string;
  redemption_time: string;
  created_at: string;
  profile?: {
    full_name: string;
    department: string;
    company_email: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<DayStats[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState({ redeemed: 0, value: 0 });
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [todayRedemptions, setTodayRedemptions] = useState<RedemptionRecord[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  const { toast } = useToast();
  const { adminRole, isAutorabitAdmin, isViewOnlyAdmin, loading: roleLoading, refreshRole } = useAdminRole();

  useEffect(() => {
    fetchRedemptions();
    fetchCompanySettings();
  }, []);

  const fetchRedemptions = async () => {
    setLoadingRedemptions(true);
    try {
      // Fetch all redemptions and join with profiles using user_id
      const { data: redemptionsData, error } = await supabase
        .from('meal_redemptions')
        .select(`
          *,
          profiles!fk_meal_redemptions_user_id(
            full_name,
            department,
            company_email
          )
        `)
        .order('redemption_time', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        // If foreign key join fails, try without profile data
        const { data: simpleData, error: simpleError } = await supabase
          .from('meal_redemptions')
          .select('*')
          .order('redemption_time', { ascending: false });
          
        if (simpleError) {
          console.error('Error fetching simple redemptions:', simpleError);
        } else if (simpleData) {
          setRedemptions(simpleData);
          setTodayRedemptions(simpleData.filter(r => 
            r.redemption_date === new Date().toISOString().split('T')[0]
          ));
          generateStatsFromData(simpleData);
        }
      } else if (redemptionsData) {
        const formattedRedemptions = redemptionsData.map(item => ({
          ...item,
          profile: item.profiles
        }));
        
        setRedemptions(formattedRedemptions);
        
        // Filter today's redemptions
        const today = new Date().toISOString().split('T')[0];
        const todaysRedemptions = formattedRedemptions.filter(r => 
          r.redemption_date === today
        );
        setTodayRedemptions(todaysRedemptions);
        
        // Generate stats from real data
        generateStatsFromData(formattedRedemptions);
      }
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const generateStatsFromData = (redemptionsData: RedemptionRecord[]) => {
    const stats: DayStats[] = [];
    const today = new Date();
    
    // Generate stats for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRedemptions = redemptionsData.filter(r => r.redemption_date === dateStr);
      const redeemed = dayRedemptions.length;
      
      stats.push({
        date: dateStr,
        claimed: redeemed, // For now, claimed = redeemed since we only track actual redemptions
        redeemed,
        value: redeemed * 160
      });
    }
    
    setWeeklyStats(stats);
    
    // Calculate monthly total
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyRedemptions = redemptionsData.filter(r => {
      const redemptionDate = new Date(r.redemption_date);
      return redemptionDate.getMonth() === currentMonth && 
             redemptionDate.getFullYear() === currentYear;
    });
    
    setMonthlyTotal({
      redeemed: monthlyRedemptions.length,
      value: monthlyRedemptions.length * 160
    });
  };

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
      description: "Monthly billing report with employee details has been downloaded.",
    });
  };

  const generateMonthlyReport = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get current month's redemptions
    const monthlyRedemptions = redemptions.filter(r => {
      const redemptionDate = new Date(r.redemption_date);
      return redemptionDate.getMonth() === currentMonth && 
             redemptionDate.getFullYear() === currentYear;
    });
    
    let csvContent = "Date,Day,Employee Number,Employee Name,Department,Company Email,Redemption Time,Value (₹)\n";
    let totalValue = 0;
    
    monthlyRedemptions.forEach(redemption => {
      const date = new Date(redemption.redemption_date);
      const dayName = date.toLocaleDateString('en-IN', { weekday: 'long' });
      const time = new Date(redemption.redemption_time).toLocaleTimeString('en-IN');
      const value = 160;
      totalValue += value;
      
      csvContent += `${redemption.redemption_date},${dayName},${redemption.employee_number},"${redemption.profile?.full_name || 'N/A'}","${redemption.profile?.department || 'N/A'}","${redemption.profile?.company_email || 'N/A'}",${time},${value}\n`;
    });
    
    csvContent += `\nSUMMARY\n`;
    csvContent += `Total Redemptions:,${monthlyRedemptions.length}\n`;
    csvContent += `Total Value:,₹${totalValue}\n`;
    csvContent += `Average per day:,${(monthlyRedemptions.length / Math.min(today.getDate(), 31)).toFixed(1)}\n`;
    csvContent += `\nReport generated on:,${new Date().toISOString()}\n`;
    
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
              {!isAutorabitAdmin && (
                <Button 
                  onClick={refreshRole} 
                  variant="ghost" 
                  size="sm"
                  className="ml-2"
                >
                  🔄 Refresh Access
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Daily Coupon Claims */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Today's Redemptions</CardTitle>
            <p className="text-muted-foreground">
              Track which employees redeemed coupons today ({new Date().toLocaleDateString('en-IN')})
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Today's Activity</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{todayRedemptions.length}</div>
                    <p className="text-sm text-muted-foreground">Total Redemptions</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">₹{todayRedemptions.length * 160}</div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">
                      {todayRedemptions.length > 0 ? new Set(todayRedemptions.map(r => r.user_id)).size : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Unique Employees</p>
                  </div>
                </div>
              </div>
              
              {loadingRedemptions ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">Loading today's redemptions...</p>
                </div>
              ) : todayRedemptions.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayRedemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(redemption.redemption_time).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {redemption.profile?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {redemption.employee_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {redemption.profile?.department || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-success">
                            ₹160
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">No redemptions today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Employee meal redemptions will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{todayRedemptions.length}</div>
              <p className="text-sm text-muted-foreground">Today Redeemed</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success">₹{todayRedemptions.length * 160}</div>
              <p className="text-sm text-muted-foreground">Today Value</p>
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
                {isAutorabitAdmin ? "Export Detailed Monthly Report (CSV)" : "Export Restricted (Autorabit Only)"}
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
                  })} ({redemptions.filter(r => {
                    const redemptionDate = new Date(r.redemption_date);
                    return redemptionDate.getMonth() === new Date().getMonth() && 
                           redemptionDate.getFullYear() === new Date().getFullYear();
                  }).length} records)
                </p>
                <p className="text-xs text-muted-foreground">
                  Detailed CSV includes: Employee names, IDs, departments, and redemption times
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