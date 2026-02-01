'use client';

import { useEffect, useState } from 'react';
import { fetchStats } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Employees" value={stats?.total_employees || 0} icon="👥" color="blue" />
        <StatCard title="Total Redemptions" value={stats?.total_redemptions || 0} icon="🍽️" color="orange" />
        <StatCard title="Redeemed Today" value={stats?.today_redemptions || 0} icon="✅" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="mr-2">🕒</span> Recent Activity
          </h2>
          <div className="space-y-4 text-sm">
            <p className="text-gray-500 italic">Connecting to live feed...</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="mr-2">📈</span> Engagement
          </h2>
          <p className="text-gray-500 italic">User engagement metrics coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
  const colorMap: any = {
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center hover:shadow-md transition-shadow">
      <div className={`text-4xl mr-6 p-4 rounded-full ${colorMap[color]}`}>{icon}</div>
      <div>
        <h3 className="text-sm text-gray-400 uppercase font-bold tracking-wider">{title}</h3>
        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
