import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users, ShoppingCart, TrendingUp, DollarSign,
    School, Truck, Package, Loader2,
    Calendar, Activity, CreditCard, AlertTriangle
} from 'lucide-react';

const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/analytics');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const cards = [
        { title: 'Total Revenue', value: `₹${(stats?.total_sales || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Schools Registered', value: stats?.total_schools || 0, icon: School, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: `${stats?.active_schools || 0} active` },
        { title: 'Total Suppliers', value: stats?.total_suppliers || 0, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'text-slate-700', bg: 'bg-slate-50' },
        { title: 'Pending Settlements', value: `₹${(stats?.pending_settlements_amount || 0).toLocaleString()}`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', sub: `${stats?.pending_settlements_count || 0} pending` },
        { title: 'Active Stores', value: stats?.active_schools || 0, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { title: 'Low Stock Alerts', value: stats?.low_stock_products || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-sm text-slate-500 mt-1">Welcome back! Here's what's happening across your platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-lg flex items-center justify-center`}>
                                <card.icon size={20} />
                            </div>
                            {card.sub && (
                                <span className="text-xs text-slate-400 font-medium">{card.sub}</span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                        <p className="text-sm text-slate-500 mt-1">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                        <span className="text-xs text-slate-400">{stats?.recent_orders?.length || 0} latest</span>
                    </div>

                    <div className="overflow-x-auto">
                        {stats?.recent_orders?.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Order</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stats.recent_orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-900">#{order.order_number || String(order.id).padStart(6, '0')}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-700">{order.user?.name ?? 'Guest'}</p>
                                                <p className="text-xs text-slate-400">{order.school?.name ?? 'Direct'}</p>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                ₹{Number(order.total_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {order.payment_status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-16 text-center text-slate-400">
                                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No orders yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* School Revenue */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-900">Top Schools by Revenue</h2>
                    </div>

                    <div className="p-6 space-y-5">
                        {stats?.school_revenue?.length > 0 ? stats.school_revenue.map((sr, idx) => {
                            const percentage = Math.min(100, (Number(sr.total_revenue || 0) / (Number(stats?.total_sales || 0) || 1)) * 100);
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-700">{sr.name}</span>
                                        <span className="text-sm font-bold text-slate-900">₹{Number(sr.total_revenue || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-indigo-400' : 'bg-indigo-300'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center text-slate-400">
                                <School size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No revenue data yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
