'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchSettings, updateSettings, uploadFile } from '@/lib/api';
import { toast } from "sonner"

export default function BrandingPage() {
    const [activeTab, setActiveTab] = useState<'vendor' | 'autorabit'>('vendor');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>({
        autorabit_logo_url: '',
        autorabit_favicon_url: '',
        autorabit_primary_color: '#1E40AF',
        company_name: 'AutoRabit Lunch Break Buddy',
        email: 'support@autorabit.com',
        autorabit_website: 'https://www.autorabit.com',
        autorabit_gst_number: '',
        autorabit_contact_primary: '',
        autorabit_contact_secondary: '',
        autorabit_official_address: '',
        autorabit_support_hours: '',
        vendor_name: 'AutoRabit Cafeteria',
        vendor_email: 'vendor@company.com',
        vendor_address: '',
        vendor_contact: '',
        vendor_gst_number: '',
        vendor_gst_percentage: 18,
        vendor_brand_color: '#EA580C',
        vendor_description: 'Professional meal coupon services for corporate employees',
        vendor_logo_url: ''
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await fetchSettings();
                setSettings((prev: any) => ({ ...prev, ...data }));
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(fieldName);
        try {
            const result = await uploadFile(file);
            setSettings((prev: any) => ({ ...prev, [fieldName]: result.url }));
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            toast.success('Settings saved successfully! Branding is now syncing across all platforms.');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error('Error saving settings. Please verify backend connectivity.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFF] p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Tab Navigation */}
                <div className="flex bg-blue-50/50 p-1.5 rounded-xl border border-blue-100/50 shadow-sm">
                    <button
                        onClick={() => setActiveTab('vendor')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'vendor'
                            ? 'bg-white shadow-sm text-blue-900 border border-blue-100'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Vendor Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('autorabit')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'autorabit'
                            ? 'bg-white shadow-sm text-blue-900 border border-blue-100'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        AutoRABIT Settings
                    </button>
                </div>

                {activeTab === 'vendor' ? (
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Vendor Information</h2>
                                    </div>
                                    <p className="text-gray-500 text-sm italic">Manage cafeteria identity for all vendor-facing interfaces.</p>
                                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                                        Vendor Access
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-right">
                                        <Label className="text-[12px] font-bold text-gray-500 block mb-2 uppercase">Vendor Logo</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                                                {settings.vendor_logo_url ? <img src={settings.vendor_logo_url} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Input name="vendor_logo_url" placeholder="Logo URL" className="h-8 text-xs w-32" value={settings.vendor_logo_url} onChange={handleChange} />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="vendor-logo-upload"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'vendor_logo_url')}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        className="h-6 px-2 text-[10px] text-blue-600 font-bold hover:bg-blue-50"
                                                        onClick={() => document.getElementById('vendor-logo-upload')?.click()}
                                                        disabled={uploading === 'vendor_logo_url'}
                                                    >
                                                        {uploading === 'vendor_logo_url' ? 'Uploading...' : 'Upload Local'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Vendor Display Name</Label>
                                    <Input name="vendor_name" value={settings.vendor_name} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        Vendor Email
                                    </Label>
                                    <Input name="vendor_email" value={settings.vendor_email} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Vendor Official Address</Label>
                                    <textarea
                                        name="vendor_address"
                                        value={settings.vendor_address}
                                        onChange={handleChange}
                                        className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-100 bg-white shadow-none focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm placeholder:text-gray-400"
                                        placeholder="Enter complete vendor address"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        Contact Number
                                    </Label>
                                    <Input name="vendor_contact" value={settings.vendor_contact} onChange={handleChange} placeholder="+91-XXXXX-XXXXX" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">GST Number</Label>
                                    <Input name="vendor_gst_number" value={settings.vendor_gst_number} onChange={handleChange} placeholder="Enter GST number" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">GST Percentage (%)</Label>
                                    <Input type="number" name="vendor_gst_percentage" value={settings.vendor_gst_percentage} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                                        Brand Color
                                    </Label>
                                    <div className="flex gap-4">
                                        <div style={{ backgroundColor: settings.vendor_brand_color }} className="h-14 w-16 rounded-2xl border border-gray-100 shadow-sm" />
                                        <Input name="vendor_brand_color" value={settings.vendor_brand_color} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none flex-1 focus-visible:ring-blue-600" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Service Description</Label>
                                    <textarea
                                        name="vendor_description"
                                        value={settings.vendor_description}
                                        onChange={handleChange}
                                        className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-100 bg-white shadow-none focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                                        placeholder="Professional meal coupon services for corporate employees"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center pt-10">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-[#0066FF] hover:bg-blue-700 h-14 px-12 rounded-2xl font-bold flex items-center gap-3 text-white transition-all transform hover:scale-105"
                                >
                                    {saving ? 'Saving...' : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                            Save Vendor Settings
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-10 space-y-10">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">AutoRABIT Settings</h2>
                                    </div>
                                    <p className="text-gray-500 text-sm">Fine-tune the platform identity for the entire ecosystem.</p>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <Label className="text-[11px] font-bold text-gray-500 block mb-2 uppercase">Platform Logo</Label>
                                        <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white mb-2">
                                            {settings.autorabit_logo_url ? <img src={settings.autorabit_logo_url} className="w-full h-full object-contain" /> : <img src="/logo.png" className="w-10 h-10 object-contain brightness-0 opacity-20" />}
                                        </div>
                                        <div className="flex flex-col gap-1 items-center">
                                            <Input name="autorabit_logo_url" value={settings.autorabit_logo_url} onChange={handleChange} className="h-6 text-[9px] w-24" placeholder="URL" />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="platform-logo-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'autorabit_logo_url')}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    className="h-6 px-2 text-[10px] text-blue-600 font-bold hover:bg-blue-50"
                                                    onClick={() => document.getElementById('platform-logo-upload')?.click()}
                                                    disabled={uploading === 'autorabit_logo_url'}
                                                >
                                                    {uploading === 'autorabit_logo_url' ? 'Uploading...' : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <Label className="text-[11px] font-bold text-gray-500 block mb-2 uppercase">Favicon</Label>
                                        <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white mb-2">
                                            {settings.autorabit_favicon_url ? <img src={settings.autorabit_favicon_url} className="w-6 h-6 object-contain" /> : <img src="/favicon.ico" className="w-6 h-6 object-contain opacity-20" />}
                                        </div>
                                        <div className="flex flex-col gap-1 items-center">
                                            <Input name="autorabit_favicon_url" value={settings.autorabit_favicon_url} onChange={handleChange} className="h-6 text-[9px] w-24" placeholder="URL" />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="favicon-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'autorabit_favicon_url')}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    className="h-6 px-2 text-[10px] text-blue-600 font-bold hover:bg-blue-50"
                                                    onClick={() => document.getElementById('favicon-upload')?.click()}
                                                    disabled={uploading === 'autorabit_favicon_url'}
                                                >
                                                    {uploading === 'autorabit_favicon_url' ? 'Uploading...' : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Official Platform Name</Label>
                                    <Input name="company_name" value={settings.company_name} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        Company Website
                                    </Label>
                                    <Input name="autorabit_website" value={settings.autorabit_website} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Corporate GST Number</Label>
                                    <Input name="autorabit_gst_number" value={settings.autorabit_gst_number} onChange={handleChange} placeholder="Enter corporate GST" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Primary Contact (Support)</Label>
                                    <Input name="autorabit_contact_primary" value={settings.autorabit_contact_primary} onChange={handleChange} placeholder="+91-XXXXX-XXXXX" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Secondary Contact (Emergency)</Label>
                                    <Input name="autorabit_contact_secondary" value={settings.autorabit_contact_secondary} onChange={handleChange} placeholder="+91-XXXXX-XXXXX" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Support Email</Label>
                                    <Input name="email" value={settings.email} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Support Availability</Label>
                                    <Input name="autorabit_support_hours" value={settings.autorabit_support_hours} onChange={handleChange} placeholder="e.g. 24/7 Priority Support" className="h-14 rounded-2xl border-gray-100 bg-white shadow-none focus-visible:ring-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                                        Platform Primary Color
                                    </Label>
                                    <div className="flex gap-4">
                                        <div style={{ backgroundColor: settings.autorabit_primary_color }} className="h-14 w-16 rounded-2xl border border-gray-100 shadow-sm" />
                                        <Input name="autorabit_primary_color" value={settings.autorabit_primary_color} onChange={handleChange} className="h-14 rounded-2xl border-gray-100 bg-white shadow-none flex-1 focus-visible:ring-blue-600" />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-900">Official Registered Address</Label>
                                    <textarea
                                        name="autorabit_official_address"
                                        value={settings.autorabit_official_address}
                                        onChange={handleChange}
                                        className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-100 bg-white shadow-none focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                                        placeholder="Enter the official corporate address"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-10 border-t border-gray-50 rounded-3xl bg-blue-50/20 p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <h3 className="text-lg font-bold text-blue-900">Application Synchronicity</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Employee App (AutoRabit)</p>
                                            <p className="text-xs text-gray-500">Logo, Color & Support Sync</p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-200"></div>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Vendor App (Partner)</p>
                                            <p className="text-xs text-gray-500">Identity & Branding Sync</p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-200"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600/70 text-center font-medium italic italic">Changes made here propagate globally to ensure consistent brand experience.</p>
                            </div>

                            <div className="flex justify-center pt-6">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-[#0066FF] hover:bg-blue-700 h-14 px-12 rounded-2xl font-bold flex items-center gap-3 text-white transition-all transform hover:scale-105"
                                >
                                    {saving ? 'Synchronizing...' : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 022 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                            Save AutoRABIT Settings
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
