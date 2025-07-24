import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import QRCode from 'react-qr-code';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  empNo: string;
}

interface CouponDisplayProps {
  employee: Employee;
  onLogout: () => void;
}

interface Coupon {
  id: string;
  employeeId: string;
  date: string;
  value: number;
  status: 'valid' | 'used' | 'expired';
  claimedAt: string;
  redeemedAt?: string;
  token: string;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({ employee, onLogout }) => {
  const [todaysCoupon, setTodaysCoupon] = useState<Coupon | null>(null);
  const [isWeekday, setIsWeekday] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkTodaysCoupon();
    updateTimeUntilReset();
    
    const interval = setInterval(updateTimeUntilReset, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkTodaysCoupon = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekdayToday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    setIsWeekday(isWeekdayToday);

    const dateKey = today.toISOString().split('T')[0];
    const couponKey = `coupon_${employee.id}_${dateKey}`;
    const savedCoupon = localStorage.getItem(couponKey);

    if (savedCoupon) {
      setTodaysCoupon(JSON.parse(savedCoupon));
    }
  };

  const updateTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const claimTodaysCoupon = () => {
    if (!isWeekday) {
      toast({
        title: "Weekend Day",
        description: "Coupons are only available on weekdays (Monday to Friday).",
        variant: "destructive",
      });
      return;
    }

    if (todaysCoupon) {
      toast({
        title: "Already Claimed",
        description: "You have already claimed today's coupon.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    
    // Generate JWT-like token (in real app, this would come from backend)
    const token = btoa(JSON.stringify({
      uid: employee.id,
      amt: 160,
      date: dateKey,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      jti: `${employee.id}_${dateKey}`
    }));

    const newCoupon: Coupon = {
      id: `coupon_${employee.id}_${dateKey}`,
      employeeId: employee.id,
      date: dateKey,
      value: 160,
      status: 'valid',
      claimedAt: today.toISOString(),
      token
    };

    const couponKey = `coupon_${employee.id}_${dateKey}`;
    localStorage.setItem(couponKey, JSON.stringify(newCoupon));
    setTodaysCoupon(newCoupon);

    toast({
      title: "Coupon Claimed!",
      description: "Your daily meal coupon is ready to use.",
    });
  };

  const getCouponStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-coupon-valid';
      case 'used': return 'bg-coupon-used';
      case 'expired': return 'bg-coupon-expired';
      default: return 'bg-muted';
    }
  };

  const getCouponStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'used': return 'Used';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-card">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{employee.name}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {employee.empNo}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Today's Date & Status */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <Badge variant={isWeekday ? "default" : "destructive"}>
                {isWeekday ? "Weekday - Coupon Available" : "Weekend - No Coupons"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Section */}
        {isWeekday && (
          <Card className={`shadow-elevated transition-spring ${
            todaysCoupon ? 'bg-gradient-coupon border-coupon-valid' : ''
          }`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <span>🍽️</span>
                Daily Meal Coupon
              </CardTitle>
              <p className="text-2xl font-bold text-primary">₹160</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysCoupon ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={getCouponStatusColor(todaysCoupon.status)}>
                      {getCouponStatusText(todaysCoupon.status)}
                    </Badge>
                  </div>
                  
                  {todaysCoupon.status === 'valid' && (
                    <div className="bg-white p-6 rounded-lg border-2 border-coupon-valid shadow-coupon">
                      <div className="text-center mb-4">
                        <p className="text-sm font-medium text-coupon-valid">Scan at Kiosk</p>
                      </div>
                      <div className="flex justify-center">
                        <QRCode
                          value={todaysCoupon.token}
                          size={200}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-xs text-muted-foreground">
                          Claimed: {new Date(todaysCoupon.claimedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {todaysCoupon.status === 'used' && (
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="font-medium">Coupon Used</p>
                      <p className="text-sm text-muted-foreground">
                        Redeemed: {todaysCoupon.redeemedAt ? new Date(todaysCoupon.redeemedAt).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-4xl">🎫</div>
                  <p className="text-muted-foreground">You haven't claimed today's coupon yet</p>
                  <Button 
                    onClick={claimTodaysCoupon}
                    className="w-full transition-spring hover:scale-105"
                    size="lg"
                  >
                    Claim Today's Coupon
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reset Timer */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Next coupon available in:</p>
              <p className="text-2xl font-mono font-bold text-primary">{timeUntilReset}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};