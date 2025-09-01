import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Upload, 
  Save, 
  ArrowLeft,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Palette,
  Store,
  Shield
} from 'lucide-react';

interface CompanySettingsData {
  id?: string;
  company_name: string;
  company_address: string;
  email: string;
  contact_number: string;
  gst_number: string;
  gst_percentage: number;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  currency: string;
  coupon_value: number;
}

interface VendorSettingsData {
  id?: string;
  vendor_name: string;
  vendor_address: string;
  vendor_email: string;
  vendor_contact: string;
  vendor_gst_number: string;
  vendor_gst_percentage: number;
  vendor_logo_url: string;
  vendor_primary_color: string;
  service_description: string;
}

interface CompanySettingsProps {
  onBack: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<CompanySettingsData>({
    company_name: 'AutoRABIT Technologies Pvt Ltd',
    company_address: 'Bangalore, Karnataka, India',
    email: 'info@autorabit.com',
    contact_number: '+91-80-xxxx-xxxx',
    gst_number: '',
    gst_percentage: 18.0,
    logo_url: '/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png',
    favicon_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    currency: '₹',
    coupon_value: 160
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const { toast } = useToast();
  const { isAutorabitAdmin } = useAdminRole();

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company settings:', error);
      } else if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          coupon_value: data.coupon_value || 160,
          gst_percentage: data.gst_percentage || 18.0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettingsData, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadLogo = async (file: File) => {
    if (!isAutorabitAdmin) {
      toast({
        title: "Access Denied",
        description: "Only AutoRABIT administrators can upload logos.",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      if (urlData) {
        setSettings(prev => ({
          ...prev,
          logo_url: urlData.publicUrl
        }));
        
        toast({
          title: "Logo Uploaded",
          description: "Company logo has been uploaded successfully.",
        });
      }
    } catch (error: any) {
      console.error('Logo upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive"
        });
        return;
      }
      
      uploadLogo(file);
    }
  };

  const saveSettings = async () => {
    if (!isAutorabitAdmin) {
      toast({
        title: "Access Denied",
        description: "Only AutoRABIT administrators can modify settings.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Check if settings exist
      const { data: existing, error: fetchError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const settingsToSave = {
        company_name: settings.company_name,
        company_address: settings.company_address,
        email: settings.email,
        contact_number: settings.contact_number,
        gst_number: settings.gst_number,
        gst_percentage: settings.gst_percentage,
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        currency: settings.currency,
        coupon_value: settings.coupon_value
      };

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('company_settings')
          .update(settingsToSave)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new settings record
        const { error } = await supabase
          .from('company_settings')
          .insert(settingsToSave);
        
        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Company settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
          </div>
          <p className="text-lg font-semibold">Loading Company Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img 
                src={settings.logo_url || "/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png"} 
                alt="Company Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <Building2 className="h-8 w-8" />
              Company Settings
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Configure company details for invoices and branding
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={isAutorabitAdmin ? "default" : "destructive"}>
                {isAutorabitAdmin ? "Admin Access" : "Read Only"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Company Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  disabled={!isAutorabitAdmin}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst-number">GST Number</Label>
                <Input
                  id="gst-number"
                  value={settings.gst_number}
                  onChange={(e) => handleInputChange('gst_number', e.target.value)}
                  disabled={!isAutorabitAdmin}
                  placeholder="Enter GST number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst-percentage">GST Percentage (%)</Label>
                <Input
                  id="gst-percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.gst_percentage}
                  onChange={(e) => handleInputChange('gst_percentage', parseFloat(e.target.value) || 0)}
                  disabled={!isAutorabitAdmin}
                  placeholder="18.0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Currency
                </Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  disabled={!isAutorabitAdmin}
                  placeholder="₹"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea
                id="company-address"
                value={settings.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                disabled={!isAutorabitAdmin}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isAutorabitAdmin}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Number
                </Label>
                <Input
                  id="contact-number"
                  value={settings.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  disabled={!isAutorabitAdmin}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo & Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {settings.logo_url ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Company Logo" 
                    className="w-full h-full object-contain rounded-lg" 
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={!isAutorabitAdmin || uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button 
                      variant="outline" 
                      disabled={!isAutorabitAdmin || uploadingLogo}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended size: 200x200px, Max 2MB (PNG, JPG, SVG)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Primary Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    disabled={!isAutorabitAdmin}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    disabled={!isAutorabitAdmin}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    disabled={!isAutorabitAdmin}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    disabled={!isAutorabitAdmin}
                    placeholder="#10b981"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Coupon Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="coupon-value">Coupon Value per Meal</Label>
              <div className="flex items-center gap-2">
                <span className="text-lg">{settings.currency}</span>
                <Input
                  id="coupon-value"
                  type="number"
                  value={settings.coupon_value}
                  onChange={(e) => handleInputChange('coupon_value', parseFloat(e.target.value) || 0)}
                  disabled={!isAutorabitAdmin}
                  className="w-32"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This value will be used for all invoice calculations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button 
                onClick={saveSettings} 
                disabled={!isAutorabitAdmin || saving}
                size="lg"
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
            {!isAutorabitAdmin && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Only AutoRABIT administrators can modify company settings
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};