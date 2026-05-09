import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Search, Loader2, Eye, X, Package, ShoppingCart,
    CheckCircle2, Clock, Truck, AlertCircle, CreditCard, User, School,
    ChevronLeft, ChevronRight, Calendar, MapPin
} from 'lucide-react';

const StatusBadge = ({ label }) => {
    const colors = {
        paid: 'bg-emerald-50 text-emerald-700',
        pending: 'bg-amber-50 text-amber-700',
        failed: 'bg-rose-50 text-rose-700',
        refunded: 'bg-slate-100 text-slate-600',
        delivered: 'bg-emerald-50 text-emerald-700',
        processing: 'bg-blue-50 text-blue-700',
        cancelled: 'bg-rose-50 text-rose-700',
        dispatched: 'bg-indigo-50 text-indigo-700',
        confirmed: 'bg-teal-50 text-teal-700',
    };
    const cls = colors[label?.toLowerCase()] || 'bg-slate-100 text-slate-600';
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls}`}>
            {label || 'unknown'}
        </span>
    );
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/orders?page=${page}`);
            const data = res.data;
            setOrders(data.data || []);
            setCurrentPage(data.meta?.current_page ?? data.current_page ?? 1);
            setLastPage(data.meta?.last_page ?? data.last_page ?? 1);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(1); }, []);

    const handleViewOrder = async (id) => {
        setDetailLoading(true);
        setSelectedOrder({ id });
        try {
            const res = await api.get(`/admin/order/${id}`);
            setSelectedOrder(res.data.data ?? res.data);
        } catch (error) {
            console.error('Failed to fetch order details', error);
            setSelectedOrder(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const filtered = orders.filter(o => {
        const matchesSearch =
            o.order_number?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.school?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
        return matchesSearch && matchesPayment;
    });

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
                <p className="text-sm text-slate-500 mt-1">{orders.length} orders on this page</p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order #, customer, or school..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {['all', 'paid', 'pending', 'failed'].map(f => (
                        <button key={f} onClick={() => setPaymentFilter(f)}
                            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors
                                ${paymentFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Order</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">School</th>
                                <th className="px-6 py-3 text-center">Method</th>
                                <th className="px-6 py-3 text-center">Payment</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                        <p className="text-sm text-slate-400 mt-2">Loading orders...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                                        <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No orders found</p>
                                    </td>
                                </tr>
                            ) : filtered.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">#{order.order_number || String(order.id).padStart(6, '0')}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{order.user?.name ?? 'Guest'}</p>
                                        <p className="text-xs text-slate-400">{order.user?.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{order.school?.name ?? 'Direct'}</p>
                                        {(() => {
                                            const involvedSuppliers = [...new Set((order.items || []).map(i => i.product?.supplier?.name).filter(Boolean))];
                                            if (involvedSuppliers.length === 0) return null;
                                            return (
                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                    <Package size={10} className="shrink-0" />
                                                    <span className="truncate max-w-[150px]" title={involvedSuppliers.join(', ')}>
                                                        {involvedSuppliers.join(', ')}
                                                    </span>
                                                </p>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            {order.payment_method || 'online'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge label={order.payment_status} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                        ₹{Number(order.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewOrder(order.id)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="View details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                        <p className="text-sm text-slate-500">Page {currentPage} of {lastPage}</p>
                        <div className="flex gap-2">
                            <button disabled={currentPage <= 1} onClick={() => fetchOrders(currentPage - 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white disabled:opacity-30 transition-colors flex items-center gap-1">
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button disabled={currentPage >= lastPage} onClick={() => fetchOrders(currentPage + 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white disabled:opacity-30 transition-colors flex items-center gap-1">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Order #{selectedOrder.order_number || String(selectedOrder.id).padStart(6, '0')}
                                </h2>
                                {selectedOrder.created_at && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(selectedOrder.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setSelectedOrder(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {detailLoading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                    <p className="text-sm text-slate-400 mt-2">Loading details...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Status Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Payment', value: selectedOrder.payment_status },
                                            { label: 'Order', value: selectedOrder.order_status },
                                            { label: 'Delivery', value: selectedOrder.delivery_status },
                                            { label: 'Supplier', value: selectedOrder.supplier_status },
                                        ].map(s => (
                                            <div key={s.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                                                <StatusBadge label={s.value} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer, School & Shipping */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                <User size={16} /> Customer
                                            </div>
                                            <p className="text-base font-semibold text-slate-900">{selectedOrder.user?.name ?? 'Guest'}</p>
                                            <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                                            {selectedOrder.user?.phone && <p className="text-sm text-slate-500">{selectedOrder.user?.phone}</p>}
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                <School size={16} /> School
                                            </div>
                                            <p className="text-base font-semibold text-slate-900">{selectedOrder.school?.name ?? 'Direct Order'}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                <MapPin size={16} /> Shipping Address
                                            </div>
                                            {selectedOrder.shipping_address ? (
                                                <>
                                                    <p className="text-sm font-semibold text-slate-900">{selectedOrder.shipping_address.name || selectedOrder.user?.name}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{selectedOrder.shipping_address.address}</p>
                                                    <p className="text-sm text-slate-500">{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.pincode}</p>
                                                    {selectedOrder.shipping_address.phone && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">📞 {selectedOrder.shipping_address.phone}</p>}
                                                </>
                                            ) : (
                                                <p className="text-sm text-slate-500 italic">No shipping details provided</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items ({selectedOrder.items?.length || 0})</h3>
                                        <div className="space-y-3">
                                            {(selectedOrder.items ?? []).map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                                                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                                                        {item.product_image ? (
                                                            <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{item.product_name}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            {item.product?.supplier?.name && (
                                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded leading-none flex items-center gap-1">
                                                                    📦 {item.product.supplier.name}
                                                                </span>
                                                            )}
                                                            <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}</p>
                                                            {item.customization?.size && (
                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded leading-none uppercase">Size: {item.customization.size}</span>
                                                            )}
                                                            {item.customization?.color && (
                                                                <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded leading-none uppercase">Color: {item.customization.color}</span>
                                                            )}
                                                            {item.customization?.rendered_images?.length > 0 && (
                                                                <div className="flex gap-1 mt-1.5">
                                                                    {item.customization.rendered_images.map((img, idx) => (
                                                                        <img key={idx} src={img} className="w-8 h-8 rounded border border-slate-200 object-contain bg-white" alt="Cst" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="font-semibold text-slate-900">₹{Number(item.subtotal).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-slate-400">Total Amount</p>
                                            <p className="text-3xl font-bold">₹{Number(selectedOrder.total_amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="md:text-right">
                                            <div className="flex flex-wrap md:justify-end gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20">
                                                    Mode: {selectedOrder.payment_method || 'online'}
                                                </span>
                                                {selectedOrder.payment_provider && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20">
                                                        Via: {selectedOrder.payment_provider}
                                                    </span>
                                                )}
                                            </div>
                                            {selectedOrder.transaction_id && (
                                                <p className="text-xs text-slate-500 font-mono break-all">{selectedOrder.transaction_id}</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
