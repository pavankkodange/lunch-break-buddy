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
  Store,
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
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { user, isAutorabitEmployee } = useAuth();
  const { adminRole, isAutorabitAdmin } = useAdminRole();

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

      // Fetch today's redemptions
      const { data: todayData, error: todayError } = await supabase
        .from('meal_redemptions')
        .select('*')
        .eq('redemption_date', todayStr);

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
              }))
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

  if (loading) {
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
              {isAutorabitAdmin && (
                <Badge variant="default">
                  Admin Access
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
          <ActionCard
            title="Employee Portal"
            description="View status and scan for meals"
            icon={User}
            onClick={() => onNavigate('employee')}
            disabled={!isAutorabitEmployee}
          />
          <ActionCard
            title="Kiosk & Admin"
            description="Scan QR codes and view data"
            icon={Store}
            onClick={() => onNavigate('kiosk_admin')}
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

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <p className="text-muted-foreground">Latest meal redemptions this month</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {activity.profile?.full_name || `Employee ${activity.employee_number}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.profile?.department || 'N/A'} • ID: {activity.employee_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">₹160</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.redemption_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={() => onNavigate('kiosk_admin')} 
                  variant="outline" 
                  className="w-full"
                >
                  View Full Admin Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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