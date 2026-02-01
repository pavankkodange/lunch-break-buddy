'use client';

import TopHeader from '@/components/TopHeader';
import { useState } from 'react';
import { Download, Calendar, Search, Filter } from 'lucide-react';

// Mock Data for Reports
const MOCK_LOGS = [
    { id: 1, date: '2026-02-01', time: '12:30 PM', employee: 'John Doe', employeeId: 'EMP001', coupon: 'Standard Meal' },
    { id: 2, date: '2026-02-01', time: '12:35 PM', employee: 'Jane Smith', employeeId: 'EMP002', coupon: 'Standard Meal' },
    { id: 3, date: '2026-02-01', time: '12:42 PM', employee: 'Mike Ross', employeeId: 'EMP003', coupon: 'Standard Meal' },
    { id: 4, date: '2026-02-01', time: '01:10 PM', employee: 'Rachel Zane', employeeId: 'EMP004', coupon: 'Standard Meal' },
    { id: 5, date: '2026-02-01', time: '01:15 PM', employee: 'Harvey Specter', employeeId: 'EMP005', coupon: 'Standard Meal' },
    { id: 6, date: '2026-01-31', time: '12:20 PM', employee: 'Donna Paulsen', employeeId: 'EMP006', coupon: 'Standard Meal' },
    { id: 7, date: '2026-01-31', time: '12:45 PM', employee: 'Louis Litt', employeeId: 'EMP007', coupon: 'Standard Meal' },
    { id: 8, date: '2026-01-25', time: '12:30 PM', employee: 'Jessica Pearson', employeeId: 'EMP008', coupon: 'Standard Meal' },
    { id: 9, date: '2025-12-15', time: '12:45 PM', employee: 'Robert Zane', employeeId: 'EMP009', coupon: 'Standard Meal' },
    { id: 10, date: '2028-05-20', time: '01:00 PM', employee: 'Future Employee', employeeId: 'EMP010', coupon: 'Standard Meal' },
];

export default function ReportsPage() {
    const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');

    // Months for dropdown
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Years for dropdown
    // Years for dropdown - Dynamic generation
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => (currentYear - 4 + i).toString());

    // Filter Logic
    const filteredLogs = MOCK_LOGS.filter(log => {
        let matchesDate = false;
        const logDate = new Date(log.date);

        if (filterType === 'daily') {
            matchesDate = log.date === selectedDate;
        } else if (filterType === 'weekly') {
            // Simple weekly logic: Show logs from same week as selected date
            // For MVP, lets just show logs within +/- 3 days of selected date to simulate week
            const target = new Date(selectedDate);
            const diffTime = Math.abs(target.getTime() - logDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesDate = diffDays <= 7;
        } else if (filterType === 'monthly') {
            matchesDate = logDate.getMonth().toString() === selectedMonth &&
                logDate.getFullYear().toString() === selectedYear;
        } else if (filterType === 'yearly') {
            matchesDate = logDate.getFullYear().toString() === selectedYear;
        }

        const matchesSearch = log.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesDate && matchesSearch;
    });

    const handleExportCSV = () => {
        try {
            const headers = ['Date', 'Time', 'Employee Name', 'Employee ID', 'Coupon Type'];
            const csvContent = [
                headers.join(','),
                ...filteredLogs.map(row => `${row.date},${row.time},${row.employee},${row.employeeId},${row.coupon}`)
            ].join('\n');

            // Add BOM for Excel compatibility
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create robust download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Redemption_Report_${filterType}_${new Date().toISOString().slice(0, 10)}.csv`);

            // Append to body to ensure click works in all browsers
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            alert("Report downloaded successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to download report. Please try again.");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <TopHeader title="Reports" />

            <div className="p-8 space-y-6">
                {/* Header / Controls */}
                <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1">Coupon Redemptions</h2>
                            <p className="text-sm text-gray-500">View and download logs.</p>
                        </div>
                        {/* Filter Toggles */}
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                            {['daily', 'weekly', 'monthly', 'yearly'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type as any)}
                                    className={`px-4 py-1.5 rounded-md transition capitalize ${filterType === type ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full my-1"></div>

                    <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-end">
                        {/* Dynamic Controls based on filter type */}
                        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {(filterType === 'daily' || filterType === 'weekly') && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                        {filterType === 'daily' ? 'Select Date:' : 'Week of:'}
                                    </span>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="pl-4 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {filterType === 'monthly' && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            )}

                            {filterType === 'yearly' && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={filteredLogs.length === 0}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-fit"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Data
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {filteredLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coupon Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.date}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{log.time}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{log.employee}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{log.employeeId}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                                                    {log.coupon}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Filter className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                            <p>No records found matching filters.</p>
                            <p className="text-xs mt-1 text-gray-400">Try adjusting the {filterType} filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
