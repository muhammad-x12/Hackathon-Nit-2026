import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ShoppingCart, Search, Loader2, ChevronDown, Eye, Clock,
    CheckCircle2, Truck, AlertCircle, Calendar, User,
    ClipboardList, Info, Box, X, MapPin, Phone, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const SchoolOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await api.get('/school/orders');
                const payload = response.data ?? {};
                const raw = payload.data;
                const list = Array.isArray(raw)
                    ? raw
                    : Array.isArray(payload)
                        ? payload
                        : [];
                setOrders(list);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const displayStatus = (order) => {
        if (order.payment_status === 'failed') return 'payment failed';
        return order.order_status || order.status || '—';
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'processing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'payment failed': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'failed': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'cancelled': return 'bg-slate-200 text-slate-700 border-slate-300';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} />;
            case 'shipped': return <Truck size={16} />;
            case 'pending': return <Clock size={16} />;
            case 'payment failed': return <AlertCircle size={16} />;
            case 'failed': return <AlertCircle size={16} />;
            default: return <Info size={16} />;
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchQuery) ||
        o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
                    <p className="text-slate-500 text-sm">Monitor and track orders from students and parents.</p>
                </div>
                <div className="flex bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 items-center gap-2 text-xs font-bold text-slate-700">
                    <ClipboardList size={14} className="text-indigo-500" />
                    <span className="uppercase tracking-wider">Internal Tracking</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find order by ID or name..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                        {filteredOrders.length} Orders Found
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                                        <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                                        <span>Loading orders...</span>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No matching orders found.
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-xs">#ORD_{order.id.toString().padStart(6, '0')}</span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-bold uppercase">
                                                <Calendar size={10} />
                                                {new Date(order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-xs leading-tight">{order.customer?.name || 'Guest User'}</span>
                                                <span className="text-[10px] text-slate-400">{order.customer?.email || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2 items-center">
                                            {order.items?.length > 0 ? order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                                                    {(item.product_image || item.product?.images?.[0]) ?
                                                        <img 
                                                            src={item.product_image || (item.product.images[0].startsWith('http') ? item.product.images[0] : `/storage/${item.product.images[0].replace(/^\//, '')}`)} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                        :
                                                        <Box size={14} className="text-slate-300" />
                                                    }
                                                </div>
                                            )) : (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Items</span>
                                            )}
                                            {order.items?.length > 3 && (
                                                <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm z-10">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(displayStatus(order))}`}>
                                            {getStatusIcon(displayStatus(order))}
                                            {displayStatus(order)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100 transition-colors"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Value</span>
                        <span className="text-sm font-bold text-slate-900 px-3 py-1 bg-white rounded border border-slate-200 shadow-sm">
                            ₹{orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">Next</button>
                    </div>
                </div>

                {/* Order Details Modal */}
                {typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {selectedOrder && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                                    onClick={() => setSelectedOrder(null)}
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                                >
                                    {/* Modal Header */}
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <ClipboardList className="text-indigo-600" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900">Order #ORD_{selectedOrder.id.toString().padStart(6, '0')}</h2>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    Placed on {new Date(selectedOrder.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Customer Info */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <User size={12} />
                                                    Customer Profile
                                                </h3>
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shadow-sm">
                                                            {selectedOrder.customer?.name?.[0] || 'G'}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900">{selectedOrder.customer?.name || 'Guest User'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
                                                        <Mail size={12} />
                                                        {selectedOrder.customer?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shipping Info */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <MapPin size={12} />
                                                    Shipping Address
                                                </h3>
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                                    {selectedOrder.shipping_address ? (
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-bold text-slate-800">{selectedOrder.shipping_address.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                <Phone size={12} className="shrink-0" />
                                                                {selectedOrder.shipping_address.phone}
                                                            </div>
                                                            <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                                                                <MapPin size={12} className="shrink-0 mt-0.5" />
                                                                <span>
                                                                    {selectedOrder.shipping_address.address},<br />
                                                                    {selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.pincode}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No shipping information available.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Box size={12} />
                                                Order Items ({selectedOrder.items?.length || 0})
                                            </h3>
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left">Product</th>
                                                            <th className="px-4 py-3 text-center">Qty</th>
                                                            <th className="px-4 py-3 text-right">Price</th>
                                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {selectedOrder.items?.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                                            {(item.product_image || item.product?.images?.[0]) ?
                                                                                <img 
                                                                                    src={item.product_image || (item.product.images[0].startsWith('http') ? item.product.images[0] : `/storage/${item.product.images[0].replace(/^\//, '')}`)} 
                                                                                    className="w-full h-full object-cover" 
                                                                                />
                                                                                : <Box size={16} className="text-slate-300" />
                                                                            }
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-slate-700 text-xs block">{item.product_name || item.product?.name || 'Unknown'}</span>
                                                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                                {item.customization?.size && (
                                                                                    <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 shadow-sm">
                                                                                        Size: {item.customization.size}
                                                                                    </span>
                                                                                )}
                                                                                {item.customization?.color && (
                                                                                    <span className="text-[9px] font-black text-slate-600 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-sm">
                                                                                        Color: {item.customization.color}
                                                                                    </span>
                                                                                )}
                                                                                {item.customization?.rendered_images?.length > 0 && (
                                                                                    <div className="flex gap-1.5 mt-2">
                                                                                        {item.customization.rendered_images.map((img, i) => (
                                                                                            <img key={i} src={img} className="w-8 h-8 rounded border border-slate-200 object-contain bg-white shrink-0" alt="Cst" />
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                                {item.fulfillment_status === 'dispatched' && (
                                                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1 rounded border border-emerald-100 flex items-center gap-1 overflow-hidden">
                                                                                        <CheckCircle2 size={8} /> Dispatched
                                                                                    </span>
                                                                                )}
                                                                                {item.tracking_url && (
                                                                                    <a
                                                                                        href={item.tracking_url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1 rounded border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1"
                                                                                    >
                                                                                        <Truck size={8} /> Track Item
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-bold text-slate-600">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600 font-medium">₹{Number(item.price).toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100">
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-3 text-right text-slate-500 uppercase tracking-widest text-[10px]">Total Order Value</td>
                                                            <td className="px-4 py-3 text-right text-indigo-600 text-base">₹{Number(selectedOrder.total_amount).toLocaleString()}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="px-8 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                                        >
                                            Close Details
                                        </button>
                                    </div>

                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default SchoolOrders;
