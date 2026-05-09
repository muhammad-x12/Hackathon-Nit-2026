import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, Zap, Truck, BarChart3, Activity, ArrowRight, Boxes, Loader2 } from 'lucide-react';

const SupplierOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/supplier/reports');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch supplier stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Active SKUs',
            value: stats?.total_sku || 0,
            icon: Layers,
            bg: 'bg-indigo-50',
            color: 'text-indigo-600'
        },
        {
            title: 'Action Required',
            value: stats?.pending_orders || 0,
            icon: Zap,
            bg: 'bg-amber-50',
            color: 'text-amber-600'
        },
        {
            title: 'Successfully Shipped',
            value: stats?.dispatched_count || 0,
            icon: Truck,
            bg: 'bg-emerald-50',
            color: 'text-emerald-600'
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Supplier Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of your inventory and fulfillment</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 ${card.bg} ${card.color} rounded-lg`}>
                                <card.icon size={20} />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{Number(card.value || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                            <BarChart3 size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">Most Ordered Items</h2>
                    </div>

                    <div className="space-y-5">
                        {stats?.top_products?.length > 0 ? stats.top_products.map((tp, idx) => {
                            const totalCap = (Number(stats?.dispatched_count || 0) + Number(stats?.pending_orders || 0)) || 1;
                            const percentage = Math.min(100, (Number(tp.total_sold || 0) / totalCap) * 100);

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <div className="font-medium text-slate-900">{tp.name}</div>
                                        <div className="text-slate-600">{tp.total_sold} units</div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center text-slate-500">
                                <Activity className="mx-auto mb-3 opacity-50" size={24} />
                                <p className="text-sm">No recent orders to show</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attention Box */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6 border border-amber-100">
                            <Zap size={24} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900 mb-2">Ops Center</h2>
                        <p className="text-sm text-slate-600 mb-6">
                            {stats?.pending_orders > 0
                                ? `You have ${stats.pending_orders} pending shipments requiring fulfillment.`
                                : "All fulfillment cycles are complete. No pending shipments."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="text-sm text-slate-600">SLA Health</span>
                            <span className="text-sm font-medium text-emerald-600">99.8%</span>
                        </div>

                        {stats?.pending_orders > 0 ? (
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                Execute Shipments
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button disabled className="w-full bg-slate-100 text-slate-400 px-4 py-2.5 rounded-lg font-medium text-sm">
                                System Optimized
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierOverview;
