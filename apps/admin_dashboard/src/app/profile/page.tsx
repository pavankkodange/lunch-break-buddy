'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold mb-8">Administrator Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">Admin User</h2>
                        <p className="text-sm text-gray-500 mb-4">admin@autorabit.com</p>
                        <Badge className="bg-blue-600">System Administrator</Badge>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-gray-500">First Name</Label>
                                <p className="font-medium">Admin</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Last Name</Label>
                                <p className="font-medium">User</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Email Address</Label>
                                <p className="font-medium">admin@autorabit.com</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Organization</Label>
                                <p className="font-medium">AutoRABIT</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <Button variant="outline">Edit Profile Details</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Security & Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium">Password Management</p>
                            <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                        </div>
                        <Button variant="ghost">Change Password</Button>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium">Multi-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Currently enabled via Email</p>
                        </div>
                        <Button variant="ghost" className="text-blue-600">Configure</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
