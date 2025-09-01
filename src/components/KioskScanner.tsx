import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Scanner } from './ui/scanner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  success: boolean;
  employeeName?: string;
  employeeId?: string;
  department?: string;
  amount?: number;
  message: string;
  timestamp: string;
}

export const KioskScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const { toast } = useToast();

  const handleScan = async (qrData: string) => {
    setIsScanning(false);
    
    try {
      // Decode employee QR code
      const employeeData = JSON.parse(atob(qrData));
      const { employeeId, empNo, name, type } = employeeData;

      // Validate it's an employee QR code
      if (type !== 'employee_id' || !employeeId || !empNo || !name) {
        const result: ScanResult = {
          success: false,
          message: "Invalid employee QR code",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        return;
      }

      // Check if it's a weekday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      
      if (!isWeekday) {
        const result: ScanResult = {
          success: false,
          employeeName: name,
          employeeId: empNo,
          message: "Meals are only available on weekdays",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        return;
      }

      // Check if already redeemed today in database
      const dateKey = today.toISOString().split('T')[0];
      
      const { data: existingRedemption } = await supabase
        .from('meal_redemptions')
        .select('*')
        .eq('employee_number', empNo)
        .eq('redemption_date', dateKey)
        .single();
      
      if (existingRedemption) {
        const result: ScanResult = {
          success: false,
          employeeName: name,
          employeeId: empNo,
          message: "Meal already taken today",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        
        toast({
          title: "Already Redeemed",
          description: `${name} has already taken today's meal`,
          variant: "destructive",
        });
        return;
      }

      // Record the redemption in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, department')
        .eq('employee_number', empNo)
        .single();

      if (profile) {
        const { error: redemptionError } = await supabase
          .from('meal_redemptions')
          .insert({
            user_id: profile.user_id,
            employee_number: empNo,
            redemption_date: dateKey
          });

        if (redemptionError) {
          console.error('Failed to record redemption:', redemptionError);
        }
      }

      const result: ScanResult = {
        success: true,
        employeeName: name,
        employeeId: empNo,
        department: profile?.department || 'N/A',
        amount: 160,
        message: `Meal successfully provided for ₹160`,
        timestamp: new Date().toISOString()
      };

      addScanResult(result);
      setDailyCount(prev => prev + 1);

      toast({
        title: "Success!",
        description: `Meal provided for ${name}`,
      });

    } catch (error) {
      const result: ScanResult = {
        success: false,
        message: "Invalid QR code format",
        timestamp: new Date().toISOString()
      };
      addScanResult(result);
      
      toast({
        title: "Invalid Code",
        description: "The scanned QR code is not valid",
        variant: "destructive",
      });
    }
  };

  const addScanResult = (result: ScanResult) => {
    setRecentScans(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
  };

  const getTodayStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, count } = await supabase
      .from('meal_redemptions')
      .select('*', { count: 'exact' })
      .eq('redemption_date', today);
    
    return count || 0;
  };

  React.useEffect(() => {
    getTodayStats().then(setDailyCount);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <span className="text-3xl">📱</span>
              Food Coupon Kiosk Scanner
            </CardTitle>
            <p className="text-muted-foreground">Scan employee QR codes to redeem meal coupons</p>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{dailyCount}</div>
              <p className="text-sm text-muted-foreground">Today's Redemptions</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success">₹{dailyCount * 160}</div>
              <p className="text-sm text-muted-foreground">Today's Total Value</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-lg font-bold text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning ? (
                <div className="text-center space-y-4">
                  <div className="text-6xl">📷</div>
                  <Button 
                    onClick={() => setIsScanning(true)}
                    size="lg"
                    className="w-full transition-spring hover:scale-105"
                  >
                    Start Scanning
                  </Button>
                </div>
              ) : (
                <Scanner
                  onScan={handleScan}
                  onClose={() => setIsScanning(false)}
                  isActive={isScanning}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentScans.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No scans yet today
                  </p>
                ) : (
                  recentScans.map((scan, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={scan.success ? "default" : "destructive"}>
                          {scan.success ? "Success" : "Failed"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(scan.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {scan.employeeName && (
                        <div className="space-y-1">
                          <p className="font-medium">{scan.employeeName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {scan.employeeId && <span>ID: {scan.employeeId}</span>}
                            {scan.department && <span>• {scan.department}</span>}
                          </div>
                        </div>
                      )}
                      
                      {scan.amount && (
                        <p className="text-success font-semibold">₹{scan.amount}</p>
                      )}
                      
                      <p className="text-sm text-muted-foreground">{scan.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};