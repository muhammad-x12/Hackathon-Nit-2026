import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { APP_NAME } from '../utils/constants';
import { getSubdomain } from '../utils/subdomain';
import {
    CreditCard, Truck, MapPin, Phone, User, ShieldCheck, ArrowLeft,
    Loader2, Lock, Zap, Gift, Check, Tag, AlertCircle
} from 'lucide-react';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    // null means "not quoted yet" (show loader instead of Free)
    const [deliveryCharge, setDeliveryCharge] = useState(null);
    const [deliveryEta, setDeliveryEta] = useState(null);
    /** Server-computed totals (matches Cashfree / Razorpay charge). */
    const [serverTotals, setServerTotals] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const savedAddr = user?.default_shipping_address || {};
    const [formData, setFormData] = useState({
        name: savedAddr.name || user?.name || '',
        phone: savedAddr.phone || '',
        address: savedAddr.address || '',
        city: savedAddr.city || '',
        pincode: savedAddr.pincode || '',
    });

    // ── Referral Code State ───────────────────────────────
    const [referralCode, setReferralCode] = useState('');
    const [referralData, setReferralData] = useState(null);
    const [validating, setValidating] = useState(false);
    const [referralMsg, setReferralMsg] = useState({ type: '', text: '' });

    const [platformSettings, setPlatformSettings] = useState({
        gst_percentage: '18',
        delivery_charges: '0',
        cod_enabled: '1',
        cod_min_order: '0',
        cod_max_order: '100000'
    });

    const [paymentMethod, setPaymentMethod] = useState('online');

    const validateReferral = async () => {
        if (!referralCode) return;
        setValidating(true);
        setReferralMsg({ type: '', text: '' });
        try {
            const res = await api.post('/auth/validate-referral', { code: referralCode });
            setReferralData(res.data);
            setReferralMsg({ type: 'success', text: res.data.message });
        } catch (err) {
            setReferralData(null);
            setReferralMsg({ type: 'error', text: err.response?.data?.message || 'Invalid code.' });
        } finally {
            setValidating(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data) {
                    setPlatformSettings(prev => ({ ...prev, ...res.data }));
                }
            } catch (e) {
                console.error('Failed to fetch platform settings', e);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/cart');
        }
    }, [cart, navigate]);

    useEffect(() => {
        const a = user?.default_shipping_address;
        if (!a || typeof a !== 'object') {
            return;
        }
        if (!String(a.pincode || '').trim() && !String(a.address || '').trim()) {
            return;
        }
        setFormData((prev) => ({
            name: prev.name || a.name || user?.name || '',
            phone: prev.phone || a.phone || '',
            address: prev.address || a.address || '',
            city: prev.city || a.city || '',
            pincode:
                prev.pincode ||
                (a.pincode != null ? String(a.pincode).replace(/\D/g, '').slice(0, 6) : ''),
        }));
    }, [user?.default_shipping_address, user?.name]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'pincode' && value.length === 6) {
            calculateShipping(value);
        } else if (name === 'pincode') {
            // Reset quote while user edits pincode
            setDeliveryCharge(null);
            setDeliveryEta(null);
        }
    };

    const calculateShipping = async (pincode) => {
        setCalculatingShipping(true);
        try {
            const items = cart.map((item) => {
                return {
                    product_id: item.id,
                    quantity: item.quantity,
                    weight: item.weight ? (Math.round(parseFloat(item.weight) * item.quantity * 1000) / 1000) : null,
                    length: item.length || null,
                    width: item.width || null,
                    height: item.height || null,
                };
            });
            const res = await api.post('/order/calculate-shipping', {
                items,
                pincode,
                payment_method: paymentMethod,
            });
            setDeliveryCharge(res.data.shipping_charge);
            const by = res.data.expected_delivery_by || null;
            const days = res.data.expected_delivery_days != null ? Number(res.data.expected_delivery_days) : null;
            if (by || (days != null && !Number.isNaN(days) && days > 0)) {
                setDeliveryEta({ by, days: days != null && !Number.isNaN(days) ? days : null });
            } else {
                setDeliveryEta(null);
            }
        } catch (err) {
            console.error('Shipping calculation failed', err);
            setDeliveryCharge(null);
            setDeliveryEta(null);
        } finally {
            setCalculatingShipping(false);
        }
    };

    useEffect(() => {
        if (formData.pincode?.length === 6) {
            calculateShipping(formData.pincode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethod]);

    const buildOrderItemsPayload = () =>
        cart.map((item) => {
            return {
                product_id: item.id,
                quantity: item.quantity,
                weight: item.weight ? (Math.round(parseFloat(item.weight) * item.quantity * 1000) / 1000) : null,
                length: item.length || null,
                width: item.width || null,
                height: item.height || null,
                options: item.options || {},
            };
        });

    useEffect(() => {
        const run = async () => {
            if (!cart.length) {
                setServerTotals(null);
                return;
            }
            const { name, phone, address, city, pincode } = formData;
            if (
                !String(name || '').trim() ||
                !String(phone || '').trim() ||
                !String(address || '').trim() ||
                !String(city || '').trim() ||
                String(pincode || '').replace(/\D/g, '').length !== 6
            ) {
                setServerTotals(null);
                return;
            }
            setPreviewLoading(true);
            try {
                const subdomain = getSubdomain();
                const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};
                const body = {
                    items: buildOrderItemsPayload(),
                    shipping_address: {
                        ...formData,
                        pincode: String(formData.pincode).replace(/\D/g, '').slice(0, 6),
                    },
                    payment_method: paymentMethod,
                };
                if (referralData?.valid && referralCode) {
                    body.referral_code = referralCode;
                }
                const res = await api.post('/order/preview', body, config);
                setServerTotals(res.data);
            } catch {
                setServerTotals(null);
            } finally {
                setPreviewLoading(false);
            }
        };
        const t = setTimeout(run, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        cart,
        formData.name,
        formData.phone,
        formData.address,
        formData.city,
        formData.pincode,
        paymentMethod,
        referralData?.valid,
        referralCode,
    ]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // Secondary Validation Guard: Ensure all items have sizes/colors if required
        const invalidItems = cart.filter(item => {
            const hasSizeRequired = !!item.size && item.size.includes(',');
            const hasColorRequired = !!item.color && item.color.includes(',');
            
            const sizeOk = !hasSizeRequired || item.options?.size;
            const colorOk = !hasColorRequired || item.options?.color;
            
            return !sizeOk || !colorOk;
        });

        if (invalidItems.length > 0) {
            const itemNames = invalidItems.map(i => i.name).join(', ');
            alert(`Some items in your cart require options (size/color) to be selected: ${itemNames}. Please go back and select options before checking out.`);
            navigate('/cart');
            return;
        }

        setLoading(true);

        try {
            const orderPayload = {
                items: buildOrderItemsPayload(),
                shipping_address: formData,
                referral_code: referralData?.valid ? referralCode : null,
                payment_method: paymentMethod
            };

            const subdomain = getSubdomain();
            const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};

            const response = await api.post('/order/create', orderPayload, config);
            const data = response.data;
            const orderModel = data.order?.data || data.order;
            const payment = data.payment;
            const orderId = orderModel?.id || orderModel;
            if (!orderId) {
                throw new Error("Initial order creation failed - record ID not derived from response.");
            }

            updateUser({
                default_shipping_address: {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode,
                },
            });

            let paymentHandled = false;
            if (payment && payment.provider === 'cashfree') {
                const cashfree = window.Cashfree({
                    mode: payment.environment === 'PROD' ? 'production' : 'sandbox'
                });
                
                await cashfree.checkout({
                    paymentSessionId: payment.payment_session_id,
                    returnUrl: window.location.origin + `/order-success/${orderId}?order_id={order_id}`
                });
            } else if (payment && payment.provider === 'razorpay') {
                const options = {
                    key: payment.key_id || '',
                    amount: payment.amount || 0,
                    currency: payment.currency || 'INR',
                    name: payment.name || 'Order Payment',
                    description: payment.description || 'Institutional Purchase',
                    order_id: payment.order_id || '',
                    handler: async function (response) {
                        paymentHandled = true;
                        try {
                            setLoading(true);
                            
                            console.log('Payment success callback received. Verifying...', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id
                            });

                            const verifyRes = await api.post(`/order/verify`, {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: orderId
                            });

                            clearCart();
                            
                            // Get the most reliable ID - prioritizing verified ID
                            let successId = verifyRes.data?.order_id || orderId;
                            
                            // Final safety check: if successId is an object, try to find id
                            if (typeof successId === 'object' && successId !== null) {
                                successId = successId.id || JSON.stringify(successId);
                            }

                            console.log('Payment verification successful. Redirecting to success page with ID:', successId);
                            
                            // Force absolute path redirect to avoid routing issues
                            window.location.href = `/order-success/${successId}`;
                        } catch (err) {
                            console.error('CRITICAL: Payment verification failed!', {
                                error: err,
                                response: err.response?.data,
                                status: err.response?.status,
                                orderId: orderId
                            });
                            window.location.href = `/order-failed/${orderId}`;
                        } finally {
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: payment.prefill?.name || '',
                        email: payment.prefill?.email || '',
                        contact: payment.prefill?.contact || '',
                    },
                    theme: {
                        color: "#4f46e5"
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                            if (paymentHandled) {
                                console.log('Razorpay modal dismissed, but payment already handled.');
                                return;
                            }
                            console.log('Razorpay modal dismissed/closed by user.');
                            api.post('/order/abandon-payment', { order_id: orderId }).catch(() => {});
                        }
                    }
                };

                console.log('Opening Razorpay with options:', {
                    ...options,
                    key: '***' + options.key.slice(-4), // Redact key for logs
                    handler: '[function]',
                    'modal.ondismiss': '[function]'
                });

                try {
                    if (typeof window.Razorpay === 'undefined') {
                        throw new Error('Razorpay library not loaded. Please check your internet connection or disable ad-blockers.');
                    }
                    const rzp1 = new window.Razorpay(options);
                    rzp1.open();
                } catch (razorError) {
                    console.error('Razorpay initialization error:', razorError);
                    alert(razorError.message || 'Failed to initialize payment gateway.');
                    setLoading(false);
                }
            } else {
                // Fallback if no payment gateway (e.g. COD or 0 amount order)
                clearCart();
                window.location.href = `/order-success/${orderId}`;
            }

        } catch (error) {
            console.error('CRITICAL: Checkout submission failed!', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unexpected system error during checkout initialization.';
            
            // If it's a validation error, we might want to show specific fields
            if (error.response?.status === 422 && error.response.data.errors) {
                const firstErr = Object.values(error.response.data.errors)[0][0];
                alert(`Checkout failed: ${firstErr}`);
            } else {
                alert(`System Error: ${errorMsg}`);
            }
            
            setLoading(false);
        }
    };

    const subtotal = getCartTotal();
    const delivery = Number(deliveryCharge || 0);

    // Calculate referral discount (fallback when server preview not loaded yet)
    let referralDiscount = 0;
    if (referralData?.valid) {
        if (referralData.discount_type === 'percentage') {
            referralDiscount = Math.min(subtotal * (parseFloat(referralData.discount_value) / 100), parseFloat(referralData.discount_max));
        } else {
            referralDiscount = Math.min(parseFloat(referralData.discount_value), parseFloat(referralData.discount_max));
        }
    }

    const discountedSubtotal = Math.max(0, subtotal - referralDiscount);
    const gstRate = parseFloat(platformSettings.gst_percentage || 18);
    const tax = Math.round(discountedSubtotal - (discountedSubtotal / (1 + (gstRate / 100))));
    const clientEstimatedTotal = discountedSubtotal + delivery;

    const displayTotal =
        serverTotals && typeof serverTotals.total_amount === 'number'
            ? serverTotals.total_amount
            : clientEstimatedTotal;
    const displayGross =
        serverTotals && typeof serverTotals.gross_total === 'number'
            ? serverTotals.gross_total
            : null;
    const displayReferralOff =
        serverTotals && typeof serverTotals.discount_amount === 'number'
            ? serverTotals.discount_amount
            : referralDiscount;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar schoolName={APP_NAME} />

            <div className="max-w-7xl mx-auto px-6 pt-32 relative z-10">
                {/* Checkout Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-slate-200 pb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/cart" className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                            <ArrowLeft size={16} />
                        </Link>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Secure <span className="text-indigo-600">Checkout.</span></h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
                        <Lock size={14} /> SSL Secured
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                    {/* Main Checkout Form */}
                    <div className="xl:col-span-8">
                        <form onSubmit={handlePlaceOrder} className="space-y-8">

                            {/* Shipping Information section */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Shipping Details</h2>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Contact Name</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User size={18} className="text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                                                </div>
                                                <input
                                                    required
                                                    name="name"
                                                    type="text"
                                                    placeholder="Full Name"
                                                    className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone size={18} className="text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                                                </div>
                                                <input
                                                    required
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="10-digit mobile number"
                                                    className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Delivery Address</label>
                                        <textarea
                                            required
                                            name="address"
                                            placeholder="Street, Sector, Building Name..."
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold min-h-[100px] resize-y text-slate-900 placeholder:text-slate-400 shadow-inner"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                                            <input
                                                required
                                                name="city"
                                                type="text"
                                                placeholder="City District"
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                                            <input
                                                required
                                                name="pincode"
                                                type="text"
                                                placeholder="6-digit ZIP"
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method section */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <CreditCard size={20} />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Payment Method</h2>
                                </div>
                                <div className="p-8 space-y-4">
                                    {/* Online Payment Option */}
                                    <label className={`flex items-start p-6 border rounded-2xl cursor-pointer transition-all duration-200 ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={paymentMethod === 'online'}
                                            onChange={() => setPaymentMethod('online')}
                                            className="w-5 h-5 mt-0.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <div className="ml-5 flex flex-col w-full">
                                            <span className="font-bold text-slate-900 flex items-center justify-between w-full uppercase tracking-widest text-sm">
                                                Online Payment
                                                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 ml-2">Fastest</span>
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500 mt-1">UPI, Credit/Debit cards, Net-banking, Wallets via {platformSettings.active_payment_gateway === 'cashfree' ? 'Cashfree' : 'Razorpay'}.</span>
                                        </div>
                                    </label>

                                    {/* COD Option (Conditional) */}
                                    {platformSettings.cod_enabled === '1' && (
                                        <label className={`flex items-start p-6 border rounded-2xl cursor-pointer transition-all duration-200 ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'} ${displayTotal < parseFloat(platformSettings.cod_min_order) || displayTotal > parseFloat(platformSettings.cod_max_order) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                disabled={displayTotal < parseFloat(platformSettings.cod_min_order) || displayTotal > parseFloat(platformSettings.cod_max_order)}
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="w-5 h-5 mt-0.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                            />
                                            <div className="ml-5 flex flex-col w-full">
                                                <span className="font-bold text-slate-900 uppercase tracking-widest text-sm flex items-center gap-2">
                                                    Cash On Delivery (COD)
                                                    <Truck size={14} className="text-slate-400" />
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500 mt-1">
                                                    {displayTotal < parseFloat(platformSettings.cod_min_order) ? `Not available for orders below ₹${platformSettings.cod_min_order}` :
                                                     displayTotal > parseFloat(platformSettings.cod_max_order) ? `Not available for orders above ₹${platformSettings.cod_max_order}` :
                                                     'Pay cash when you receive your order.'}
                                                </span>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-indigo-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none disabled:opacity-50 flex justify-center items-center gap-3 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" /> Processing Order...
                                    </>
                                ) : (
                                    <>
                                        Place Order & Pay <Zap size={18} className="fill-white" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="xl:col-span-4 lg:col-span-5 md:col-span-6 lg:sticky lg:top-28 h-fit">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order Summary</h3>
                            </div>

                            {/* Summary Items List */}
                            <div className="p-6 border-b border-slate-100 max-h-[40vh] overflow-y-auto">
                                <div className="space-y-5">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center gap-4 group">
                                            <div className="flex gap-4 items-center flex-1 min-w-0">
                                                <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0 flex items-center justify-center p-2">
                                                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1546733230-6847d7d8c2ec'} alt="item" className="w-full h-full object-contain mix-blend-multiply" />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{item.name}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Qty: {item.quantity}</span>
                                                        {item.sku && (
                                                            <>
                                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SKU: {item.sku}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-900 whitespace-nowrap">
                                                ₹{((item.price || item.pricing?.final_price || item.base_price || 0) * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Referral Code Field */}
                            <div className="p-6 border-b border-slate-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Have a Referral Code?</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="CODE"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                            disabled={referralData?.valid}
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                    </div>
                                    {referralData?.valid ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReferralData(null);
                                                setReferralCode('');
                                                setReferralMsg({ type: '', text: '' });
                                            }}
                                            className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={validateReferral}
                                            disabled={validating || !referralCode}
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-sm"
                                        >
                                            {validating ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                                        </button>
                                    )}
                                </div>
                                {referralMsg.text && (
                                    <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${referralMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {referralMsg.type === 'success' ? <Check size={10} /> : <AlertCircle size={10} />}
                                        {referralMsg.text}
                                    </p>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="p-6 space-y-4 bg-slate-50">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-600">
                                    <span>Subtotal</span>
                                    {previewLoading ? (
                                        <div className="w-20 h-3 rounded-full bg-slate-200 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                                        </div>
                                    ) : (
                                        <span className="text-slate-900 font-black">
                                            ₹{Math.round(subtotal).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {referralData?.valid && (
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                        <span className="flex items-center gap-1.5"><Gift size={12} /> Referral Discount</span>
                                        <span>- ₹{displayReferralOff.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-600">
                                    <span>Shipping (detail)</span>
                                    {calculatingShipping || (formData.pincode?.length !== 6) || deliveryCharge === null ? (
                                        <div className="w-16 h-3 rounded-full bg-slate-200 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                                        </div>
                                    ) : (
                                        <span className="text-slate-900 font-black">
                                            ₹{delivery.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-start gap-3 text-xs font-bold uppercase tracking-widest text-slate-600">
                                    <span className="text-slate-500 normal-case font-semibold tracking-normal">Est. delivery</span>
                                    {calculatingShipping || (formData.pincode?.length !== 6) || deliveryCharge === null ? (
                                        <div className="w-28 h-3 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
                                            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                                        </div>
                                    ) : deliveryEta?.by ? (
                                        <span className="text-slate-900 font-black normal-case tracking-tight text-right max-w-[14rem]">
                                            {new Date(`${deliveryEta.by}T12:00:00`).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    ) : deliveryEta?.days ? (
                                        <span className="text-slate-900 font-black normal-case tracking-tight">
                                            ~{deliveryEta.days} day{deliveryEta.days === 1 ? '' : 's'}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-semibold normal-case tracking-normal text-right">—</span>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black uppercase text-slate-900 tracking-tighter">Net Total</span>
                                        <div className="text-right">
                                            {previewLoading && displayGross == null ? (
                                                <div className="w-28 h-8 rounded-lg bg-slate-200 overflow-hidden relative ml-auto">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-2xl font-black text-indigo-600 drop-shadow-sm">₹{displayTotal.toLocaleString()}</span>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                        Inclusive of all taxes
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <ShieldCheck size={18} className="text-slate-400 flex-shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-center">
                                Payments are 100% secure & encrypted
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Checkout;
