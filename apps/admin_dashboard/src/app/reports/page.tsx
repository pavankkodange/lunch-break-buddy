'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';

export default function ReportsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // We can use a custom fetch here or extend api.ts
        const fetchLogs = async () => {
            try {
                // Fetching all employees or a combined log if we had a dedicated endpoint
                // For now, let's fetch daily redemptions stats or similar live data
                // In a real scenario, we'd have /admin/redemptions/all
                const res = await fetch(`${API_URL}/admin/employees`);
                const data = await res.json();

                // Mocking some log data based on employees for visualization
                setLogs(data.map((emp: any, i: number) => ({
                    id: `LOG-${1000 + i}`,
                    employee: emp.full_name,
                    id_number: emp.employee_number,
                    date: new Date().toLocaleDateString(),
                    time: `${12 + (i % 2)}:${(15 + i * 5) % 60} PM`,
                    status: 'Verified',
                    value: '₹160'
                })));
            } catch (error) {
                console.error('Failed to fetch logs');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Redemption Logs</h1>
                    <p className="text-gray-500">View and audit all historical meal redemptions</p>
                </div>
                <div className="flex gap-4">
                    <Input
                        placeholder="Search by name or ID..."
                        className="w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline">Export CSV</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-gray-600">ID</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Employee</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Emp ID</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Date</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Time</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Value</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading logs...</td></tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No logs found</td></tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono text-sm">{log.id}</td>
                                            <td className="p-4 font-medium">{log.employee}</td>
                                            <td className="p-4">{log.id_number}</td>
                                            <td className="p-4">{log.date}</td>
                                            <td className="p-4">{log.time}</td>
                                            <td className="p-4 font-semibold text-green-600">{log.value}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'Redeemed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center text-sm text-gray-500">
                <p>Showing {filteredLogs.length} of {logs.length} entries</p>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" disabled>Previous</Button>
                    <Button variant="ghost" size="sm" disabled>Next</Button>
                </div>
            </div>
        </div>
    );
}
