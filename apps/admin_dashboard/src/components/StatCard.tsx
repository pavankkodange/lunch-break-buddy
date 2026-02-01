import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'orange' | 'purple';
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>

                    {trend && (
                        <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="font-medium">{trend.value}</span>
                            <span className="ml-1 text-gray-500">from last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
