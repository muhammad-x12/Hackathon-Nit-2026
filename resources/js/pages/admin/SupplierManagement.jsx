import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Search, Edit, Trash2, Loader2, Mail, Phone, Store } from 'lucide-react';

const SupplierManagement = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const fetchSuppliers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/suppliers?page=${page}&search=${search}`);
            setSuppliers(response.data.data || []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total
            });
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuppliers(1, searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchSuppliers(newPage, searchQuery);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await api.patch(`/admin/supplier/${id}/status`);
            fetchSuppliers(pagination.current_page, searchQuery);
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await api.delete(`/admin/supplier/${id}`);
                fetchSuppliers(pagination.current_page, searchQuery);
            } catch (error) {
                console.error('Failed to delete supplier', error);
                alert(error.response?.data?.message || 'Failed to delete supplier');
            }
        }
    };

    const parseContact = (info) => {
        try {
            return typeof info === 'string' ? JSON.parse(info || '{}') : (info || {});
        } catch { return {}; }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
                    <p className="text-sm text-slate-500 mt-1">{pagination.total} suppliers registered</p>
                </div>
                <button
                    onClick={() => navigate('/admin/suppliers/add')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Add Supplier
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or email (Global)..."
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Supplier</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3 text-center">Priority</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                        <p className="text-sm text-slate-400 mt-2">Loading suppliers...</p>
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                                        <Store size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No suppliers found</p>
                                    </td>
                                </tr>
                            ) : suppliers.map((supplier) => {
                                const contact = parseContact(supplier.contact_info);
                                return (
                                    <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <span className="font-semibold text-slate-900">{supplier.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{supplier.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {contact.email && <p className="flex items-center gap-1.5 text-slate-600"><Mail size={12} /> {contact.email}</p>}
                                                {contact.phone && <p className="flex items-center gap-1.5 text-slate-500 mt-0.5"><Phone size={12} /> {contact.phone}</p>}
                                                {!contact.email && !contact.phone && <span className="text-slate-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border border-slate-200 ${supplier.priority <= 1 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600'}`}>
                                                {supplier.priority || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(supplier.id)}
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer
                                                    ${supplier.status === 'active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {supplier.status === 'active' ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/suppliers/edit/${supplier.id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(supplier.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Pagination Controls */}
                {!loading && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 font-medium">
                            Showing <span className="text-slate-900">{suppliers.length}</span> of <span className="text-slate-900">{pagination.total}</span> suppliers
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center px-4">
                                <span className="text-xs font-bold text-slate-900">Page {pagination.current_page}</span>
                                <span className="text-xs text-slate-400 mx-1">of</span>
                                <span className="text-xs font-semibold text-slate-600">{pagination.last_page}</span>
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierManagement;
