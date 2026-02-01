'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchSettings } from '@/lib/api';
import Link from 'next/link';

export default function VendorsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchSettings();
                setSettings(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    const vendorName = settings?.vendor_name || 'AutoRabit Cafeteria';
    const vendorEmail = settings?.vendor_email || 'vendor@company.com';
    const vendorLogo = settings?.vendor_logo_url;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                    <p className="text-gray-500 mt-1">Manage food service providers and cafeteria partners.</p>
                </div>
                <Button className="bg-blue-600 gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add New Vendor
                </Button>
            </div>

            {/* Active Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Primary Vendor Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-100 bg-blue-50/20">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 overflow-hidden">
                            {vendorLogo ? (
                                <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain" />
                            ) : (
                                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{vendorName}</CardTitle>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {vendorEmail}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                On-Campus
                            </div>
                        </div>
                        <div className="pt-2 flex gap-3">
                            <Link href="/branding" className="flex-1">
                                <Button variant="outline" className="w-full text-xs">Manage Profile</Button>
                            </Link>
                            <Link href="/reports" className="flex-1">
                                <Button variant="secondary" className="w-full text-xs bg-white border border-gray-200 hover:bg-gray-50">View Reports</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
