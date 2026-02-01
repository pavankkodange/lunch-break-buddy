'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { fetchSettings, updateSettings } from '@/lib/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({
        company_name: '',
        coupon_value: 0,
        gst_percentage: 18,
        office_lat: 0,
        office_lng: 0,
        office_radius: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings()
            .then(data => {
                setSettings({
                    company_name: data.company_name,
                    coupon_value: data.coupon_value,
                    gst_percentage: data.gst_percentage ?? 18,
                    office_lat: data.office_latitude || 17.433749,
                    office_lng: data.office_longitude || 78.375504,
                    office_radius: data.office_radius_meters || 200,
                });
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings({
                company_name: settings.company_name,
                coupon_value: settings.coupon_value,
                gst_percentage: settings.gst_percentage,
                office_latitude: settings.office_lat,
                office_longitude: settings.office_lng,
                office_radius_meters: settings.office_radius,
            });
            alert('Settings updated successfully!');
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold mb-8">System Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Company Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                            value={settings.company_name}
                            onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Coupon Value (₹)</Label>
                        <Input
                            type="number"
                            value={settings.coupon_value}
                            onChange={e => setSettings({ ...settings, coupon_value: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>GST Percentage (%)</Label>
                        <Input
                            type="number"
                            value={settings.gst_percentage}
                            onChange={e => setSettings({ ...settings, gst_percentage: parseFloat(e.target.value) })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Branding Overview (Simplified) */}
            <Card className="border-gray-100 bg-gray-50/30">
                <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Branding Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">Branding settings have been moved to a unified management page for better control.</p>
                    <div className="flex gap-4">
                        <Button className="bg-blue-600 text-white" onClick={() => window.location.href = '/branding'}>
                            Manage Detailed Branding
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button variant="outline" className="mr-4">Reset Defaults</Button>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </Button>
            </div>
        </div>
    );
}
