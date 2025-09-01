import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Scanner } from './ui/scanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  company_email: string;
  department: string | null;
}

interface CouponDisplayProps {
  onLogout: () => void;
  onBack: () => void;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({ onLogout, onBack }) => {
  const [isWeekday, setIsWeekday] = useState(false);
  const [todayRedeemed, setTodayRedeemed] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkWeekdayAndRedemption();
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchRedemptions();
    }
  }, [profile]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_or_get_profile', {
        p_user_id: user.id,
        p_employee_number: user.user_metadata?.employee_number || null,
        p_full_name: user.user_metadata?.full_name || '',
        p_company_email: user.user_metadata?.company_email || user.email || ''
      });

      if (error) {
        console.error('Profile fetch error:', error);
      } else if (data && data.length > 0) {
        const { id, user_id, employee_number, full_name, company_email, department } = data[0];
        setProfile({ id, user_id, employee_number, full_name, company_email, department });
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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

  const handleScan = async (qrData: string) => {
    setIsScanning(false);
    
    if (!profile) {
      toast({
        title: "Error",
        description: "Profile not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Decode vendor QR code
      const vendorData = JSON.parse(atob(qrData));
      const { vendorId, type } = vendorData;

      // Validate it's a vendor QR code
      if (type !== 'vendor_redemption' || vendorId !== 'autorabit-cafeteria') {
        toast({
          title: "Invalid QR Code",
          description: "Please scan the correct vendor QR code for meal redemption.",
          variant: "destructive",
        });
        return;
      }

      // Check if it's a weekday
      if (!isWeekday) {
        toast({
          title: "Not Available",
          description: "Meals are only available on weekdays (Monday to Friday).",
          variant: "destructive",
        });
        return;
      }

      // Check if already redeemed today
      if (todayRedeemed) {
        toast({
          title: "Already Redeemed",
          description: "You have already taken your meal for today.",
          variant: "destructive",
        });
        return;
      }

      // Record the redemption
      const today = new Date().toISOString().split('T')[0];
      const { error: redemptionError } = await supabase
        .from('meal_redemptions')
        .insert({
          user_id: profile.user_id,
          employee_number: profile.employee_number,
          redemption_date: today
        });

      if (redemptionError) {
        console.error('Failed to record redemption:', redemptionError);
        toast({
          title: "Error",
          description: "Failed to record your meal redemption. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state and refresh data
      setTodayRedeemed(true);
      fetchRedemptions(); // Refresh the redemptions list

      toast({
        title: "Success! 🎉",
        description: `Meal successfully redeemed for ₹160. Enjoy your meal, ${profile.full_name}!`,
      });

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Invalid QR Code",
        description: "The scanned QR code is not valid. Please scan the vendor QR code.",
        variant: "destructive",
      });
    }
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

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="mt-2">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="text-lg font-semibold">Profile Setup Required</p>
          <p className="text-muted-foreground">Unable to load your profile. Please try refreshing the page.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="default">
              Refresh Page
            </Button>
            <Button onClick={onBack} variant="outline">
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
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
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
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

        {/* Meal Redemption Scanner */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <span>🍽️</span>
              {todayRedeemed ? "Meal Status" : "Scan for Meal"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {todayRedeemed ? "Already redeemed today" : "Scan vendor QR code at cafeteria"}
            </p>
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
            ) : !isWeekday ? (
              <div className="bg-muted p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">📅</div>
                <p className="font-medium text-lg">Meals Not Available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Meals are only available on weekdays
                </p>
              </div>
            ) : !isScanning ? (
              <div className="text-center space-y-4">
                <div className="text-6xl">📷</div>
                <p className="text-sm text-muted-foreground">
                  Go to cafeteria counter and scan the vendor QR code
                </p>
                <Button 
                  onClick={() => setIsScanning(true)}
                  size="lg"
                  className="w-full transition-spring hover:scale-105"
                >
                  Start Scanning for ₹160 Meal
                </Button>
                <div className="pt-2 text-center">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">ID: {profile.employee_number}</p>
                </div>
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
                <p>1. Go to the cafeteria counter</p>
                <p>2. Use "Scan for Meal" to scan vendor QR code</p>
                <p>3. One meal per day (weekdays only)</p>
                <p>4. ₹160 value per meal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};