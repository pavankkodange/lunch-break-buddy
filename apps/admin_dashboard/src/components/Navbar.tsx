'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchSettings } from '@/lib/api';

export default function Navbar() {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchSettings();
                setSettings(data);
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, []);

    const logo = settings?.autorabit_logo_url || '/logo.png';
    const companyName = settings?.company_name || 'Lunch buddy';

    return (
        <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <img src={logo} alt={companyName} className="h-8 w-auto object-contain" />
                    <Link href="/" className="text-xl font-bold tracking-tight text-blue-900">{companyName}</Link>
                </div>
            </div>
            <div className="space-x-6 flex items-center">
                <Link href="/" className="hover:text-blue-600">Dashboard</Link>
                <Link href="/employees" className="hover:text-blue-600">Employees</Link>
                <Link href="/vendors" className="hover:text-blue-600">Vendors</Link>
                <Link href="/reports" className="hover:text-blue-600">Reports</Link>
                <Link href="/branding" className="hover:text-blue-600">Branding</Link>
                <Link href="/insights" className="hover:text-blue-600">Insights</Link>
                <Link href="/settings" className="hover:text-blue-600">Settings</Link>
                <Link href="/profile" className="ml-4 p-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </Link>
            </div>
        </nav>
    );
}
