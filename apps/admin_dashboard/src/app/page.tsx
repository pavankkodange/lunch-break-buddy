'use client';

import { useEffect, useState } from 'react';
import { fetchStats, fetchSettings } from '@/lib/api';
import TopHeader from '@/components/TopHeader';
import StatCard from '@/components/StatCard';
import { Users, Utensils, CheckCircle, TrendingUp, Building2, Store, Calendar, Filter, UserX, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- MOCK DATA GENERATORS ---

const generateTrendData = (filterType: string) => {
  // Generate mock trend data based on filter type
  const data = [];
  const count = filterType === 'daily' ? 24 : filterType === 'weekly' ? 7 : filterType === 'monthly' ? 30 : 12;

  for (let i = 0; i < count; i++) {
    let label = '';
    if (filterType === 'daily') label = `${i}:00`;
    else if (filterType === 'weekly') label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
    else if (filterType === 'monthly') label = `Day ${i + 1}`;
    else label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];

    data.push({
      name: label,
      coupons: Math.floor(Math.random() * 100) + 20,
      employees: Math.floor(Math.random() * 80) + 10, // Must be <= coupons ideally
    });
  }
  return data;
};

const INACTIVE_EMPLOYEES = [
  { id: 'EMP009', name: 'Robert Baratheon', department: 'Sales', lastActive: '5 days ago' },
  { id: 'EMP012', name: 'Cersei Lannister', department: 'Management', lastActive: 'Never' },
  { id: 'EMP015', name: 'Daenerys Targaryen', department: 'Marketing', lastActive: '2 weeks ago' },
  { id: 'EMP018', name: 'Jon Snow', department: 'Security', lastActive: '3 days ago' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchSettings()
    ]).then(([statsData, settingsData]) => {
      setStats(statsData);
      setSettings(settingsData);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Refresh Chart Data on filter change
    setChartData(generateTrendData(filterType));
  }, [filterType]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopHeader title="Dashboard" />

      <div className="p-8">

        {/* FILTERS BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-bold text-gray-700">Analytics Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Type Toggle */}
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

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            {/* Dynamic Controls based on filter type */}
            {(filterType === 'daily' || filterType === 'weekly') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                  {filterType === 'daily' ? 'Select Date:' : 'Week of:'}
                </span>
                <div className="relative">
                  <input
                    type="date"
                    className="pl-4 pr-10 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {filterType === 'monthly' && (
              <div className="flex items-center gap-3">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {filterType === 'yearly' && (
              <div className="flex items-center gap-3">
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Coupons Claimed"
            value={chartData.reduce((acc, curr) => acc + curr.coupons, 0).toLocaleString()}
            icon={Utensils}
            color="orange"
            trend={{ value: "+5%", isPositive: true }}
          />
          <StatCard
            title="Active Employees"
            // Calculating unique employees rough estimate for demo
            value={Math.round(chartData.reduce((acc, curr) => acc + curr.employees, 0) * 0.8).toLocaleString()}
            icon={Users}
            color="blue"
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatCard
            title="Inactive Employees"
            value={INACTIVE_EMPLOYEES.length}
            icon={UserX}
            color="red"
          />
          <StatCard
            title="Engagement Rate"
            value="85%"
            icon={TrendingUp}
            color="purple"
            trend={{ value: "+2.4%", isPositive: true }}
          />
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 1. Coupon Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Coupon Claim Trend ({filterType})</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCoupons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="coupons" stroke="#f97316" fillOpacity={1} fill="url(#colorCoupons)" name="Coupons Claimed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Employee Participation Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Active Employees ({filterType})</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <RechartsTooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="employees" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* INACTIVE EMPLOYEES & RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inactive Employees List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Inactive Employees</h2>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Did not claim any coupons in this period.</p>

            <div className="space-y-4">
              {INACTIVE_EMPLOYEES.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-400">Last Active</span>
                    <p className="text-xs font-medium text-gray-600">{emp.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">
              View All Inactive Users
            </button>
          </div>

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Claims</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline">View Live Feed</button>
            </div>

            <div className="space-y-6">
              {/* Mock Activity Items */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-6 border-b last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-xl shadow-sm">
                    🍱
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-bold">user_{Math.floor(Math.random() * 1000)}</span> redeemed <span className="text-orange-600 font-bold">Standard Meal</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(Math.random() * 60)} minutes ago • {settings?.vendor_name || 'Go Vindu'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
