import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  const [filteredRedemptions, setFilteredRedemptions] = useState<RedemptionRecord[]>([]);
  const [todayRedemptions, setTodayRedemptions] = useState<RedemptionRecord[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  
  const { toast } = useToast();
  const { adminRole, isAutorabitAdmin, isViewOnlyAdmin, loading: roleLoading, refreshRole } = useAdminRole();

  // Generate available years (current year and previous year for 6-month retention)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear.toString(), (currentYear - 1).toString()];
  
  // Generate available months
  const availableMonths = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    fetchRedemptions();
    fetchCompanySettings();
  }, [selectedYear, selectedMonth]);

  // Filter redemptions whenever filters or raw data changes
  useEffect(() => {
    applyFilters();
  }, [redemptions, selectedYear, selectedMonth]);

  const applyFilters = () => {
    if (!redemptions.length) {
      setFilteredRedemptions([]);
      setTodayRedemptions([]);
      return;
    }

    // Filter redemptions by selected year and month
    const filtered = redemptions.filter(r => {
      const redemptionDate = new Date(r.redemption_date);
      const redemptionYear = redemptionDate.getFullYear().toString();
      const redemptionMonth = (redemptionDate.getMonth() + 1).toString();
      
      return redemptionYear === selectedYear && redemptionMonth === selectedMonth;
    });

    setFilteredRedemptions(filtered);

    // Filter today's redemptions from the filtered set
    const today = new Date().toISOString().split('T')[0];
    const todaysFiltered = filtered.filter(r => r.redemption_date === today);
    setTodayRedemptions(todaysFiltered);

    // Generate stats from filtered data
    generateStatsFromData(filtered);
  };

  const getDateRangeForFilter = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return { startDate, endDate };
  };

  const fetchRedemptions = async () => {
    setLoadingRedemptions(true);
    try {
      const { startDate, endDate } = getDateRangeForFilter();
      
      // Fetch redemptions for the selected month with profile data
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
        .gte('redemption_date', startDate)
        .lte('redemption_date', endDate)
        .order('redemption_time', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        // If foreign key join fails, try without profile data
        const { data: simpleData, error: simpleError } = await supabase
          .from('meal_redemptions')
          .select('*')
          .gte('redemption_date', startDate)
          .lte('redemption_date', endDate)
          .order('redemption_time', { ascending: false });
          
        if (simpleError) {
          console.error('Error fetching simple redemptions:', simpleError);
        } else if (simpleData) {
          setRedemptions(simpleData);
        }
      } else if (redemptionsData) {
        const formattedRedemptions = redemptionsData.map(item => ({
          ...item,
          profile: item.profiles
        }));
        
        setRedemptions(formattedRedemptions);
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
    
    // Generate stats for the last 7 days of the selected month
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = year === today.getFullYear() && month === (today.getMonth() + 1) 
      ? today.getDate() 
      : daysInMonth;
    
    for (let i = 6; i >= 0; i--) {
      const targetDay = currentDay - i;
      if (targetDay <= 0) continue;
      
      const date = new Date(year, month - 1, targetDay);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRedemptions = redemptionsData.filter(r => r.redemption_date === dateStr);
      const redeemed = dayRedemptions.length;
      
      stats.push({
        date: dateStr,
        claimed: redeemed,
        redeemed,
        value: redeemed * 160
      });
    }
    
    setWeeklyStats(stats);
    
    // Calculate monthly total for selected month
    const monthlyRedemptions = redemptionsData.filter(r => {
      const redemptionDate = new Date(r.redemption_date);
      return redemptionDate.getMonth() === (month - 1) && 
             redemptionDate.getFullYear() === year;
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

  const exportMonthlyReport = () => {
    const report = generateMonthlyReport();
    const monthName = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    downloadCSV(report, `food-coupon-report-${selectedYear}-${monthName.toLowerCase()}.csv`);
    
    toast({
      title: "Report Exported",
      description: `${monthName} ${selectedYear} report with employee details has been downloaded.`,
    });
  };

  const generateMonthlyReport = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const monthName = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    
    let csvContent = `Employee Food Coupon Report - ${monthName} ${selectedYear}\n`;
    csvContent += "Date,Day,Employee Number,Employee Name,Department,Company Email,Redemption Time,Value (₹)\n";
    let totalValue = 0;
    
    filteredRedemptions.forEach(redemption => {
      const date = new Date(redemption.redemption_date);
      const dayName = date.toLocaleDateString('en-IN', { weekday: 'long' });
      const time = new Date(redemption.redemption_time).toLocaleTimeString('en-IN');
      const value = 160;
      totalValue += value;
      
      csvContent += `${redemption.redemption_date},${dayName},${redemption.employee_number},"${redemption.profile?.full_name || 'N/A'}","${redemption.profile?.department || 'N/A'}","${redemption.profile?.company_email || 'N/A'}",${time},${value}\n`;
    });
    
    csvContent += `\nSUMMARY\n`;
    csvContent += `Report Period:,${monthName} ${selectedYear}\n`;
    csvContent += `Total Redemptions:,${filteredRedemptions.length}\n`;
    csvContent += `Total Value:,₹${totalValue}\n`;
    csvContent += `Unique Employees:,${new Set(filteredRedemptions.map(r => r.employee_number)).size}\n`;
    csvContent += `Average per day:,${(filteredRedemptions.length / new Date(year, month, 0).getDate()).toFixed(1)}\n`;
    csvContent += `\nGenerated on:,${new Date().toISOString()}\n`;
    csvContent += `Data Retention:,6 months rolling basis\n`;
    
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

        {/* Date Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Data Filter (6-Month Retention)</CardTitle>
            <p className="text-muted-foreground">
              Filter redemptions by year and month. Data is retained for 6 months on a rolling basis.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year-select">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="month-select">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month-select">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Currently viewing: {availableMonths.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredRedemptions.length} redemptions found for this period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Redemptions */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Today's Redemptions</CardTitle>
            <p className="text-muted-foreground">
              Track which employees redeemed coupons today ({new Date().toLocaleDateString('en-IN')})
              {selectedYear !== new Date().getFullYear().toString() || selectedMonth !== (new Date().getMonth() + 1).toString() ? 
                ` - Filtered to ${availableMonths.find(m => m.value === selectedMonth)?.label} ${selectedYear}` : 
                ''
              }
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
                      {todayRedemptions.length > 0 ? new Set(todayRedemptions.map(r => r.employee_number)).size : 0}
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
                        <TableHead>Employee Details</TableHead>
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
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-base">
                                {redemption.profile?.full_name || 'Unknown Employee'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: <span className="font-mono font-semibold">{redemption.employee_number}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {redemption.profile?.company_email || 'No email'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {redemption.profile?.department || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-semibold text-success text-base">₹160</div>
                              <div className="text-xs text-muted-foreground">Meal Value</div>
                            </div>
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

        {/* Recent Filtered Month Redemptions */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>
              {availableMonths.find(m => m.value === selectedMonth)?.label} {selectedYear} Redemptions
            </CardTitle>
            <p className="text-muted-foreground">
              All redemptions for the selected month ({filteredRedemptions.length} total)
            </p>
          </CardHeader>
          <CardContent>
            {loadingRedemptions ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">Loading redemptions...</p>
              </div>
            ) : filteredRedemptions.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Employee Details</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRedemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {new Date(redemption.redemption_date).toLocaleDateString('en-IN')}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {new Date(redemption.redemption_time).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {redemption.profile?.full_name || 'Unknown Employee'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: <span className="font-mono font-semibold">{redemption.employee_number}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {redemption.profile?.company_email || 'No email'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {redemption.profile?.department || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-success">₹160</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">
                  No redemptions found for {availableMonths.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try selecting a different month or year
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                  Report Period: {availableMonths.find(m => m.value === selectedMonth)?.label} {selectedYear} ({filteredRedemptions.length} records)
                </p>
                <p className="text-xs text-muted-foreground">
                  Detailed CSV includes: Employee names, IDs, departments, and redemption times
                </p>
                <p className="text-xs text-muted-foreground">
                  Data Retention: 6 months rolling basis • Current filter: {availableMonths.find(m => m.value === selectedMonth)?.label} {selectedYear}
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