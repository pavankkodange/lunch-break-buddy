'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardEnrichment() {
    const [announcement, setAnnouncement] = useState('Welcome to the new Lunch break Buddy system! Ensure your location is enabled.');
    const [isEditing, setIsEditing] = useState(false);

    // Mock data for a simple chart representation
    const stats = [
        { day: 'Mon', count: 145 },
        { day: 'Tue', count: 162 },
        { day: 'Wed', count: 158 },
        { day: 'Thu', count: 170 },
        { day: 'Fri', count: 130 },
    ];

    const maxCount = Math.max(...stats.map(s => s.count));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">System Insights</h1>
                    <p className="text-gray-500">Real-time usage and administration</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Export All Data
                    </Button>
                </div>
            </div>

            {/* Announcement Banner Manager */}
            <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold text-blue-900">Live Announcement</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Save' : 'Edit'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Input
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            className="bg-white border-blue-200"
                        />
                    ) : (
                        <Alert className="bg-white border-blue-100">
                            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <AlertTitle className="text-blue-900">Active Message</AlertTitle>
                            <AlertDescription className="text-blue-700">{announcement}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Redemption Trends (Simple CSS Bar Chart) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Redemption Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-48 pt-4">
                            {stats.map((s) => (
                                <div key={s.day} className="flex flex-col items-center gap-2 w-full">
                                    <div
                                        className="w-12 bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 relative group"
                                        style={{ height: `${(s.count / maxCount) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {s.count}
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">{s.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Rated Vendors / Feedback */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vendor Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold">AutoRabit Cafeteria</p>
                                <p className="text-xs text-gray-500">Main Vendor</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-bold">4.8</span>
                                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Based on 428 ratings this month.
                        </div>
                        <Button variant="link" className="px-0 text-blue-600">View detailed feedback logs</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
