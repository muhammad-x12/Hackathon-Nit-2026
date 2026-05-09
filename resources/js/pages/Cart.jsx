import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getSubdomain } from '../utils/subdomain';
import { Trash2, Minus, Plus, ArrowRight, ArrowLeft, ShieldCheck, ShoppingBag, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../utils/constants';

const Cart = () => {
    const { cart = [], removeFromCart, updateQuantity, getCartTotal } = useCart();
    const navigate = useNavigate();

    // Defensive check to ensure cart is always an array
    const safeCart = Array.isArray(cart) ? cart : [];

    if (safeCart.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
                <Navbar schoolName={APP_NAME} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                        <ShoppingBag size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Cart is Empty</h2>
                    <p className="text-slate-500 mb-8 max-w-sm text-sm">
                        No items have been added to your order. Browse the catalog to begin procurement.
                    </p>
                    <Link to="/products" className="px-8 py-4 bg-slate-900 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-sm hover:bg-slate-800 transition-colors inline-flex items-center gap-3">
                        <LayoutGrid size={16} /> View Catalog
                    </Link>
                </div>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const delivery = 0;
    const total = subtotal + delivery;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar schoolName={APP_NAME} />

            <div className="max-w-7xl mx-auto px-6 pt-32 relative z-10 w-full">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate('/products')} className="text-slate-500 hover:text-indigo-600 transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                {safeCart.length} Item{safeCart.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Your <span className="text-indigo-600">Order.</span></h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">

                        {/* Header Row (Desktop) */}
                        <div className="hidden sm:grid grid-cols-12 gap-6 p-6 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <div className="col-span-6">Item Description</div>
                            <div className="col-span-3 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Total</div>
                            <div className="col-span-1 text-right"></div>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {safeCart.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={item.id}
                                        className="p-6 flex flex-col sm:grid sm:grid-cols-12 gap-6 items-center hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* Product Details */}
                                        <div className="col-span-6 flex items-center gap-6 w-full">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center p-3 hidden sm:flex shadow-sm">
                                                <img
                                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1546733230-6847d7d8c2ec?auto=format&fit=crop&w=400&q=80'}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                            <div className="flex-1 w-full text-center sm:text-left">
                                                <div className="flex items-center gap-2 mb-1.5 justify-center sm:justify-start">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                                                        {item.subcategory?.name || item.category?.name || item.category || 'Standard'}
                                                    </span>
                                                    {item.sku && (
                                                        <>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                                                SKU: {item.sku}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <Link to={`/products/${item.id}`} className="text-base sm:text-lg font-bold text-slate-900 leading-tight hover:text-indigo-600 transition-colors line-clamp-2">
                                                    {item.name}
                                                </Link>
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 justify-center sm:justify-start">
                                                    <p className="text-xs font-semibold text-slate-500">₹{(item.price || item.pricing?.final_price || item.base_price || 0).toLocaleString()} / Unit</p>
                                                    {item.options?.size && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                                            Size: {item.options.size}
                                                        </span>
                                                    )}
                                                    {item.options?.color && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                                                            Color: {item.options.color}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="col-span-3 flex justify-center w-full sm:w-auto">
                                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden w-full max-w-[120px] p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                                                    className="flex-1 flex items-center justify-center py-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30 border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                    disabled={item.quantity <= (getSubdomain() ? 1 : (item.min_quantity || 1))}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <div className="w-10 text-center font-bold text-slate-900 text-sm py-1">
                                                    {item.quantity}
                                                </div>
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                                                    className="flex-1 flex items-center justify-center py-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Ext. Price */}
                                        <div className="col-span-2 text-right w-full sm:w-auto hidden sm:block">
                                            <p className="text-lg font-black text-slate-900">
                                                ₹{((item.price || item.pricing?.final_price || item.base_price || 0) * item.quantity).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Remove button */}
                                        <div className="col-span-1 text-right flex justify-center sm:justify-end w-full sm:w-auto">
                                            <button
                                                onClick={() => removeFromCart(item.cartItemId || item.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 sm:block flex items-center gap-2"
                                            >
                                                <Trash2 size={18} />
                                                <span className="sm:hidden text-xs font-bold uppercase tracking-widest">Remove</span>
                                            </button>
                                        </div>

                                        {/* Mobile total price display */}
                                        <div className="w-full flex justify-between items-center sm:hidden mt-4 pt-4 border-t border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total:</span>
                                            <span className="text-xl font-black text-slate-900">
                                                ₹{((item.price || item.pricing?.final_price || item.base_price || 0) * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 w-full">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Order Summary</h3>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                                    <span>Subtotal ({safeCart.length})</span>
                                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                                    <span className="flex items-center gap-2">Shipping</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs uppercase tracking-widest">Pending</span>
                                </div>

                                <div className="pt-5 border-t border-slate-200">
                                    <div className="flex flex-col gap-1 mb-6">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Total</span>
                                            <span className="text-3xl font-black text-slate-900">₹{total.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 text-right uppercase tracking-widest font-semibold">Taxes & shipping calculated at checkout</span>
                                    </div>

                                    <Link to="/checkout" className="block w-full">
                                        <button className="w-full py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                            Proceed to Checkout
                                            <ArrowRight size={16} />
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1.5 text-center uppercase tracking-widest">
                                    <ShieldCheck size={14} className="text-slate-400" />
                                    Secure checkout process
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;
