import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Activity, Trophy, ShoppingBag, Coins, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

const SchoolOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/school/reports');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch school stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="text-sm font-medium ml-3">Loading Overview Data...</p>
            </div>
        );
    }

    const cards = [
        {
            title: 'Available Balance',
            value: `₹${(stats?.earnings || 0).toLocaleString()}`,
            icon: Coins,
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600'
        },
        {
            title: 'Pending Commissions',
            value: `₹${(stats?.pending_commissions || 0).toLocaleString()}`,
            icon: Activity,
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600'
        },
        {
            title: 'Total Orders',
            value: stats?.total_orders || 0,
            icon: ShoppingBag,
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600'
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor your store performance, orders, and earnings.</p>
                </div>
                <div className="flex bg-white px-3 py-1.5 rounded-lg border border-slate-200 items-center gap-2 shadow-sm shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-slate-700">Store Active</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${card.bgColor} ${card.textColor}`}>
                                <card.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm font-medium mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="text-yellow-500" size={18} />
                        <h2 className="text-base font-semibold text-slate-900">Top Performing Products</h2>
                    </div>

                    <div className="space-y-4">
                        {stats?.top_products?.length > 0 ? stats.top_products.map((tp, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-500 w-4">{String(idx + 1)}.</span>
                                        <p className="text-sm font-medium text-slate-900">{tp.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600">{tp.total_sold} units</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (Number(tp.total_sold || 0) / (Number(stats?.total_orders || 0) || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 flex flex-col items-center justify-center text-center">
                                <Activity className="text-slate-300 mb-2" size={32} />
                                <p className="text-slate-500 text-sm">No sales data available yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Insights Card */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900 mb-2">Performance Insights</h2>
                        <p className="text-sm text-slate-600 leading-relaxed mb-6">
                            Your conversion rates are stable. Adding more product categories could help increase overall revenue and customer reach.
                        </p>
                    </div>

                    <button className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                        <span>Manage Products</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchoolOverview;
