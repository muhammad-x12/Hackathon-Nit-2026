import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Loader2, CheckCircle2, Clock, Package,
    ArrowRight, Search, Calendar, X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const SupplierOrders = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState({ id: null, type: '' });
    const [shipLoadingId, setShipLoadingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const downloadUrl = async (url, filename = 'image') => {
        if (!url) return;
        try {
            const res = await fetch(url, { credentials: 'include' });
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error('Download failed', e);
            window.open(url, '_blank');
        }
    };

    const downloadMany = async (urls = [], prefix = 'image') => {
        const list = (urls || []).filter(Boolean);
        if (list.length === 0) return;
        // Download sequentially to avoid browser blocking
        for (let i = 0; i < list.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await downloadUrl(list[i], `${prefix}-${i + 1}`);
        }
    };

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

    const handleTrack = async (awb) => {
        if (!awb) return;
        setActionLoading({ id: awb, type: 'track' });
        try {
            const res = await api.get(`/supplier/shipment/track/${awb}`);
            const status = res.data.tracking_data?.shipment_track?.[0]?.current_status || 'In Transit';
            alert(`Shipment Status: ${status}`);
        } catch (e) {
            console.error('Track failed', e);
            alert('Could not retrieve live tracking. Check if AWB is valid.');
        } finally {
            setActionLoading({ id: null, type: '' });
        }
    };

    const handleDownloadLabel = async (orderId, shipmentId) => {
        if (!shipmentId) {
            alert('No Shiprocket shipment ID found for this item. Ship with Shiprocket first.');
            return;
        }
        setActionLoading({ id: orderId, type: 'label' });
        try {
            const res = await api.get(`/supplier/shipment/label/${shipmentId}`);
            if (res.data.label_url) {
                window.open(res.data.label_url, '_blank');
            }
        } catch (e) {
            console.error('Label failed', e);
            alert('Could not generate label. Ensure Shiprocket is configured.');
        } finally {
            setActionLoading({ id: null, type: '' });
        }
    };

    const handleCancelShiprocket = async (orderItemId) => {
        const ok = window.confirm('Cancel this Shiprocket shipment? This will cancel in Shiprocket and mark it cancelled here.');
        if (!ok) return;
        setActionLoading({ id: orderItemId, type: 'cancel_shiprocket' });
        try {
            const res = await api.post(`/supplier/shiprocket/cancel/${orderItemId}`);
            alert(res.data?.message || 'Shipment cancelled.');
            await fetchOrders();
        } catch (e) {
            console.error(e);
            const d = e.response?.data;
            const msg = d?.error || d?.message || 'Cancel failed.';
            alert(typeof msg === 'string' ? msg : JSON.stringify(d?.details || d));
        } finally {
            setActionLoading({ id: null, type: '' });
        }
    };

    const handleCancelOrderItem = async (orderItemId) => {
        const ok = window.confirm('Cancel this order item? This will cancel it in your panel.');
        if (!ok) return;
        setActionLoading({ id: orderItemId, type: 'cancel_item' });
        try {
            const res = await api.post(`/supplier/order-item/cancel/${orderItemId}`);
            alert(res.data?.message || 'Order item cancelled.');
            await fetchOrders();
        } catch (e) {
            console.error(e);
            const d = e.response?.data;
            const msg = d?.error || d?.message || 'Cancel failed.';
            alert(typeof msg === 'string' ? msg : JSON.stringify(d?.details || d));
        } finally {
            setActionLoading({ id: null, type: '' });
        }
    };

    /**
     * Single Shiprocket path: create shipment (if needed) + assign AWB without courier_id
     * so Shiprocket picks the partner (same strategy as their dashboard — not the serviceability list).
     */
    const handleShiprocketAuto = async (orderItemId) => {
        setShipLoadingId(orderItemId);
        try {
            const res = await api.post(`/supplier/shiprocket/ship-and-dispatch/${orderItemId}`);
            const courier = res.data?.courier ? ` (${res.data.courier})` : '';
            const awb = res.data?.awb ? ` AWB: ${res.data.awb}` : '';
            alert((res.data?.message || 'Shipped via Shiprocket.') + courier + awb);
            await fetchOrders();
        } catch (e) {
            console.error(e);
            const d = e.response?.data;
            const msg = d?.error || d?.message || 'Shiprocket ship failed.';
            alert(typeof msg === 'string' ? msg : JSON.stringify(d?.details || d));
        } finally {
            setShipLoadingId(null);
        }
    };

    const filteredItems = items.filter(item =>
        item.order_id?.toString().includes(searchQuery) ||
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Shiprocket Fulfillment</h1>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                        One click creates the shipment (if needed) and assigns AWB the same way as the Shiprocket panel:
                        Shiprocket chooses the courier. The old serviceability list API is only an estimate and often does not include who Shiprocket actually assigns — fulfillment no longer uses it.
                    </p>
                </div>
            </div>

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
                                <th className="px-6 py-3 font-medium text-center">Shipping Status</th>
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
                            ) : filteredItems.map((item) => {
                                const paymentFailed = item.order?.payment_status === 'failed';
                                const isCancelled =
                                    item.fulfillment_status === 'cancelled' ||
                                    item.order?.status === 'cancelled' ||
                                    item.order?.order_status === 'cancelled';
                                return (
                                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${paymentFailed ? 'bg-rose-50/40' : ''}`}>
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
                                            {paymentFailed && (
                                                <span className="mt-1 text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-sm w-fit uppercase tracking-tighter">
                                                    Payment failed
                                                </span>
                                            )}
                                            {String(item.order?.payment_method).toLowerCase() === 'cod' && (
                                                <span className="mt-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-sm w-fit uppercase tracking-tighter">
                                                    Collect COD
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                                                ) : (
                                                    <Package className="text-slate-400" size={18} />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="font-medium text-slate-900 leading-tight">{item.product_name || 'Product'}</p>
                                                {item.shiprocket_order_id && (
                                                    <p className="text-[9px] text-indigo-600 font-bold mt-0.5">SR-ORD: {item.shiprocket_order_id}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-slate-900">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        {item.fulfillment_status === 'dispatched' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 size={10} /> Dispatched
                                            </span>
                                        ) : isCancelled ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                <X size={10} /> Cancelled
                                            </span>
                                        ) : paymentFailed ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
                                                <Clock size={10} /> Payment failed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                <Clock size={10} /> Pending ship
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {paymentFailed ? (
                                                <span className="text-[10px] font-semibold text-rose-700 text-right max-w-[11rem]">
                                                    Customer did not complete online payment. Do not ship.
                                                </span>
                                            ) : isCancelled ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                                                    >
                                                        Details
                                                    </button>
                                                    <span className="text-[10px] font-semibold text-slate-500">
                                                        Cancelled (shipping disabled)
                                                    </span>
                                                </div>
                                            ) : item.fulfillment_status !== 'dispatched' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleShiprocketAuto(item.id)}
                                                        disabled={shipLoadingId === item.id}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                                                    >
                                                        {shipLoadingId === item.id ? (
                                                            <Loader2 className="animate-spin" size={14} />
                                                        ) : (
                                                            <ArrowRight size={14} />
                                                        )}
                                                        {shipLoadingId === item.id ? 'Shiprocket…' : 'Ship with Shiprocket'}
                                                    </button>

                                                    {item.can_cancel_shiprocket && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelShiprocket(item.id)}
                                                            disabled={actionLoading.id === item.id && actionLoading.type === 'cancel_shiprocket'}
                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 border border-rose-200 disabled:opacity-60"
                                                        >
                                                            {actionLoading.id === item.id && actionLoading.type === 'cancel_shiprocket' ? (
                                                                <Loader2 className="animate-spin" size={14} />
                                                            ) : (
                                                                <X size={14} />
                                                            )}
                                                            Cancel
                                                        </button>
                                                    )}

                                                    {item.can_cancel_order_item && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelOrderItem(item.id)}
                                                            disabled={actionLoading.id === item.id && actionLoading.type === 'cancel_item'}
                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 border border-rose-200 disabled:opacity-60"
                                                        >
                                                            {actionLoading.id === item.id && actionLoading.type === 'cancel_item' ? (
                                                                <Loader2 className="animate-spin" size={14} />
                                                            ) : (
                                                                <X size={14} />
                                                            )}
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex gap-1 mt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedItem(item)}
                                                            className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase px-2 py-1 bg-white border border-slate-200 rounded shadow-sm"
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTrack(item.tracking_number)}
                                                            disabled={actionLoading.id === item.tracking_number && actionLoading.type === 'track'}
                                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase px-2 py-1 bg-white border border-indigo-100 rounded shadow-sm disabled:opacity-50"
                                                        >
                                                            {actionLoading.id === item.tracking_number && actionLoading.type === 'track' ? '...' : 'Track'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadLabel(item.id, item.shiprocket_shipment_id)}
                                                            disabled={actionLoading.id === item.id && actionLoading.type === 'label'}
                                                            className="text-[10px] font-bold text-slate-600 hover:text-slate-800 uppercase px-2 py-1 bg-white border border-slate-200 rounded shadow-sm disabled:opacity-50"
                                                        >
                                                            {actionLoading.id === item.id && actionLoading.type === 'label' ? '...' : 'Label'}
                                                        </button>
                                                        {item.can_cancel_shiprocket && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCancelShiprocket(item.id)}
                                                                disabled={actionLoading.id === item.id && actionLoading.type === 'cancel_shiprocket'}
                                                                className="text-[10px] font-bold text-rose-700 hover:text-rose-800 uppercase px-2 py-1 bg-rose-50 border border-rose-200 rounded shadow-sm disabled:opacity-50"
                                                            >
                                                                {actionLoading.id === item.id && actionLoading.type === 'cancel_shiprocket' ? '...' : 'Cancel'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                                onClick={() => setSelectedItem(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                                className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Order</p>
                                        <h2 className="text-lg font-bold text-slate-900 truncate">
                                            ORD-{String(selectedItem.order_id || '').padStart(5, '0')} · {selectedItem.product_name || 'Product'}
                                        </h2>
                                        {selectedItem.order?.school?.name && (
                                            <p className="text-xs text-slate-500 mt-0.5">School: {selectedItem.order.school.name}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Original images</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => downloadMany(selectedItem.original_images, `original-${selectedItem.product_id || 'product'}`)}
                                                    disabled={!(selectedItem.original_images || []).length}
                                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    Download all
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(selectedItem.original_images || []).length ? (selectedItem.original_images || []).slice(0, 6).map((src, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => downloadUrl(src, `original-${selectedItem.product_id || 'product'}-${idx + 1}`)}
                                                        className="group relative"
                                                        title="Click to download"
                                                    >
                                                        <img src={src} className="w-full h-20 object-contain bg-white border border-slate-200 rounded" alt="" />
                                                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/30 rounded" />
                                                        <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                                                            Download
                                                        </span>
                                                    </button>
                                                )) : (
                                                    <p className="text-xs text-slate-400">No images</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Rendered images</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => downloadMany(selectedItem.rendered_images, `rendered-${selectedItem.order_id || 'order'}-${selectedItem.product_id || 'product'}`)}
                                                    disabled={!(selectedItem.rendered_images || []).length}
                                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    Download all
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(selectedItem.rendered_images || []).length ? (selectedItem.rendered_images || []).slice(0, 6).map((src, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => downloadUrl(src, `rendered-${selectedItem.order_id || 'order'}-${idx + 1}`)}
                                                        className="group relative"
                                                        title="Click to download"
                                                    >
                                                        <img src={src} className="w-full h-20 object-contain bg-white border border-slate-200 rounded" alt="" />
                                                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/30 rounded" />
                                                        <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                                                            Download
                                                        </span>
                                                    </button>
                                                )) : (
                                                    <p className="text-xs text-slate-400">No rendered images</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">School uploaded image</p>
                                            {selectedItem.school_uploaded_image ? (
                                                <div className="space-y-2">
                                                    <img src={selectedItem.school_uploaded_image} className="w-full h-44 object-contain bg-white border border-slate-200 rounded" alt="" />
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadUrl(selectedItem.school_uploaded_image, `school-upload-${selectedItem.order_id || 'order'}-${selectedItem.product_id || 'product'}`)}
                                                        className="w-full text-[10px] font-black uppercase tracking-widest px-2 py-2 rounded border border-slate-200 bg-white hover:bg-slate-50"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-slate-400">Not provided</p>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="w-full text-[10px] font-black uppercase tracking-widest px-2 py-2 rounded border border-slate-200 bg-white opacity-50 cursor-not-allowed"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedItem.order?.shipping_address && (
                                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shipping address</p>
                                            <p className="text-sm font-semibold text-slate-900">{selectedItem.order.shipping_address.name}</p>
                                            <p className="text-sm text-slate-600">{selectedItem.order.shipping_address.address}, {selectedItem.order.shipping_address.city} - {selectedItem.order.shipping_address.pincode}</p>
                                            <p className="text-sm text-slate-600">{selectedItem.order.shipping_address.phone}</p>
                                        </div>
                                    )}
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
