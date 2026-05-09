import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { APP_NAME } from '../utils/constants';
import { motion } from 'framer-motion';
import {
    User, Mail, Lock, Save, LogOut, ShoppingBag, Package,
    CheckCircle2, AlertCircle, Loader2, ChevronRight, Shield,
    Calendar, Clock, ArrowRight, Truck, ReceiptText, Gift, Copy, Share2
} from 'lucide-react';

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-widest';

const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    shipped: { label: 'Shipped', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ── Profile form ──────────────────────────────────────────
    const addr = user?.default_shipping_address || {};
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        shipping_name: addr.name || user?.name || '',
        shipping_phone: addr.phone || '',
        shipping_address: addr.address || '',
        shipping_city: addr.city || '',
        shipping_pincode: addr.pincode || '',
    });
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // ── Orders ────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // ── Referral Stats ────────────────────────────────────────
    const [referral, setReferral] = useState(null);
    const [referralLoading, setReferralLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/my-orders');
                setOrders(res.data.data || res.data || []);
            } catch {
                setOrders([]);
            } finally {
                setOrdersLoading(false);
            }
        };

        const fetchReferralStats = async () => {
            try {
                const res = await api.get('/auth/my-referrals');
                setReferral(res.data);
            } catch (err) {
                console.error("Failed to fetch referral stats", err);
            } finally {
                setReferralLoading(false);
            }
        };

        fetchOrders();
        fetchReferralStats();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);
        try {
            const payload = { name: form.name, email: form.email };
            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }
            payload.default_shipping_address = {
                name: form.shipping_name,
                phone: form.shipping_phone,
                address: form.shipping_address,
                city: form.shipping_city,
                pincode: form.shipping_pincode,
            };
            await api.post('/auth/profile', payload);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setForm(f => ({ ...f, password: '', password_confirmation: '' }));
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const roleLabel = (Array.isArray(user?.role) ? user.role[0] : user?.role || 'customer').replace('_', ' ');
    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

    if (ordersLoading || referralLoading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="flex flex-col items-center max-w-sm">
                <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-2 border-indigo-50 rounded-full scale-125" />
                    <div className="absolute inset-0 border-4 border-indigo-100/50 rounded-full" />
                    <Loader2 className="absolute inset-0 text-indigo-600 animate-spin" size={96} strokeWidth={1} />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <span className="text-lg font-black text-[#002B5B] uppercase tracking-[0.6em] font-mono translate-x-1">Loading</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Synchronizing Your Account Data</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar schoolName={APP_NAME} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">

                {/* ── Hero Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl"
                >
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />
                    </div>

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-2xl font-black text-white backdrop-blur-sm flex-shrink-0 shadow-lg">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-white truncate">{user?.name}</h1>
                            <p className="text-indigo-200 text-sm font-medium mt-0.5 truncate">{user?.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-bold text-white capitalize">
                                    <Shield size={11} /> {roleLabel}
                                </span>
                                {memberSince && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-indigo-200">
                                        <Calendar size={11} /> Member since {memberSince}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition-colors flex-shrink-0"
                        >
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── LEFT: Edit Profile ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1 space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <User size={16} className="text-indigo-500" /> Edit Profile
                                </h2>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                {saveError && (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                        <AlertCircle size={14} /> {saveError}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className={labelCls}>Full Name</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required type="text" value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className={`${inputCls} pl-10`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={labelCls}>Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required type="email" value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className={`${inputCls} pl-10`}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <p className={`${labelCls} mb-3`}>Change Password <span className="text-slate-400 font-normal normal-case">(leave blank to keep)</span></p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password" placeholder="New password" value={form.password}
                                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                className={`${inputCls} pl-10`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password" placeholder="Confirm new password" value={form.password_confirmation}
                                                onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                                className={`${inputCls} pl-10`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                    {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Referral Section */}
                        {referral && referral.referral_enabled === '1' && (
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden p-6 relative">
                                <div className="absolute top-[-20px] right-[-20px] opacity-10">
                                    <Gift size={100} className="text-indigo-600" />
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                    <Gift size={16} className="text-indigo-600" /> Refer & Earn
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-200/50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Your Referral Code</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-lg font-black text-indigo-600 tracking-wider">
                                                {referral.referral_code}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(referral.referral_code);
                                                    alert('Code copied to clipboard!');
                                                }}
                                                className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Referrals</p>
                                            <p className="text-xl font-black text-slate-900 leading-none">{referral.referral_count}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Benefit</p>
                                            <p className="text-xs font-bold text-indigo-600 leading-none">
                                                {referral.discount_type === 'percentage'
                                                    ? `${referral.discount_value}% OFF`
                                                    : `₹${referral.discount_value} OFF`}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const shareText = `Use my code ${referral.referral_code} to get a discount on My School Branding! ${window.location.origin}`;
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'Refer & Earn',
                                                    text: shareText,
                                                    url: window.location.origin,
                                                });
                                            } else {
                                                navigator.clipboard.writeText(shareText);
                                                alert('Invite message copied!');
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                    >
                                        <Share2 size={13} /> Invite Students
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick links */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-900">Quick Links</h2>
                            </div>
                            <div className="p-4 space-y-1">
                                {[
                                    { to: '/products', icon: <Package size={16} />, label: 'Browse Catalog' },
                                    { to: '/cart', icon: <ShoppingBag size={16} />, label: 'My Cart' },
                                    { to: '/logistics', icon: <Truck size={16} />, label: 'Logistics Info' },
                                ].map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors group"
                                    >
                                        <span className="flex items-center gap-3 text-slate-400 group-hover:text-indigo-500">
                                            {link.icon}
                                            <span className="text-slate-700 group-hover:text-indigo-600">{link.label}</span>
                                        </span>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── RIGHT: Orders ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <ReceiptText size={16} className="text-indigo-500" /> My Orders
                                </h2>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                    {orders.length} total
                                </span>
                            </div>

                            {orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                        <ShoppingBag size={28} className="text-slate-300" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1">No orders yet</h3>
                                    <p className="text-sm text-slate-500 mb-5">Start shopping to see your order history here.</p>
                                    <Link
                                        to="/products"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        Browse Catalog <ArrowRight size={15} />
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {orders.map(order => {
                                        const status = statusConfig[order.status] || statusConfig.pending;
                                        const orderDate = order.created_at
                                            ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : '';
                                        return (
                                            <div key={order.id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-sm font-bold text-slate-900">Order #{order.id}</span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                                                            {orderDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={11} /> {orderDate}
                                                                </span>
                                                            )}
                                                            {order.items?.length > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Package size={11} /> {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Item names & Tracking */}
                                                        {order.items?.length > 0 && (
                                                            <div className="mt-2 space-y-1.5">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                            {item.product?.name || item.name}
                                                                        </span>
                                                                        {item.tracking_url && (
                                                                            <a
                                                                                href={item.tracking_url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 transition-all hover:scale-105"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Truck size={10} /> Track Package
                                                                            </a>
                                                                        )}
                                                                        {item.fulfillment_status === 'dispatched' && !item.tracking_url && (
                                                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                                                                <CheckCircle2 size={10} /> Dispatched
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-base font-black text-slate-900">
                                                            ₹{Number(order.total_amount || order.total || 0).toLocaleString('en-IN')}
                                                        </p>
                                                        <Link
                                                            to={`/order-success/${order.id}`}
                                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide mt-1 flex items-center justify-end gap-0.5"
                                                        >
                                                            Details <ChevronRight size={11} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
