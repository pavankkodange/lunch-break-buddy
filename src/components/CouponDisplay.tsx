import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import QRCode from 'react-qr-code';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CouponDisplayProps {
  onLogout: () => void;
  onBack: () => void;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({ onLogout, onBack }) => {
  const [isWeekday, setIsWeekday] = useState(false);
  const [todayRedeemed, setTodayRedeemed] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const { profile, signOut } = useAuth();

  useEffect(() => {
    checkWeekdayAndRedemption();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      fetchRedemptions();
    }
  }, [profile]);

  const fetchRedemptions = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('meal_redemptions')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('redemption_date', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRedemptions(data);
      
      // Check if redeemed today
      const today = new Date().toISOString().split('T')[0];
      const todayRedemption = data.find(r => r.redemption_date === today);
      setTodayRedeemed(!!todayRedemption);
    }
  };

  const checkWeekdayAndRedemption = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekdayToday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    setIsWeekday(isWeekdayToday);
  };

  // Generate permanent employee QR code
  const generateEmployeeQR = () => {
    if (!profile) return '';
    
    return btoa(JSON.stringify({
      employeeId: profile.user_id,
      empNo: profile.employee_number,
      name: profile.full_name,
      type: 'employee_id'
    }));
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          ← Back to Home
        </Button>
      </div>
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-card">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {profile.employee_number}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
                {isWeekday ? "Weekday - Meal Available" : "Weekend - No Meals"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Employee QR Code */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <span>🍽️</span>
              Your Employee QR Code
            </CardTitle>
            <p className="text-lg text-muted-foreground">Show this at the kiosk for meals</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayRedeemed ? (
              <div className="bg-muted p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-medium text-lg">Meal Already Taken Today</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Come back tomorrow for your next meal
                </p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg border-2 border-primary shadow-coupon">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-primary">
                    {isWeekday ? "Scan at Kiosk for ₹160 Meal" : "Available on Weekdays Only"}
                  </p>
                </div>
                <div className="flex justify-center">
                  <QRCode
                    value={generateEmployeeQR()}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <div className="text-center mt-4 space-y-1">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">ID: {profile.employee_number}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Redemptions */}
        {redemptions.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Recent Meal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {redemptions.slice(0, 5).map((redemption) => (
                  <div key={redemption.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{new Date(redemption.redemption_date).toLocaleDateString('en-IN')}</span>
                    <Badge variant="secondary" className="text-xs">Redeemed</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">How it works:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Show your QR code at the kiosk</p>
                <p>2. One meal per day (weekdays only)</p>
                <p>3. ₹160 value per meal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};