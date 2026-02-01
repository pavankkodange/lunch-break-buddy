'use client';

import TopHeader from '@/components/TopHeader';
import { useState } from 'react';
import { Store, Phone, Mail, MapPin, MoreVertical, Star, TrendingUp, DollarSign, Users, X, Edit, Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function VendorsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<any>(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Initial Data
    const [vendors, setVendors] = useState([
        {
            id: 1,
            name: 'Go Vindu',
            category: 'Indian & Regional',
            contact: 'Kiran Kumar',
            phone: '+91 98765 43210',
            email: 'manager@govindu.com',
            rating: 4.8,
            status: 'active',
            totalOrders: 1250,
            revenue: 450000,
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop'
        },
        {
            id: 2,
            name: 'Curry Point',
            category: 'Fast Food & Snacks',
            contact: 'Rajesh Sharma',
            phone: '+91 98989 89898',
            email: 'orders@currypoint.in',
            rating: 4.2,
            status: 'active',
            totalOrders: 850,
            revenue: 210000,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop'
        },
        {
            id: 3,
            name: 'Sweet Tooth',
            category: 'Desserts & Beverages',
            contact: 'Sneha Reddy',
            phone: '+91 77777 77777',
            email: 'info@sweettooth.com',
            rating: 4.5,
            status: 'maintenance',
            totalOrders: 400,
            revenue: 85000,
            image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=100&h=100&fit=crop'
        }
    ]);

    // Available categories
    const categories = ['Indian & Regional', 'Fast Food & Snacks', 'Desserts & Beverages', 'Health & Salads'];

    // Calculate Dynamic Stats
    const totalRevenue = vendors.reduce((sum, v) => sum + (v.status === 'active' ? v.revenue : 0), 0);

    // Stats
    const stats = [
        { label: 'Total Vendors', value: vendors.length.toString(), icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Today', value: vendors.filter(v => v.status === 'active').length.toString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Avg Rating', value: '4.5', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    ];

    const handleAddNew = () => {
        setEditingVendor({
            id: null,
            name: '',
            category: 'Indian & Regional',
            contact: '',
            phone: '',
            email: '',
            rating: 5.0,
            status: 'active',
            totalOrders: 0,
            revenue: 0,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'
        });
        setIsModalOpen(true);
    };

    const handleEdit = (vendor: any) => {
        setEditingVendor({ ...vendor });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            setVendors(vendors.filter(v => v.id !== deleteId));
            setDeleteId(null);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingVendor.id) {
            setVendors(vendors.map(v => (v.id === editingVendor.id ? editingVendor : v)));
        } else {
            setVendors([...vendors, { ...editingVendor, id: Date.now() }]);
        }
        setIsModalOpen(false);
    };

    // Filtered Vendors
    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <TopHeader title="Vendors & Partners" />

            <div className="p-8 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vendors List Section */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-900">All Vendors</h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                className="border rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={handleAddNew}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Vendor
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Performance</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={vendor.image} alt={vendor.name} className="h-10 w-10 rounded-lg object-cover bg-gray-100" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-xs text-gray-500">{vendor.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 text-gray-400" />
                                                    {vendor.contact}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    {vendor.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                ${vendor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 
                                                    ${vendor.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                                <Star className="h-4 w-4 fill-current" />
                                                {vendor.rating}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{vendor.totalOrders} orders</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                            ₹{vendor.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(vendor)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(vendor.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredVendors.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No vendors found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vendor Modal (Add/Edit) */}
            {isModalOpen && editingVendor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingVendor.id ? 'Edit Vendor' : 'Add New Vendor'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.name}
                                        onChange={e => setEditingVendor({ ...editingVendor, name: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.category}
                                        onChange={e => setEditingVendor({ ...editingVendor, category: e.target.value })}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.contact}
                                        onChange={e => setEditingVendor({ ...editingVendor, contact: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.phone}
                                        onChange={e => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.email}
                                        onChange={e => setEditingVendor({ ...editingVendor, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.revenue}
                                        onChange={e => setEditingVendor({ ...editingVendor, revenue: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editingVendor.status}
                                        onChange={e => setEditingVendor({ ...editingVendor, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                                >
                                    {editingVendor.id ? 'Save Changes' : 'Create Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Vendor?</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete this vendor? This action cannot be undone.
                            </p>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
