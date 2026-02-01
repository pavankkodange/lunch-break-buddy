'use client';

import TopHeader from '@/components/TopHeader';
import { useState } from 'react';
import { FileText, Download, Plus, CheckCircle, Clock, AlertCircle, X, Filter, Calendar, ArrowRight, Loader2 } from 'lucide-react';

// Mock Transaction Data with detailed info
const MOCK_TRANSACTIONS = [
    { id: 'TXN-101', date: '2026-01-28', employee: 'John Doe', employeeId: 'EMP001', couponCode: 'STANDARD MEAL', item: 'Standard Lunch', amount: 160 },
    { id: 'TXN-102', date: '2026-01-28', employee: 'Jane Smith', employeeId: 'EMP002', couponCode: 'STANDARD MEAL', item: 'Standard Lunch', amount: 160 },
    { id: 'TXN-103', date: '2026-01-29', employee: 'Mike Ross', employeeId: 'EMP003', couponCode: 'STANDARD MEAL', item: 'Diet Meal', amount: 180 },
    { id: 'TXN-104', date: '2026-01-30', employee: 'Rachel Zane', employeeId: 'EMP004', couponCode: 'STANDARD MEAL', item: 'Standard Lunch', amount: 160 },
    { id: 'TXN-105', date: '2026-01-31', employee: 'Harvey Specter', employeeId: 'EMP005', couponCode: 'STANDARD MEAL', item: 'Premium Lunch', amount: 250 },
    { id: 'TXN-106', date: '2026-02-01', employee: 'Donna Paulsen', employeeId: 'EMP006', couponCode: 'STANDARD MEAL', item: 'Standard Lunch', amount: 160 },
];

export default function InvoicesPage() {
    // --- State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | boolean>(false); // store ID or true/false

    // Filter State
    const [filterType, setFilterType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Invoices List State
    const [invoices, setInvoices] = useState([
        {
            id: 'INV-2024-001',
            vendor: 'Go Vindu',
            periodStart: '2025-01-01',
            periodEnd: '2025-01-07',
            amount: 14750,
            status: 'paid',
            generatedDate: '2025-01-08'
        },
        {
            id: 'INV-2024-002',
            vendor: 'Go Vindu',
            periodStart: '2025-01-08',
            periodEnd: '2025-01-14',
            amount: 18408,
            status: 'pending',
            generatedDate: '2025-01-15'
        },
        {
            id: 'INV-2024-003',
            vendor: 'Go Vindu',
            periodStart: '2025-02-01',
            periodEnd: '2025-02-07',
            amount: 15200,
            status: 'paid',
            generatedDate: '2025-02-08'
        },
    ]);

    // Modal Form State
    const [step, setStep] = useState(1); // 1: Select Date Range, 2: Review Transactions, 3: Invoice Preview
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]);

    // --- Helpers ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-orange-100 text-orange-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleStatusChange = (id: string, newStatus: string) => {
        setInvoices(invoices.map(inv =>
            inv.id === id ? { ...inv, status: newStatus } : inv
        ));
    };

    const handleDateSearch = () => {
        // Filter mock transactions based on date range
        // In real app: fetch(`/api/transactions?start=${dateRange.start}&end=${dateRange.end}`)
        const filtered = MOCK_TRANSACTIONS.filter(t =>
            t.date >= dateRange.start && t.date <= dateRange.end
        );
        setSelectedTransactions(filtered);
        setStep(2);
    };

    const handleProceedToPreview = () => {
        setStep(3);
    };

    // Calculation Helpers
    const calculateTotals = (transactions: any[]) => {
        const subtotal = transactions.reduce((sum, t) => sum + t.amount, 0);
        const gst = subtotal * 0.18;
        const total = subtotal + gst;
        return { subtotal, gst, total };
    };

    const handleGenerateInvoice = async () => {
        setIsDownloading(true);
        try {
            const { total } = calculateTotals(selectedTransactions);

            const newInvoice = {
                id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                vendor: 'Go Vindu',
                periodStart: dateRange.start,
                periodEnd: dateRange.end,
                amount: Math.round(total),
                status: 'submitted', // Changed to submitted per request
                generatedDate: new Date().toISOString().split('T')[0],
            };

            setInvoices([newInvoice, ...invoices]);

            // Generate PDF
            await generatePDF(newInvoice, selectedTransactions);

            // Simulation of Notification & Message
            setTimeout(() => {
                // 1. Alert (Immediate Feedback)
                alert(`✅ Invoice Submitted Successfully!\n\nAutoRABIT Admin has been notified of the new invoice #${newInvoice.id}.`);

                // 2. Persist Message to Chat
                try {
                    const storedData = localStorage.getItem('lbb_messages');
                    const messagesData = storedData ? JSON.parse(storedData) : { '1': [], '2': [] };

                    const newMessage = {
                        id: Date.now(),
                        sender: 'me',
                        text: `Submitted new invoice #${newInvoice.id} for ${newInvoice.periodStart} to ${newInvoice.periodEnd}. Amount: ₹${newInvoice.amount}`,
                        time: 'Just now'
                    };

                    const adminReply = {
                        id: Date.now() + 100,
                        sender: 'them',
                        text: `Received Invoice #${newInvoice.id}. It has been queued for review.`,
                        time: 'Just now'
                    };

                    const updatedMessages = {
                        ...messagesData,
                        '1': [...(messagesData['1'] || []), newMessage, adminReply]
                    };

                    localStorage.setItem('lbb_messages', JSON.stringify(updatedMessages));
                } catch (e) {
                    console.error("Failed to save message to history", e);
                }
            }, 500);

            setIsModalOpen(false);
            setStep(1);
            setDateRange({ start: '', end: '' });
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to submit invoice. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const generatePDF = async (invoice: any, transactions: any[]) => {
        try {
            if (!isDownloading) setIsDownloading(invoice.id);

            // Dynamic imports to ensure client-side execution
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Calculate exact totals for PDF
            const { subtotal, gst, total } = calculateTotals(transactions);

            // --- PDF DESIGN ---
            // 1. Vendor Header
            doc.setFontSize(18);
            doc.setTextColor(234, 88, 12);
            doc.text("Go Vindu", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text("Hitech City Main Rd, Hyderabad", 14, 26);
            doc.text("GSTIN: 36ABCDE1234F1Z5", 14, 31);
            doc.text("Contact: 9876543210", 14, 36);

            // 2. Client Details
            doc.setFillColor(245, 247, 250);
            doc.rect(14, 45, 182, 25, 'F');
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("BILL TO:", 20, 52);
            doc.setFontSize(12);
            doc.setTextColor(30, 64, 175);
            doc.text("AutoRABIT", 20, 58);
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text("Lunch Break Buddy (Admin Dept), Hyderabad HQ", 20, 64);

            // 3. Invoice Meta
            doc.setFontSize(10);
            doc.text(`Invoice #: ${invoice.id}`, 140, 52);
            doc.text(`Date: ${invoice.generatedDate}`, 140, 58);
            doc.text(`Period: ${invoice.periodStart} to ${invoice.periodEnd}`, 140, 64);

            // 4. Table
            autoTable(doc, {
                startY: 80,
                head: [['Date', 'Emp ID', 'Employee Name', 'Coupon Type', 'Amount']],
                body: transactions.length > 0
                    ? transactions.map(t => [
                        t.date,
                        t.employeeId || 'N/A',
                        t.employee,
                        t.couponCode || 'Standard',
                        `Rs ${t.amount}`
                    ])
                    : [[`${invoice.periodStart} - ${invoice.periodEnd}`, '-', 'Consolidated', '-', `Rs ${subtotal}`]],
                theme: 'striped',
                headStyles: { fillColor: [234, 88, 12], fontSize: 8, halign: 'center' },
                bodyStyles: { fontSize: 8, halign: 'center' },
            });

            // 5. Totals
            // @ts-ignore
            const finalY = doc.lastAutoTable?.finalY || 100;
            const rightMargin = 190;

            doc.text(`Subtotal:`, 140, finalY + 10);
            doc.text(`Rs ${subtotal.toLocaleString()}`, rightMargin, finalY + 10, { align: 'right' });

            doc.text(`GST (18%):`, 140, finalY + 16);
            doc.text(`Rs ${gst.toFixed(2)}`, rightMargin, finalY + 16, { align: 'right' });

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`Grand Total:`, 140, finalY + 24);
            doc.text(`Rs ${total.toFixed(2)}`, rightMargin, finalY + 24, { align: 'right' });

            // 6. Footer
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("This is a computer generated invoice.", 105, 280, { align: 'center' });

            doc.save(`${invoice.id}_${invoice.generatedDate}.pdf`);

        } catch (e) {
            console.error("PDF Generation failed:", e);
            alert("Error creating PDF. Please ensure pop-ups are allowed.");
        } finally {
            setIsDownloading(false);
        }
    };

    const previewTotals = calculateTotals(selectedTransactions);

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.generatedDate);
        if (filterType === 'monthly') {
            return invDate.getMonth().toString() === selectedMonth && invDate.getFullYear().toString() === selectedYear;
        } else if (filterType === 'yearly') {
            return invDate.getFullYear().toString() === selectedYear;
        } else if (filterType === 'custom') {
            if (!customRange.start || !customRange.end) return true;
            return inv.generatedDate >= customRange.start && inv.generatedDate <= customRange.end;
        }
        return true;
    });

    return (
        <div className="bg-gray-50 min-h-screen">
            <TopHeader title="Invoices & Billing" />

            <div className="p-8">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Billing History</h2>
                        <p className="text-sm text-gray-500">Manage vendor invoices and payments.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => alert("Simulating: Navigating to Admin Submission Page...")}
                            className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium"
                        >
                            Submission Status
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center shadow-lg hover:bg-blue-700 transition transform active:scale-95"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Invoice
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Filter className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-bold text-gray-700">Filter Invoices</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                            {['monthly', 'yearly', 'custom'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type as any)}
                                    className={`px-4 py-1.5 rounded-md transition capitalize ${filterType === type ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                        {filterType === 'monthly' && (
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()).map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        )}

                        {filterType === 'yearly' && (
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()).map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        )}

                        {filterType === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billed Period</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (Inc. GST)</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-blue-600">{inv.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {inv.periodStart} <span className="text-gray-400">to</span> {inv.periodEnd}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium">₹{inv.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{inv.generatedDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded border-0 ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => generatePDF(inv, [])}
                                                disabled={isDownloading === inv.id}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
                                                title="Download PDF"
                                            >
                                                {isDownloading === inv.id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                ) : (
                                                    <Download className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No invoices found matching the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* GENERATION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDownloading && setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-0 relative z-10 overflow-hidden flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {step === 1 ? '1. Select Period' : (step === 2 ? '2. Review Items' : '3. Preview Invoice')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} disabled={!!isDownloading}>
                                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* STEP 1: DATE SELECT */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                        <h4 className="text-sm font-bold text-blue-900 mb-2">Select Billing Period</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full mt-1 border rounded-md p-2"
                                                    value={dateRange.start}
                                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full mt-1 border rounded-md p-2"
                                                    value={dateRange.end}
                                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDateSearch}
                                            disabled={!dateRange.start || !dateRange.end}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
                                        >
                                            Find Transactions
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: REVIEW TRANSACTIONS */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                        <span className="text-sm font-medium text-gray-600">Period: {dateRange.start} to {dateRange.end}</span>
                                        <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-bold hover:underline">Change</button>
                                    </div>

                                    <h4 className="text-sm font-bold text-gray-900">Review Billable Items</h4>

                                    {/* Table View */}
                                    {selectedTransactions.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            No billing records found for this period.
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="p-3">Date</th>
                                                        <th className="p-3">Emp ID</th>
                                                        <th className="p-3">Employee</th>
                                                        <th className="p-3">Coupon</th>
                                                        <th className="p-3 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {selectedTransactions.map((t) => (
                                                        <tr key={t.id}>
                                                            <td className="p-3 text-xs">{t.date}</td>
                                                            <td className="p-3 text-xs font-mono">{t.employeeId}</td>
                                                            <td className="p-3 text-sm">{t.employee}</td>
                                                            <td className="p-3 text-xs">
                                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                                                    {t.couponCode}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right font-mono text-sm">₹{t.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Total Invoice Value</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                ₹{previewTotals.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">(Inc. GST)</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleProceedToPreview}
                                            disabled={selectedTransactions.length === 0}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition flex items-center"
                                        >
                                            Preview Invoice <ArrowRight className="h-5 w-5 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PREVIEW INVOICE */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="bg-white border rounded-lg p-8 shadow-sm max-h-[500px] overflow-y-auto">
                                        {/* PREVIEW CONTENT */}
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h1 className="text-2xl font-bold text-orange-600">Go Vindu</h1>
                                                <p className="text-sm text-gray-500 mt-1">Hitech City Main Rd, Hyderabad</p>
                                                <p className="text-sm text-gray-500">GSTIN: 36ABCDE1234F1Z5</p>
                                            </div>
                                            <div className="text-right">
                                                <h2 className="text-3xl font-light text-gray-300">INVOICE</h2>
                                                <p className="text-sm text-gray-600 mt-2 font-mono">#{new Date().getFullYear()}-XXXX</p>
                                                <p className="text-sm text-gray-600">{new Date().toISOString().split('T')[0]}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">Bill To</p>
                                                <p className="font-bold text-blue-900 text-lg">AutoRABIT</p>
                                                <p className="text-sm text-gray-600">Lunch Break Buddy (Admin Dept)</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                                                <p className="font-bold text-green-600">PREVIEW</p>
                                            </div>
                                        </div>

                                        {/* MISSING TABLE RESTORED */}
                                        <table className="w-full text-left text-sm mb-4">
                                            <thead className="border-b-2 border-orange-100">
                                                <tr>
                                                    <th className="py-2 text-orange-600">Date</th>
                                                    <th className="py-2 text-orange-600">Emp ID</th>
                                                    <th className="py-2 text-orange-600">Employee</th>
                                                    <th className="py-2 text-orange-600">Coupon</th>
                                                    <th className="py-2 text-right text-orange-600">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {selectedTransactions.map(t => (
                                                    <tr key={t.id}>
                                                        <td className="py-2 text-gray-600">{t.date}</td>
                                                        <td className="py-2 font-mono text-xs">{t.employeeId}</td>
                                                        <td className="py-2 font-medium">{t.employee}</td>
                                                        <td className="py-2 text-xs text-gray-500">{t.couponCode}</td>
                                                        <td className="py-2 text-right font-mono">₹{t.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* SUMMARY SECTION */}
                                        <div className="flex justify-end border-t-2 border-gray-900 pt-4">
                                            <div className="w-64 space-y-2">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Subtotal:</span>
                                                    <span>₹{previewTotals.subtotal.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>GST (18%):</span>
                                                    <span>₹{previewTotals.gst.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                                                    <span>Grand Total:</span>
                                                    <span>₹{previewTotals.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-center text-xs text-gray-400 italic mt-8">This is a preview. Click "Submit" to finalize and send.</p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 font-medium">
                                            Back to Review
                                        </button>
                                        <button
                                            onClick={handleGenerateInvoice}
                                            disabled={!!isDownloading}
                                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-green-700 transition flex items-center disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-5 w-5 mr-2" />
                                                    Submit & Notify Admin
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
