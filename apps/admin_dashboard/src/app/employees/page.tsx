'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { fetchProfiles } from '@/lib/api';

export default function Employees() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfiles()
            .then(setEmployees)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Employee Management</h1>

            <Card className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-bottom">
                            <th className="p-4 font-semibold text-gray-600">Employee Number</th>
                            <th className="p-4 font-semibold text-gray-600">Full Name</th>
                            <th className="p-4 font-semibold text-gray-600">Email</th>
                            <th className="p-4 font-semibold text-gray-600">Department</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp.id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono text-sm">{emp.employee_number}</td>
                                <td className="p-4">{emp.full_name}</td>
                                <td className="p-4 text-gray-600">{emp.company_email}</td>
                                <td className="p-4 italic text-gray-500">{emp.department || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
