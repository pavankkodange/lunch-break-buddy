import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DayStats {
  date: string;
  claimed: number;
  redeemed: number;
  value: number;
}

export const AdminDashboard: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<DayStats[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState({ redeemed: 0, value: 0 });
  const { toast } = useToast();

  useEffect(() => {
    generateStats();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <span className="text-3xl">📊</span>
              Food Coupon Admin Dashboard
            </CardTitle>
            <p className="text-muted-foreground">Monitor coupon usage and generate billing reports</p>
          </CardHeader>
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
                className="w-full transition-spring hover:scale-105"
                size="lg"
              >
                Export Monthly Report (CSV)
              </Button>

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