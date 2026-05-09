import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Loader2, Calendar, CheckCircle2,
    Clock, TrendingUp, Wallet, ChevronRight
} from 'lucide-react';

const SchoolSettlements = () => {
    const [settlements, setSettlements] = useState([]);
    const [stats, setStats] = useState({ earnings: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settleRes, reportRes] = await Promise.all([
                    api.get('/school/settlements'),
                    api.get('/school/reports')
                ]);
                setSettlements(settleRes.data.data || []);
                setStats({
                    earnings: reportRes.data.earnings,
                    pending: reportRes.data.pending_commissions
                });
            } catch (error) {
                console.error('Failed to fetch financial data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Earnings & Settlements</h1>
                    <p className="text-sm text-slate-500 mt-1">Track your school commissions and payment records.</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Available Earnings</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            ₹{Number(stats.earnings || 0).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Pending Settlements</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            ₹{Number(stats.pending || 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        Transaction History
                    </h2>
                    <div className="text-sm font-medium text-slate-500">
                        {settlements.length} Records
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Order ID</th>
                                <th className="px-6 py-3 font-medium text-right">Commission</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
                                        <span>Loading records...</span>
                                    </td>
                                </tr>
                            ) : settlements.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No settlement records found.
                                    </td>
                                </tr>
                            ) : settlements.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 text-sm">
                                            {new Date(s.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">
                                            {s.order_id ? `ORD-${s.order_id.toString().padStart(5, '0')}` : 'Manual Adjustment'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-semibold text-emerald-600">₹{Number(s.commission_amount || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${s.status === 'settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                                        `}>
                                            {s.status === 'settled' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {s.status === 'settled' ? 'Settled' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block" title="View Details">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SchoolSettlements;
