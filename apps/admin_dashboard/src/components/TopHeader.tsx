'use client';

import { Bell } from 'lucide-react';

export default function TopHeader({ title }: { title?: string }) {
    return (
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{title || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>
    );
}
