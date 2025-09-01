import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Scanner } from './ui/scanner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  company_email: string;
  department: string | null;
}

interface EmployeeScannerProps {
  onBack: () => void;
}

export const EmployeeScanner: React.FC<EmployeeScannerProps> = ({ onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [todayRedeemed, setTodayRedeemed] = useState(false);
  const [isWeekday, setIsWeekday] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkWeekdayAndRedemption();
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      checkTodayRedemption();
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

  const checkWeekdayAndRedemption = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekdayToday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    setIsWeekday(isWeekdayToday);
  };

  const checkTodayRedemption = async () => {
    if (!profile) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data: existingRedemption } = await supabase
      .from('meal_redemptions')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('redemption_date', today)
      .single();
    
    setTodayRedeemed(!!existingRedemption);
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

      // Update local state
      setTodayRedeemed(true);

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
          <Button onClick={() => window.location.reload()} variant="default">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          ← Back
        </Button>
      </div>
      
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-xl">Scan for Meal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Welcome, {profile.full_name}
            </p>
          </CardHeader>
        </Card>

        {/* Status Card */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-lg font-semibold">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <div className="flex gap-2 justify-center">
                <Badge variant={isWeekday ? "default" : "destructive"}>
                  {isWeekday ? "Weekday - Available" : "Weekend - Unavailable"}
                </Badge>
                <Badge variant={todayRedeemed ? "destructive" : "secondary"}>
                  {todayRedeemed ? "Already Redeemed" : "Not Redeemed"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Card */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-center">
              {todayRedeemed ? "Already Redeemed Today" : "Scan Vendor QR Code"}
            </CardTitle>
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
                  Scan the vendor QR code at the cafeteria counter
                </p>
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

        {/* Instructions */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">How to redeem:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Go to the cafeteria counter</p>
                <p>2. Tap "Start Scanning" above</p>
                <p>3. Scan the vendor QR code</p>
                <p>4. Enjoy your ₹160 meal!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};