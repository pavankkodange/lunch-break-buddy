import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Scanner } from './ui/scanner';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  success: boolean;
  employeeName?: string;
  employeeId?: string;
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
      // Decode and validate the JWT token
      const tokenData = JSON.parse(atob(qrData));
      const { uid, amt, date, exp, jti } = tokenData;

      // Check if token is expired
      if (exp < Math.floor(Date.now() / 1000)) {
        const result: ScanResult = {
          success: false,
          message: "Coupon has expired",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        return;
      }

      // Check if it's for today
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        const result: ScanResult = {
          success: false,
          message: "Coupon is not valid for today",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        return;
      }

      // Check if already used
      const usedKey = `used_${jti}`;
      if (localStorage.getItem(usedKey)) {
        const result: ScanResult = {
          success: false,
          message: "Coupon has already been used",
          timestamp: new Date().toISOString()
        };
        addScanResult(result);
        return;
      }

      // Get employee info from local storage (in real app, this would be from backend)
      const allKeys = Object.keys(localStorage);
      const employeeKey = allKeys.find(key => key.includes(uid) && key.includes('currentEmployee'));
      let employeeName = "Unknown Employee";
      
      if (employeeKey) {
        const employeeData = JSON.parse(localStorage.getItem(employeeKey) || '{}');
        employeeName = employeeData.name || employeeName;
      }

      // Mark as used
      localStorage.setItem(usedKey, new Date().toISOString());
      
      // Update the original coupon status
      const couponKey = `coupon_${uid}_${date}`;
      const couponData = localStorage.getItem(couponKey);
      if (couponData) {
        const coupon = JSON.parse(couponData);
        coupon.status = 'used';
        coupon.redeemedAt = new Date().toISOString();
        localStorage.setItem(couponKey, JSON.stringify(coupon));
      }

      const result: ScanResult = {
        success: true,
        employeeName,
        employeeId: uid,
        amount: amt,
        message: `Coupon successfully redeemed for ₹${amt}`,
        timestamp: new Date().toISOString()
      };

      addScanResult(result);
      setDailyCount(prev => prev + 1);

      toast({
        title: "Success!",
        description: `Coupon redeemed for ${employeeName}`,
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

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const usedToday = Object.keys(localStorage)
      .filter(key => key.startsWith('used_') && key.includes(today))
      .length;
    return usedToday;
  };

  React.useEffect(() => {
    setDailyCount(getTodayStats());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
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
                        <p className="font-medium">{scan.employeeName}</p>
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