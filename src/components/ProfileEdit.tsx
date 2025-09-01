import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Profile {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  company_email: string;
  department: string | null;
}

interface ProfileEditProps {
  onBack: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formData, setFormData] = useState({
    employee_number: '',
    full_name: '',
    company_email: user?.email || '',
    department: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log('Setting form data from profile:', profile);
      setFormData({
        employee_number: profile.employee_number || '',
        full_name: profile.full_name || '',
        company_email: profile.company_email || user?.email || '',
        department: profile.department || ''
      });
    } else if (user && !profileLoading) {
      // If no profile but user exists and we're not loading, pre-fill with user data
      console.log('No profile found, pre-filling with user data');
      setFormData({
        employee_number: user.user_metadata?.employee_number || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        company_email: user.email || '',
        department: ''
      });
    }
  }, [profile, user, profileLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Profile fetch error:', fetchError);
      }

      if (existingProfile) {
        // Profile exists, use it
        console.log('Found existing profile:', existingProfile);
        setProfile(existingProfile);
      } else {
        // No profile found, try to create one using RPC
        console.log('No profile found, creating new profile via RPC');
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_or_get_profile', {
          p_user_id: user.id,
          p_employee_number: user.user_metadata?.employee_number || null,
          p_full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          p_company_email: user.user_metadata?.company_email || user.email || ''
        });

        if (rpcError) {
          console.error('Profile RPC error:', rpcError);
        } else if (rpcData && rpcData.length > 0) {
          console.log('Created profile via RPC:', rpcData[0]);
          const { id, user_id, employee_number, full_name, company_email, department } = rpcData[0];
          setProfile({ id, user_id, employee_number, full_name, company_email, department });
        }
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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

  const handleCreateProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please try logging out and back in.",
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
      console.log('Creating new profile for user:', user.id);

      // Check if employee number is already taken
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id, employee_number')
        .eq('employee_number', formData.employee_number.trim())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking employee number:', checkError);
        toast({
          title: "Validation Error",
          description: `Failed to validate employee number: ${checkError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (existingProfile) {
        console.log('Employee number already taken by user:', existingProfile.user_id);
        toast({
          title: "Employee Number Taken",
          description: `Employee number "${formData.employee_number}" is already in use. Please choose a different one.`,
          variant: "destructive"
        });
        return;
      }

      // Create the profile
      const { error: insertError, data: insertData } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          employee_number: formData.employee_number.trim(),
          full_name: formData.full_name.trim(),
          company_email: formData.company_email.trim(),
          department: formData.department || null
        })
        .select();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        toast({
          title: "Creation Failed",
          description: `Failed to create profile: ${insertError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Profile created successfully:', insertData);
      
      if (insertData && insertData.length > 0) {
        setProfile(insertData[0]);
      }

      toast({
        title: "Profile Created",
        description: "Your profile has been successfully created!",
      });

      // Small delay to allow user to see the success message
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.user_id) {
      // If no profile exists, create one instead
      return handleCreateProfile();
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
      console.log('Starting profile update for user:', profile.user_id);
      console.log('Updating employee number to:', formData.employee_number);
      console.log('Current employee number:', profile.employee_number);

      // Skip employee number check if it's the same as current
      if (formData.employee_number.trim() !== profile.employee_number) {
        console.log('Checking if employee number is available...');
        
        // Check if employee number is already taken by another user
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('user_id, employee_number')
          .eq('employee_number', formData.employee_number.trim())
          .neq('user_id', profile.user_id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking employee number:', checkError);
          toast({
            title: "Validation Error",
            description: `Failed to validate employee number: ${checkError.message}`,
            variant: "destructive"
          });
          return;
        }

        if (existingProfile) {
          console.log('Employee number already taken by user:', existingProfile.user_id);
          toast({
            title: "Employee Number Taken",
            description: `Employee number "${formData.employee_number}" is already in use. Please choose a different one.`,
            variant: "destructive"
          });
          return;
        }
        
        console.log('Employee number is available');
      } else {
        console.log('Employee number unchanged, skipping validation');
      }

      console.log('Proceeding with profile update...');

      // Update the profile
      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({
          employee_number: formData.employee_number.trim(),
          full_name: formData.full_name.trim(),
          company_email: formData.company_email.trim(),
          department: formData.department || null
        })
        .eq('user_id', profile.user_id)
        .select();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        
        // Provide more specific error messages
        if (updateError.code === '23505') {
          toast({
            title: "Duplicate Employee Number",
            description: `Employee number "${formData.employee_number}" is already in use. Please choose a unique employee number.`,
            variant: "destructive"
          });
        } else if (updateError.message.includes('violates row-level security')) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to update this profile. Please try logging out and back in.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Update Failed",
            description: `Failed to update profile: ${updateError.message}`,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Profile updated successfully:', updateData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated. Changes will be visible after refreshing.",
      });

      // Small delay to allow user to see the success message
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  if (!profile && !profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={onBack} variant="outline">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Create Profile</h1>
          </div>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Setup Your Profile
              </CardTitle>
              <p className="text-muted-foreground">
                Let's set up your profile information. This will help identify you in the system.
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
                  onClick={handleCreateProfile}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating Profile...' : 'Create Profile'}
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
        </div>
      </div>
    );
  }

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