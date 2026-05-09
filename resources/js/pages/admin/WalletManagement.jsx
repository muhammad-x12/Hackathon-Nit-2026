import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    CreditCard, ArrowUpRight, ArrowDownLeft, Calendar, 
    Search, Download, Eye, Loader2, DollarSign, Send, Filter, X
} from 'lucide-react';
import Modal from '../../components/Modal';

const WalletManagement = () => {
    const [activeTab, setActiveTab] = useState('school'); // school or supplier
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal & History
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    
    // Payout Form
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        description: '',
        reference_id: ''
    });
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

    useEffect(() => {
        fetchWallets();
    }, [activeTab]);

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/wallets?type=${activeTab}`);
            setWallets(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch wallets', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (walletId) => {
        setLoadingHistory(true);
        try {
            const res = await api.get(`/admin/wallets/${walletId}/transactions`);
            setHistory(res.data.transactions || []);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleViewHistory = (wallet) => {
        setSelectedWallet(wallet);
        fetchHistory(wallet.id);
        setShowHistoryModal(true);
    };

    const handleOpenPayout = (wallet) => {
        setSelectedWallet(wallet);
        setPayoutForm({ amount: '', description: '', reference_id: '' });
        setShowPayoutModal(true);
    };

    const handleReleasePayout = async (e) => {
        e.preventDefault();
        setIsSubmittingPayout(true);
        try {
            await api.post(`/admin/wallets/${selectedWallet.id}/payout`, payoutForm);
            alert('Payout released successfully!');
            setShowPayoutModal(false);
            fetchWallets(); // Refresh balances
        } catch (err) {
            console.error('Payout failed', err);
            alert(err.response?.data?.error || 'Failed to release payout');
        } finally {
            setIsSubmittingPayout(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const filteredWallets = wallets.filter(w => 
        w.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Wallet Management</h1>
                    <p className="text-sm text-slate-500">Track and manage payments for schools and suppliers</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Balances</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(wallets.reduce((acc, w) => acc + parseFloat(w.balance), 0))}</p>
                    <p className="text-xs text-slate-500 mt-1">Found in current view</p>
                </div>
            </div>

            {/* Filters & Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('school')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'school' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Schools
                        </button>
                        <button 
                            onClick={() => setActiveTab('supplier')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'supplier' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Suppliers
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={`Search ${activeTab}s...`}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="h-10 bg-slate-50 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredWallets.length > 0 ? (
                                filteredWallets.map(wallet => (
                                    <tr key={wallet.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                                    {wallet.owner?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{wallet.owner?.name}</p>
                                                    <p className="text-xs text-slate-500">{wallet.owner?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">{formatCurrency(wallet.balance)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                wallet.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                {wallet.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewHistory(wallet)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="View History"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenPayout(wallet)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                                                >
                                                    <Send size={14} />
                                                    Payout
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                        <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No wallets found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Modal */}
            <Modal
                show={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                title={`Transaction History - ${selectedWallet?.owner?.name}`}
                maxWidth="3xl"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-3" size={32} />
                            <p className="text-sm font-medium">Fetching transactions...</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {history.map(tx => (
                                <div key={tx.id} className="py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 
                                            tx.type === 'payout' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${
                                            tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <p>No transactions found for this wallet.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Payout Modal */}
            <Modal
                show={showPayoutModal}
                onClose={() => setShowPayoutModal(false)}
                title="Release Payment"
            >
                <form onSubmit={handleReleasePayout} className="space-y-5">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
                        <DollarSign className="text-amber-600 shrink-0" size={20} />
                        <div>
                            <p className="text-xs text-amber-700 font-semibold mb-1">Available Balance</p>
                            <p className="text-lg font-bold text-amber-900">{formatCurrency(selectedWallet?.balance || 0)}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Amount to Payout</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input 
                                required
                                type="number" 
                                min="1"
                                max={selectedWallet?.balance}
                                step="any"
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={payoutForm.amount}
                                onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 italic font-medium px-1">Cannot exceed current wallet balance.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Description (internal)</label>
                        <textarea 
                            required
                            placeholder="e.g., Monthly payout for March 2025"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[80px] resize-none"
                            value={payoutForm.description}
                            onChange={(e) => setPayoutForm({...payoutForm, description: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Bank Reference / TXN ID</label>
                        <input 
                            type="text" 
                            placeholder="Optional: Ref 123456"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={payoutForm.reference_id}
                            onChange={(e) => setPayoutForm({...payoutForm, reference_id: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setShowPayoutModal(false)}
                            className="flex-1 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmittingPayout || !payoutForm.amount || parseFloat(payoutForm.amount) > parseFloat(selectedWallet?.balance)}
                            className="flex-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmittingPayout ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Release Payment
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WalletManagement;
