'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Receipt, Calendar, IndianRupee } from "lucide-react";

interface StatsProps {
    totalEmployees: number;
    totalRedemptions: number;
    todayRedemptions: number;
    monthlyTotal: number;
}

export function OverviewStats({ totalEmployees, totalRedemptions, todayRedemptions, monthlyTotal }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Registered profiles</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Redemptions</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{todayRedemptions}</div>
                    <p className="text-xs text-muted-foreground">₹{todayRedemptions * 160} today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Redemptions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRedemptions}</div>
                    <p className="text-xs text-muted-foreground">For current filter</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{monthlyTotal}</div>
                    <p className="text-xs text-muted-foreground">Billing amount</p>
                </CardContent>
            </Card>
        </div>
    );
}
