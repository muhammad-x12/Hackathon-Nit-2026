import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Loader2, CheckCircle2, Clock, Package,
    ArrowRight, Search, Eye, X, MapPin, Calendar, ClipboardList, User, Phone, CheckCircle, CreditCard, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const SupplierOrders = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [dispatchForm, setDispatchForm] = useState({
        tracking_number: '',
        courier_name: ''
    });
    const [isDispatching, setIsDispatching] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/supplier/orders');
            const dt = response.data?.data ?? response.data;
            setItems(Array.isArray(dt) ? dt : []);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancelShiprocket = async (orderItemId) => {
        const ok = window.confirm('Cancel this Shiprocket order before pickup? This will cancel it in Shiprocket and mark it cancelled here.');
        if (!ok) return;
        setIsDispatching(true);
        try {
            const res = await api.post(`/supplier/shiprocket/cancel/${orderItemId}`);
            alert(res.data?.message || 'Shiprocket order cancelled.');
            await fetchOrders();
            setSelectedItem(null);
        } catch (error) {
            console.error('Shiprocket cancel failed', error);
            const d = error.response?.data;
            alert(d?.error || d?.message || 'Shiprocket cancel failed.');
        } finally {
            setIsDispatching(false);
        }
    };

    const handleCancelOrderItem = async (orderItemId) => {
        const ok = window.confirm('Cancel this order item?');
        if (!ok) return;
        setIsDispatching(true);
        try {
            const res = await api.post(`/supplier/order-item/cancel/${orderItemId}`);
            alert(res.data?.message || 'Order item cancelled.');
            await fetchOrders();
            setSelectedItem(null);
        } catch (error) {
            console.error('Cancel failed', error);
            const d = error.response?.data;
            alert(d?.error || d?.message || 'Cancel failed.');
        } finally {
            setIsDispatching(false);
        }
    };

    const handleDispatch = async (orderId) => {
        setIsDispatching(true);
        try {
            await api.patch(`/supplier/order/${orderId}/dispatch`, dispatchForm);
            fetchOrders();
            setSelectedItem(null);
            setDispatchForm({ tracking_number: '', courier_name: '' });
        } catch (error) {
            console.error('Dispatch failed', error);
            alert('Fulfillment update failed. Check console for details.');
        } finally {
            setIsDispatching(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.order_id?.toString().includes(searchQuery) ||
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Order Fulfillment</h1>
                    <p className="text-sm text-slate-500 mt-1">Review and process incoming orders for dispatch.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Order ID or Product..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Order ID</th>
                                <th className="px-6 py-3 font-medium">Product Info</th>
                                <th className="px-6 py-3 font-medium text-center">Qty</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No pending orders found.
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">
                                                ORD-{item.order_id?.toString().padStart(5, '0')}
                                            </span>
                                            {item.order?.created_at && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 uppercase">
                                                    <Calendar size={10} />
                                                    {new Date(item.order.created_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {item.product?.images?.[0] ? (
                                                    <img src={item.product?.images?.[0]} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png' }} />
                                                ) : (
                                                    <Package className="text-slate-400" size={18} />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="font-medium text-slate-900">{item.product?.name || 'Unknown Product'}</p>
                                                <p className="text-xs text-slate-500">SKU: {item.product?.sku || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-slate-900">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${item.fulfillment_status === 'dispatched' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                                        `}>
                                            {item.fulfillment_status === 'dispatched' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {item.fulfillment_status === 'dispatched' ? 'Dispatched' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> Details
                                            </button>
                                            {item.fulfillment_status !== 'dispatched' ? (
                                                <>
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
                                                    >
                                                        Dispatch
                                                        <ArrowRight size={14} />
                                                    </button>

                                                    {(item.can_cancel_shiprocket || item.can_cancel_order_item) && (
                                                        <button
                                                            onClick={() => {
                                                                if (item.can_cancel_shiprocket) return handleCancelShiprocket(item.id);
                                                                if (item.can_cancel_order_item) return handleCancelOrderItem(item.id);
                                                            }}
                                                            disabled={isDispatching}
                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5 border border-rose-200 disabled:opacity-50"
                                                        >
                                                            <X size={14} /> Cancel
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1 justify-end ml-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500" /> Processed
                                                    </span>
                                                    {item.can_cancel_shiprocket && (
                                                        <button
                                                            onClick={() => handleCancelShiprocket(item.id)}
                                                            disabled={isDispatching}
                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5 border border-rose-200 disabled:opacity-50"
                                                        >
                                                            <X size={14} /> Cancel
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                                onClick={() => { if(!isDispatching) setSelectedItem(null); }}
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
                                            <h2 className="text-lg font-bold text-slate-900">Order #ORD_{selectedItem.order_id?.toString().padStart(5, '0')}</h2>
                                            {selectedItem.order?.created_at && (
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    Placed on {new Date(selectedItem.order.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        disabled={isDispatching}
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                    {/* Product Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Package size={12} />
                                                Product
                                            </h3>
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                                                    {selectedItem.product?.images?.[0] ? (
                                                        <img src={selectedItem.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Package className="text-slate-300" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 line-clamp-1">{selectedItem.product?.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">Quantity: <span className="font-bold text-slate-900">{selectedItem.quantity}</span></p>
                                                    
                                                    {/* Variant details */}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {selectedItem.customization?.size && (
                                                            <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 shadow-sm">
                                                                Size: {selectedItem.customization.size}
                                                            </span>
                                                        )}
                                                        {selectedItem.customization?.color && (
                                                            <span className="text-[9px] font-black text-slate-600 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-sm">
                                                                Color: {selectedItem.customization.color}
                                                            </span>
                                                        )}
                                                        {!selectedItem.customization?.size && !selectedItem.customization?.color && !selectedItem.customization?.rendered_images && (
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Standard Variant</span>
                                                        )}
                                                    </div>

                                                    {/* Rendered customization shots */}
                                                    {selectedItem.customization?.rendered_images?.length > 0 && (
                                                        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                            {selectedItem.customization.rendered_images.map((img, i) => (
                                                                <img key={i} src={img} className="w-10 h-10 rounded border border-slate-200 object-cover bg-white shrink-0 shadow-sm" alt="Customization" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <MapPin size={12} />
                                                Shipping Address
                                            </h3>
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
                                                <p className="font-bold text-slate-800">{selectedItem.order?.shipping_address?.name}</p>
                                                <p className="text-slate-600">{selectedItem.order?.shipping_address?.address}</p>
                                                <p className="text-slate-600">{selectedItem.order?.shipping_address?.city}, {selectedItem.order?.shipping_address?.pincode}</p>
                                                <p className="font-medium text-indigo-600 mt-1 flex items-center gap-1">
                                                    <Phone size={10} /> {selectedItem.order?.shipping_address?.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dispatch Form or Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Truck size={12} />
                                            Logistics Tracking
                                        </h3>
                                        
                                        {selectedItem.fulfillment_status !== 'dispatched' ? (
                                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-4 shadow-inner">
                                                <p className="text-xs text-slate-500 text-center mb-2 font-medium">Please enter courier details to update the student.</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1 block">Courier Partner</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. BlueDart, Delhivery"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                                            value={dispatchForm.courier_name}
                                                            onChange={e => setDispatchForm({...dispatchForm, courier_name: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1 block">Tracking Number / AWB</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. 12345678"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                                            value={dispatchForm.tracking_number}
                                                            onChange={e => setDispatchForm({...dispatchForm, tracking_number: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center gap-3 pt-2">
                                                    <button
                                                        disabled={isDispatching}
                                                        onClick={() => handleDispatch(selectedItem.order_id)}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isDispatching ? <Loader2 className="animate-spin" size={18} /> : <Truck size={18} />}
                                                        Ship with Shiprocket (Auto)
                                                    </button>
                                                    {(selectedItem.can_cancel_shiprocket || selectedItem.can_cancel_order_item) && (
                                                        <button
                                                            disabled={isDispatching}
                                                            onClick={() => {
                                                                if (selectedItem.can_cancel_shiprocket) return handleCancelShiprocket(selectedItem.id);
                                                                if (selectedItem.can_cancel_order_item) return handleCancelOrderItem(selectedItem.id);
                                                            }}
                                                            className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 py-3 rounded-xl text-sm font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isDispatching ? <Loader2 className="animate-spin" size={18} /> : <X size={18} />}
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                    </div>
                                                    <button
                                                        disabled={isDispatching || !dispatchForm.tracking_number}
                                                        onClick={() => handleDispatch(selectedItem.order_id)}
                                                        className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-3 rounded-xl text-sm font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isDispatching ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                        Mark as Manually Dispatched
                                                    </button>
                                                    <p className="text-[10px] text-slate-400 font-medium text-center italic">
                                                        * Auto-ship will book the courier and schedule pickup using your Shiprocket account.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                        <Truck size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Dispatched via {selectedItem.courier_name || 'Standard Courier'}</p>
                                                        <p className="text-sm font-mono text-slate-600">AWB: {selectedItem.tracking_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase">
                                                    Update: Success
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                                    <button
                                        disabled={isDispatching}
                                        onClick={() => setSelectedItem(null)}
                                        className="px-6 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        Close
                                    </button>
                                </div>

                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default SupplierOrders;
