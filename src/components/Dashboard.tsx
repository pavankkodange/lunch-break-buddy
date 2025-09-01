import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  QrCode,
  User,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  todayRedemptions: number;
  todayValue: number;
  weeklyRedemptions: number;
  weeklyValue: number;
  monthlyRedemptions: number;
  monthlyValue: number;
  uniqueEmployees: number;
  recentActivity: any[];
  todayActivity: any[];
}

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    todayRedemptions: 0,
    todayValue: 0,
    weeklyRedemptions: 0,
    weeklyValue: 0,
    monthlyRedemptions: 0,
    monthlyValue: 0,
    uniqueEmployees: 0,
    recentActivity: [],
    todayActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { user, isAutorabitEmployee } = useAuth();
  const { adminRole, isAutorabitAdmin, hasHRAccess, loading: roleLoading } = useAdminRole();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get start of week (Monday)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // Get start of month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // Fetch today's redemptions with profile data
      const { data: todayData, error: todayError } = await supabase
        .from('meal_redemptions')
        .select(`
          *,
          profiles!fk_meal_redemptions_user_id(
            full_name,
            department
          )
        `)
        .eq('redemption_date', todayStr)
        .order('redemption_time', { ascending: false });

      // Fetch this week's redemptions
      const { data: weekData, error: weekError } = await supabase
        .from('meal_redemptions')
        .select('*')
        .gte('redemption_date', weekStartStr)
        .lte('redemption_date', todayStr);

      // Fetch this month's redemptions with profile data
      const { data: monthData, error: monthError } = await supabase
        .from('meal_redemptions')
        .select(`
          *,
          profiles!fk_meal_redemptions_user_id(
            full_name,
            department
          )
        `)
        .gte('redemption_date', monthStartStr)
        .lte('redemption_date', todayStr)
        .order('redemption_time', { ascending: false })
        .limit(10);

      if (!todayError && todayData) {
        const todayCount = todayData.length;
        const todayActivityFormatted = todayData.map(item => ({
          ...item,
          profile: item.profiles
        }));
        
        if (!weekError && weekData) {
          const weekCount = weekData.length;
          
          if (!monthError && monthData) {
            const monthCount = monthData.length;
            const uniqueEmployees = new Set(monthData.map(r => r.employee_number)).size;
            
            setStats({
              todayRedemptions: todayCount,
              todayValue: todayCount * 160,
              weeklyRedemptions: weekCount,
              weeklyValue: weekCount * 160,
              monthlyRedemptions: monthCount,
              monthlyValue: monthCount * 160,
              uniqueEmployees,
              recentActivity: monthData.slice(0, 5).map(item => ({
                ...item,
                profile: item.profiles
              })),
              todayActivity: todayActivityFormatted
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: any; 
    trend?: string;
  }) => (
    <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-xs text-success">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    variant = "default",
    disabled = false 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    onClick: () => void; 
    variant?: "default" | "secondary" | "outline";
    disabled?: boolean;
  }) => (
    <Card className="shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            variant === "default" ? "bg-primary text-primary-foreground" :
            variant === "secondary" ? "bg-secondary text-secondary-foreground" :
            "bg-muted text-muted-foreground"
          } ${disabled ? "opacity-50" : ""}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            {disabled && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Requires @autorabit.com email
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="text-lg font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user has access (HR employees or vendors)
  const isVendor = !isAutorabitEmployee;
  if (!hasHRAccess && !isVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <Card className="shadow-elevated">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4">
                <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
              </div>
              <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <div className="text-6xl">🚫</div>
                <p className="text-lg font-semibold">HR or Vendor Access Required</p>
                <p className="text-muted-foreground">
                  This dashboard is accessible to HR administrators and vendors only. Your current role is: 
                  <Badge variant="secondary" className="ml-2">
                    {adminRole || 'Employee'}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Regular employees can access the Employee Portal. If you believe you should have dashboard access, please contact your system administrator.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => onNavigate('employee')}
                  variant="default"
                  disabled={!isAutorabitEmployee}
                >
                  Go to Employee Portal
                </Button>
                <Button 
                  onClick={() => onNavigate('reports')}
                  variant="outline"
                >
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <BarChart3 className="h-8 w-8" />
              Food Coupon Dashboard
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.email}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={isAutorabitEmployee ? "default" : "secondary"}>
                {isAutorabitEmployee ? "AutoRABIT Employee" : "External User"}
              </Badge>
              {hasHRAccess && (
                <Badge variant="default">
                  HR Dashboard Access
                </Badge>
              )}
              {isVendor && (
                <Badge variant="secondary">
                  Vendor Access
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Meals"
            value={stats.todayRedemptions}
            subtitle={`₹${stats.todayValue} value`}
            icon={Calendar}
          />
          <StatCard
            title="This Week"
            value={stats.weeklyRedemptions}
            subtitle={`₹${stats.weeklyValue} total`}
            icon={Activity}
          />
          <StatCard
            title="This Month"
            value={stats.monthlyRedemptions}
            subtitle={`₹${stats.monthlyValue} total`}
            icon={DollarSign}
          />
          <StatCard
            title="Active Employees"
            value={stats.uniqueEmployees}
            subtitle="This month"
            icon={Users}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAutorabitEmployee && (
            <ActionCard
              title="Employee Portal"
              description="View status and scan for meals"
              icon={User}
              onClick={() => onNavigate('employee')}
            />
          )}
          <ActionCard
            title="Reports & Invoices"
            description={isAutorabitEmployee ? "Monthly coupon reports" : "Generate invoices (daily/weekly/monthly)"}
            icon={BarChart3}
            onClick={() => onNavigate('reports')}
            variant="secondary"
          />
          <ActionCard
            title="Vendor QR Code"
            description="Display QR for employees to scan"
            icon={QrCode}
            onClick={() => onNavigate('vendor_qr')}
            variant="outline"
          />
        </div>

        {/* Daily Redemptions Table */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Daily Redemptions Log
            </CardTitle>
            <p className="text-muted-foreground">Complete list of today's meal redemptions</p>
          </CardHeader>
          <CardContent>
            {stats.todayRedemptions === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">No redemptions today</p>
                <p className="text-sm text-muted-foreground">Redemptions will appear here as employees scan for meals</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.todayRedemptions}</p>
                    <p className="text-sm text-muted-foreground">Total Redemptions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">₹{stats.todayValue}</p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">
                      {new Set(stats.todayActivity?.map(r => r.employee_number) || []).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique Employees</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-semibold">S.No</th>
                          <th className="text-left p-3 font-semibold">Time</th>
                          <th className="text-left p-3 font-semibold">Employee Name</th>
                          <th className="text-left p-3 font-semibold">Employee ID</th>
                          <th className="text-left p-3 font-semibold">Department</th>
                          <th className="text-left p-3 font-semibold">Value</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.todayActivity || []).map((activity, index) => (
                          <tr key={activity.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-mono text-sm">{String(index + 1).padStart(3, '0')}</td>
                            <td className="p-3 text-sm">
                              {new Date(activity.redemption_time).toLocaleTimeString('en-IN', {
                                hour12: true,
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">
                                {activity.profile?.full_name || 'N/A'}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-sm">
                              {activity.employee_number}
                            </td>
                            <td className="p-3 text-sm">
                              {activity.profile?.department || 'N/A'}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-success">₹160</span>
                            </td>
                            <td className="p-3">
                              <Badge variant="default" className="bg-success">
                                Redeemed
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => onNavigate('reports')} 
                    variant="outline"
                  >
                    View Detailed Reports
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-semibold">Meal Value</p>
                <p className="text-2xl font-bold text-primary">₹160</p>
                <p className="text-sm text-muted-foreground">Per redemption</p>
              </div>
              <div>
                <p className="font-semibold">Availability</p>
                <p className="text-lg font-bold">Weekdays Only</p>
                <p className="text-sm text-muted-foreground">Monday - Friday</p>
              </div>
              <div>
                <p className="font-semibold">Today</p>
                <p className="text-lg font-bold">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};