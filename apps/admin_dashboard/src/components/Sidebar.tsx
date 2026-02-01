'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchSettings } from '@/lib/api';
import {
    LayoutDashboard,
    Users,
    Store,
    FileText,
    Receipt,
    Settings,
    PieChart,
    BarChart3,
    Palette,
    UtensilsCrossed,
    MessageSquare
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
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

    const logo = settings?.autorabit_logo_url;
    const companyName = settings?.company_name || 'Admin Panel';

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Invoices', href: '/invoices', icon: Receipt },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Vendors', href: '/vendors', icon: Store },
        { name: 'Branding', href: '/branding', icon: Palette },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="w-64 bg-white h-screen border-r flex flex-col fixed left-0 top-0 z-50 shadow-sm">
            {/* Brand Header */}
            <div className="h-20 flex items-center px-6 border-b gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                    <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
                        LunchBreak
                    </span>
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-wide leading-none">
                        Buddy
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Info */}
            <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
