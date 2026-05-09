import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
    Search, Loader2, Calendar, Building2, CreditCard, CheckCircle2, Clock, Plus, X, Trash2,
    Download, Factory, Layers, Wallet,
} from 'lucide-react';

const SettlementManagement = () => {
    const [tab, setTab] = useState('all');
    const [settlements, setSettlements] = useState([]);
    const [summary, setSummary] = useState({ schools: [], suppliers: [] });
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [schools, setSchools] = useState([]);
    const [suppliersList, setSuppliersList] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [newSettlement, setNewSettlement] = useState({
        recipient: 'school',
        school_id: '',
        supplier_id: '',
        order_id: '',
        commission_amount: '',
        status: 'pending',
        payment_mode: '',
        reference_id: '',
        payment_notes: '',
        debit_wallet: true,
    });

    const [bulkSchool, setBulkSchool] = useState(null);
    const [bulkSupplier, setBulkSupplier] = useState(null);
    const [bulkForm, setBulkForm] = useState({
        payment_mode: '',
        reference_id: '',
        payment_notes: '',
        amount: '',
        debit_wallet: true,
    });

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/settlements');
            const payload = response.data ?? {};
            const raw = payload.data;
            const list = Array.isArray(raw) ? raw : [];
            setSettlements(list);
        } catch (error) {
            console.error('Failed to fetch settlements', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        setSummaryLoading(true);
        try {
            const res = await api.get('/admin/settlements/summary');
            const d = res.data ?? {};
            setSummary({
                schools: Array.isArray(d.schools) ? d.schools : [],
                suppliers: Array.isArray(d.suppliers) ? d.suppliers : [],
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [sch, sup] = await Promise.all([
                    api.get('/admin/schools?per_page=500'),
                    api.get('/admin/suppliers/all'),
                ]);
                setSchools(sch.data?.data || []);
                setSuppliersList(Array.isArray(sup.data) ? sup.data : []);
            } catch (e) {
                console.error(e);
            }
        };
        load();
        fetchSettlements();
        fetchSummary();
    }, []);

    const filteredSettlements = useMemo(() => (settlements || []).filter((s) => {
        const schoolName = (s.school?.name || '').toLowerCase();
        const supName = (s.supplier?.name || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return schoolName.includes(q) || supName.includes(q) || (s.order_id?.toString() || '').includes(q);
    }), [settlements, searchQuery]);

    const schoolsWithUnsettled = useMemo(
        () => (summary.schools || []).filter(
            (s) => Number(s.unsettled) > 0 || Number(s.pending_settlement_count) > 0
        ),
        [summary.schools]
    );

    const suppliersWithUnsettled = useMemo(
        () => (summary.suppliers || []).filter((s) => Number(s.unsettled) > 0),
        [summary.suppliers]
    );

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const body = {
                order_id: newSettlement.order_id || null,
                commission_amount: parseFloat(newSettlement.commission_amount, 10),
                status: newSettlement.status,
                payment_mode: newSettlement.payment_mode || null,
                reference_id: newSettlement.reference_id || null,
                payment_notes: newSettlement.payment_notes || null,
            };
            if (newSettlement.recipient === 'school') {
                body.school_id = parseInt(newSettlement.school_id, 10);
            } else {
                body.supplier_id = parseInt(newSettlement.supplier_id, 10);
                body.debit_wallet = newSettlement.debit_wallet;
            }
            await api.post('/admin/settlements', body);
            setShowModal(false);
            setNewSettlement({
                recipient: 'school',
                school_id: '',
                supplier_id: '',
                order_id: '',
                commission_amount: '',
                status: 'pending',
                payment_mode: '',
                reference_id: '',
                payment_notes: '',
                debit_wallet: true,
            });
            fetchSettlements();
            fetchSummary();
        } catch (err) {
            console.error('Failed to create settlement', err);
            const msg = err.response?.data?.message || err.response?.data?.errors
                ? JSON.stringify(err.response.data.errors)
                : 'Error creating settlement';
            alert(typeof msg === 'string' ? msg : 'Error creating settlement');
        }
    };

    const updateStatus = async (id, currentStatus) => {
        const next = currentStatus === 'settled' ? 'pending' : 'settled';
        try {
            await api.patch(`/admin/settlements/${id}/status`, { status: next });
            fetchSettlements();
            fetchSummary();
        } catch (e) {
            console.error('Failed to update status', e);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this settlement record?')) return;
        try {
            await api.delete(`/admin/settlements/${id}`);
            fetchSettlements();
            fetchSummary();
        } catch (e) {
            console.error('Failed to delete settlement', e);
        }
    };

    const handleExport = async (exportTab) => {
        try {
            const res = await api.get(`/admin/settlements/export?tab=${exportTab}`, { responseType: 'blob' });
            const contentType = String(res.headers?.['content-type'] || '');
            const isXlsx = contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // If the API returned JSON/HTML (auth error/validation/500), do NOT download a fake .xlsx.
            if (!isXlsx) {
                const text = await res.data.text().catch(() => '');
                const msg = text?.slice(0, 400) || 'Export failed (unexpected response).';
                alert(msg);
                return;
            }

            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settlements-${exportTab}-${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Export failed.');
        }
    };

    const submitBulkSchool = async (e) => {
        e.preventDefault();
        if (!bulkSchool) return;
        try {
            await api.post('/admin/settlements/bulk-school', {
                school_id: bulkSchool.id,
                payment_mode: bulkForm.payment_mode || null,
                reference_id: bulkForm.reference_id || null,
                payment_notes: bulkForm.payment_notes || null,
            });
            setBulkSchool(null);
            setBulkForm({ payment_mode: '', reference_id: '', payment_notes: '', amount: '', debit_wallet: true });
            fetchSettlements();
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Bulk settle failed');
        }
    };

    const submitBulkSupplier = async (e) => {
        e.preventDefault();
        if (!bulkSupplier) return;
        const amt = parseFloat(bulkForm.amount, 10);
        if (!Number.isFinite(amt) || amt <= 0) {
            alert('Enter a valid amount.');
            return;
        }
        try {
            await api.post('/admin/settlements/bulk-supplier', {
                supplier_id: bulkSupplier.id,
                amount: amt,
                payment_mode: bulkForm.payment_mode || null,
                reference_id: bulkForm.reference_id || null,
                payment_notes: bulkForm.payment_notes || null,
                debit_wallet: bulkForm.debit_wallet,
            });
            setBulkSupplier(null);
            setBulkForm({ payment_mode: '', reference_id: '', payment_notes: '', amount: '', debit_wallet: true });
            fetchSettlements();
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || 'Payout failed');
        }
    };

    const totalCommission = settlements.reduce((sum, s) => sum + Number(s.commission_amount || 0), 0);

    const openBulkSupplier = (row) => {
        setBulkSupplier(row);
        setBulkForm((f) => ({
            ...f,
            amount: String(row.unsettled ?? ''),
            debit_wallet: true,
        }));
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Settlements</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {settlements.length} records · Total commission (all rows): ₹{totalCommission.toLocaleString()}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleExport(tab === 'all' ? 'all' : tab)}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm"
                    >
                        <Download size={18} /> Export .xlsx
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-md shadow-indigo-100"
                    >
                        <Plus size={18} /> Create settlement
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                {[
                    { id: 'all', label: 'All', icon: Layers },
                    { id: 'schools', label: 'Schools', icon: Building2 },
                    { id: 'suppliers', label: 'Suppliers', icon: Factory },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-bold uppercase tracking-wide border-b-2 transition-colors
                            ${tab === id
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/80'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Record settlement</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                {['school', 'supplier'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setNewSettlement({ ...newSettlement, recipient: r })}
                                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                            ${newSettlement.recipient === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {newSettlement.recipient === 'school' ? (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">School</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        value={newSettlement.school_id}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, school_id: e.target.value })}
                                    >
                                        <option value="">Select…</option>
                                        {schools.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Supplier</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        value={newSettlement.supplier_id}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, supplier_id: e.target.value })}
                                    >
                                        <option value="">Select…</option>
                                        {suppliersList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newSettlement.debit_wallet}
                                            onChange={(e) => setNewSettlement({ ...newSettlement, debit_wallet: e.target.checked })}
                                        />
                                        Debit supplier wallet when status is settled
                                    </label>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Order ID</label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newSettlement.order_id}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, order_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newSettlement.commission_amount}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, commission_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment mode</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2"
                                        value={newSettlement.payment_mode}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, payment_mode: e.target.value })}
                                    >
                                        <option value="">Select…</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reference</label>
                                    <input
                                        type="text"
                                        placeholder="TXN…"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none"
                                        value={newSettlement.reference_id}
                                        onChange={(e) => setNewSettlement({ ...newSettlement, reference_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none"
                                    rows={2}
                                    placeholder="Details…"
                                    value={newSettlement.payment_notes}
                                    onChange={(e) => setNewSettlement({ ...newSettlement, payment_notes: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">Status</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                    {['pending', 'settled'].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setNewSettlement({ ...newSettlement, status: st })}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                                ${newSettlement.status === st ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-100"
                            >
                                Save
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {bulkSchool && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Settle all pending — {bulkSchool.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Marks every pending school commission line for this school as settled (lump payment).
                        </p>
                        <form onSubmit={submitBulkSchool} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Payment mode"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                value={bulkForm.payment_mode}
                                onChange={(e) => setBulkForm({ ...bulkForm, payment_mode: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Reference"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                value={bulkForm.reference_id}
                                onChange={(e) => setBulkForm({ ...bulkForm, reference_id: e.target.value })}
                            />
                            <textarea
                                placeholder="Notes"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                rows={2}
                                value={bulkForm.payment_notes}
                                onChange={(e) => setBulkForm({ ...bulkForm, payment_notes: e.target.value })}
                            />
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setBulkSchool(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Confirm lump settle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {bulkSupplier && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Supplier payout — {bulkSupplier.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Wallet balance: ₹{Number(bulkSupplier.unsettled || 0).toLocaleString()}
                        </p>
                        <form onSubmit={submitBulkSupplier} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm font-bold"
                                    value={bulkForm.amount}
                                    onChange={(e) => setBulkForm({ ...bulkForm, amount: e.target.value })}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={bulkForm.debit_wallet}
                                    onChange={(e) => setBulkForm({ ...bulkForm, debit_wallet: e.target.checked })}
                                />
                                Debit wallet by this amount
                            </label>
                            <input
                                type="text"
                                placeholder="Payment mode"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                value={bulkForm.payment_mode}
                                onChange={(e) => setBulkForm({ ...bulkForm, payment_mode: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Reference"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                value={bulkForm.reference_id}
                                onChange={(e) => setBulkForm({ ...bulkForm, reference_id: e.target.value })}
                            />
                            <textarea
                                placeholder="Notes"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                rows={2}
                                value={bulkForm.payment_notes}
                                onChange={(e) => setBulkForm({ ...bulkForm, payment_notes: e.target.value })}
                            />
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setBulkSupplier(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Record payout</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tab === 'schools' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">Schools with pending commission lines only.</p>
                        {summaryLoading ? <Loader2 className="animate-spin text-indigo-500" size={20} /> : null}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schoolsWithUnsettled.length === 0 && !summaryLoading && (
                            <p className="text-slate-400 text-sm col-span-full">No unsettled school commissions.</p>
                        )}
                        {schoolsWithUnsettled.map((s) => (
                            <div
                                key={s.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 truncate">{s.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{s.subdomain || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Unsettled</p>
                                        <p className="text-xl font-black text-amber-600">₹{Number(s.unsettled).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500">{s.pending_settlement_count} pending row(s)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBulkSchool(s);
                                            setBulkForm({ payment_mode: '', reference_id: '', payment_notes: '', amount: '', debit_wallet: true });
                                        }}
                                        className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide"
                                    >
                                        Settle all
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'suppliers' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">Suppliers with wallet balance (unsettled) only.</p>
                        {summaryLoading ? <Loader2 className="animate-spin text-indigo-500" size={20} /> : null}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suppliersWithUnsettled.length === 0 && !summaryLoading && (
                            <p className="text-slate-400 text-sm col-span-full">No supplier wallet balance to settle.</p>
                        )}
                        {suppliersWithUnsettled.map((s) => (
                            <div
                                key={s.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                                        <Wallet size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 truncate">{s.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{s.email || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Wallet unsettled</p>
                                        <p className="text-xl font-black text-amber-600">₹{Number(s.unsettled).toLocaleString()}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openBulkSupplier(s)}
                                        className="shrink-0 px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold uppercase tracking-wide"
                                    >
                                        Payout
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'all' && (
                <>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search school, supplier, or order ID…"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">School / Supplier</th>
                                        <th className="px-6 py-4">Order</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                                <p className="text-sm text-slate-400 mt-2">Loading…</p>
                                            </td>
                                        </tr>
                                    ) : filteredSettlements.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                                                <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">No settlements</p>
                                            </td>
                                        </tr>
                                    ) : filteredSettlements.map((s) => {
                                        const isSup = !!s.supplier_id;
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isSup ? 'bg-violet-50 text-violet-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                        {isSup ? 'Supplier' : 'School'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${isSup ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                            {isSup ? <Factory size={16} /> : <Building2 size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">
                                                                {isSup ? (s.supplier?.name || '—') : (s.school?.name || '—')}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 uppercase">ID: {isSup ? s.supplier_id : s.school_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {s.order_id ? `#${String(s.order_id).padStart(6, '0')}` : 'Lump / manual'}
                                                    </span>
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} />
                                                        {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                                                    ₹{Number(s.commission_amount || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateStatus(s.id, s.status)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all
                                                            ${s.status === 'settled'
                                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-200'
                                                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-200'}`}
                                                    >
                                                        {s.status === 'settled' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                        {s.status === 'settled' ? 'Settled' : 'Pending'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(s.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SettlementManagement;
