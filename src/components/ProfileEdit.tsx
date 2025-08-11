import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ProfileEditProps {
  onBack: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onBack }) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: profile?.employee_number || '',
    full_name: profile?.full_name || '',
    company_email: profile?.company_email || user?.email || '',
    department: profile?.department || ''
  });

  const departments = [
    'HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 
    'Operations', 'Support', 'Legal', 'Product', 'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile?.user_id) {
      toast({
        title: "Error",
        description: "Unable to update profile. Please try logging out and back in.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.employee_number.trim() || !formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Employee number and full name are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if employee number is already taken by another user
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('employee_number', formData.employee_number)
        .neq('user_id', profile.user_id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking employee number:', checkError);
        toast({
          title: "Error",
          description: "Failed to validate employee number. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (existingProfile) {
        toast({
          title: "Employee Number Taken",
          description: "This employee number is already in use. Please choose a different one.",
          variant: "destructive"
        });
        return;
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          employee_number: formData.employee_number.trim(),
          full_name: formData.full_name.trim(),
          company_email: formData.company_email.trim(),
          department: formData.department || null
        })
        .eq('user_id', profile.user_id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Go back to previous screen
      onBack();

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Profile Information
            </CardTitle>
            <p className="text-muted-foreground">
              Update your profile details. Changes will be saved to the system.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number *</Label>
              <Input
                id="employee_number"
                type="text"
                placeholder="e.g., EMP001"
                value={formData.employee_number}
                onChange={(e) => handleInputChange('employee_number', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This number must be unique across the system
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                placeholder="your.email@company.com"
                value={formData.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Use your official company email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleInputChange('department', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Current Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Employee Number:</p>
                <p className="text-muted-foreground">{profile?.employee_number || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Full Name:</p>
                <p className="text-muted-foreground">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Company Email:</p>
                <p className="text-muted-foreground">{profile?.company_email || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium">Department:</p>
                <p className="text-muted-foreground">{profile?.department || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};