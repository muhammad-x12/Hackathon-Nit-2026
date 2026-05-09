import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    CheckCircle2, ArrowRight, FileText, Share2, Truck,
    ShieldCheck, Calendar, LayoutGrid, Zap, Package, MapPin, 
    CreditCard, Loader2, Info, ChevronRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../utils/constants';

const OrderSuccess = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

    const fetchTracking = async () => {
        setTrackingLoading(true);
        try {
            const response = await api.get(`/order/${id}/track`);
            setTrackingInfo(response.data);
        } catch (err) {
            console.error('Failed to fetch tracking', err);
        } finally {
            setTrackingLoading(false);
        }
    };

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            try {
                // If there's a payment order_id in URL (from Cashfree redirect), verify it first
                const urlParams = new URLSearchParams(window.location.search);
                const cfOrderId = urlParams.get('order_id');
                if (cfOrderId) {
                    console.log('Verifying Cashfree payment...', cfOrderId);
                    await api.post('/order/verify', { order_id: id, cf_order_id: cfOrderId });
                }

                const response = await api.get(`/order/${id}`);
                const orderData = response.data.data ?? response.data;
                setOrder(orderData);
                
                // If order is dispatched, try fetching real-time tracking
                const isDispatched = orderData.items?.some(item => item.fulfillment_status === 'dispatched' || item.tracking_number);
                if (isDispatched) {
                    fetchTracking();
                }
            } catch (err) {
                console.error('Failed to fetch/verify order', err);
                setError(err.response?.data?.message || 'Unable to retrieve order details.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Synchronizing order details...</p>
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                <Info className="text-rose-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Order Not Located</h1>
            <p className="text-slate-500 mb-8 max-w-sm">{error || "The reference ID provided does not match any active record."}</p>
            <Link to="/profile" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Go to My Orders
            </Link>
        </div>
    );

    const getStatusLabel = (status) => {
        const config = {
            paid: { label: 'Payment Verified', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            shipped: { label: 'In Transit', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            delivered: { label: 'Handed Over', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
            pending: { label: 'Processing', color: 'text-amber-600 bg-amber-50 border-amber-100' },
        };
        return config[status?.toLowerCase()] || { label: status, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    };

    const statusInfo = getStatusLabel(order.payment_status === 'paid' ? 'paid' : order.order_status);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
            <Navbar schoolName={APP_NAME} />

            <div className="flex-1 max-w-4xl mx-auto px-6 w-full pt-32 md:pt-40 lg:pt-48 pb-16">
                
                {/* Header Confirmation Part */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-full mb-6"
                    >
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight"
                    >
                        Order Confirmed!
                    </motion.h1>
                    <p className="text-slate-500 mt-2 font-medium">Receipt #ORD_{String(order.id).padStart(5, '0')} has been processed.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Main Info */}
                    <motion.div 
                        variants={containerVariants} initial="hidden" animate="show"
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Status Guard */}
                        <motion.div variants={itemVariants} className={`flex items-center justify-between p-5 rounded-2xl border ${statusInfo.color} shadow-sm`}>
                            <div className="flex items-center gap-3">
                                <Zap size={20} />
                                <span className="text-sm font-black uppercase tracking-widest">{statusInfo.label}</span>
                            </div>
                            <span className="text-xs font-bold opacity-70 italic whitespace-nowrap">Updated {new Date(order.created_at).toLocaleDateString()}</span>
                        </motion.div>

                        {/* Real-time Tracking Info */}
                        <AnimatePresence>
                            {trackingInfo && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 overflow-hidden relative group"
                                >
                                    {/* Background Decor */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />

                                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 text-indigo-100 mb-2">
                                                <div className="p-1 px-2 border border-indigo-400/50 rounded-lg text-[10px] font-black uppercase tracking-widest">Live Status</div>
                                                <Truck size={14} />
                                                <span className="text-xs font-bold uppercase tracking-tight">{trackingInfo.courier}</span>
                                            </div>
                                            <h2 className="text-2xl font-black tracking-tight mb-1">
                                                {trackingInfo.tracking?.tracking_data?.track_status || trackingInfo.status || 'Dispatched'}
                                            </h2>
                                            <p className="text-sm text-indigo-100/80 font-medium">AWB: {trackingInfo.awb}</p>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <div className="text-[10px] font-black uppercase text-indigo-200 mb-1 opacity-60">Est. Delivery</div>
                                            <div className="text-xl font-black bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                                                {trackingInfo.tracking?.tracking_data?.edd || 'Calculating...'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking History Snippet (Last Event) */}
                                    {trackingInfo.tracking?.tracking_data?.shipment_track_activities?.[0] && (
                                        <div className="mt-6 pt-4 border-t border-indigo-400/30 flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white leading-tight">
                                                    {trackingInfo.tracking.tracking_data.shipment_track_activities[0].activity}
                                                </p>
                                                <p className="text-[10px] text-indigo-200 mt-0.5 opacity-80">
                                                    {trackingInfo.tracking.tracking_data.shipment_track_activities[0].location} • {new Date(trackingInfo.tracking.tracking_data.shipment_track_activities[0].date).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {trackingLoading && (
                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl border-dashed justify-center text-slate-400 h-[100px]">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Updating shipment status...</span>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Order Items */}
                        <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Inventory Items</h3>
                                <Package size={16} className="text-slate-300" />
                            </div>
                            <div className="divide-y divide-slate-100">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="p-6 flex gap-5">
                                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden">
                                            {item.product_image ? (
                                                <img src={item.product_image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Package className="text-slate-300" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 leading-tight">{item.product_name}</h4>
                                            
                                            {/* VARIANTS */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.customization?.size && (
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">Size: {item.customization.size}</span>
                                                )}
                                                {item.customization?.color && (
                                                    <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase">Color: {item.customization.color}</span>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-2 py-0.5 rounded uppercase">Qty: {item.quantity}</span>
                                            </div>

                                            {/* TRACKING */}
                                            {(item.tracking_url || item.fulfillment_status === 'dispatched') && (
                                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                            <Truck size={14} className="text-indigo-500" />
                                                            {item.courier_name || 'In Transit'}
                                                        </div>
                                                        {item.tracking_url && (
                                                            <a 
                                                                href={item.tracking_url} target="_blank" rel="noreferrer"
                                                                className="text-[10px] font-black text-indigo-600 flex items-center gap-1 uppercase hover:underline"
                                                            >
                                                                Track <ExternalLink size={10} />
                                                            </a>
                                                        )}
                                                    </div>
                                                    {item.tracking_number && (
                                                        <p className="text-[10px] text-slate-400 font-mono mt-1">AWB: {item.tracking_number}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/products" className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all text-center">
                                Back to Catalog
                            </Link>
                            <Link to="/profile" className="flex-1 px-8 py-4 bg-indigo-600 rounded-2xl text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all text-center shadow-lg shadow-indigo-100">
                                Manage Orders <ChevronRight size={14} className="inline ml-1" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* RIGHT COLUMN: Sidebar Summary */}
                    <div className="space-y-6">
                        {/* Shipping Target */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2">
                                <MapPin size={12} /> Delivery Point
                            </h3>
                            {order.shipping_address ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-slate-900">{order.shipping_address.name}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {order.shipping_address.address}<br />
                                        {order.shipping_address.city}, {order.shipping_address.pincode}
                                    </p>
                                    <p className="text-xs font-bold text-indigo-600 mt-2">📞 {order.shipping_address.phone}</p>
                                </div>
                            ) : <p className="text-xs italic text-slate-400">Institutional direct delivery.</p>}
                        </div>

                        {/* Financial Settlement */}
                        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                            
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2 opacity-60">
                                <CreditCard size={12} /> Financial Token
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Method</span>
                                    <span className="text-white uppercase tracking-wider">{order.payment_method?.toUpperCase() || 'ONLINE'}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Provider</span>
                                    <span className="text-white uppercase tracking-wider">{order.payment_provider || 'PAYMENT GATEWAY'}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Transaction</span>
                                    <span className="text-white font-mono">{order.transaction_id || 'VERIFIED'}</span>
                                </div>
                                <div className="pt-4 border-t border-white/10 mt-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Total Settlement</span>
                                        <span className="text-2xl font-black">₹{Number(order.total_amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Support */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl border-dashed">
                             <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <Zap size={12} className="text-indigo-500" /> Need Assistance?
                             </h4>
                             <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                 Contact your school administration or our logistics partner for high-priority resolution.
                             </p>
                        </div>
                    </div>

                </div>

                <div className="mt-16 flex justify-center text-slate-300">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Zap size={14} className="text-indigo-400" />
                        Supply chain operational
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OrderSuccess;
