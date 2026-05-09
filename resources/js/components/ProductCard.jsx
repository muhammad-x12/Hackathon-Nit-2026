import React, { useState } from 'react';
import { ShoppingCart, Eye, Tag, AlertTriangle, ArrowRight, Share2, Layers, Sparkles, Check, Star, Zap } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getSubdomain } from '../utils/subdomain';

const ProductCard = ({ product }) => {
    const { addToCart, clearCart, cart = [] } = useCart();
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);
    const { user } = useAuth();
    const isMain = !getSubdomain();

    // Prefer API `price` which may include shipping when a pincode is provided.
    const displayPrice = product.price ?? product.pricing?.final_price ?? product.base_price ?? 0;
    const hasDiscount = product.pricing?.original_price && product.pricing.original_price > displayPrice;
    const isInCart = Array.isArray(cart) && cart.some(item => item.id === product.id);

    const isSchoolUser = user && (user.role === 'school' || user.role?.includes('school'));
    const canAddToCart = true; // Enabled for all as requested
    const minQty = getSubdomain() ? 1 : (product.min_quantity || 1);

    const imageDisplay = (product.school_customization?.rendered_images?.length > 0 ? product.school_customization.rendered_images[0] : null) ||
        (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] :
            (typeof product.images === 'string' && product.images ? product.images : null));

    const handleBuyNow = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearCart();
        addToCart(product, minQty);
        navigate('/cart');
        setTimeout(() => navigate('/checkout'), 0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="group flex flex-col bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:border-indigo-500 transition-all duration-500 shadow-sm hover:shadow-2xl h-full relative font-sans"
        >
            {/* Image Canvas */}
            <Link to={`/products/${product.id}`} className="block relative bg-slate-50/50 p-2 lg:p-3 overflow-hidden group/img transition-all duration-700" style={{ aspectRatio: '1/1' }}>
                <AnimatePresence mode="wait">
                    {imageDisplay ? (
                        <motion.img
                            key={imageDisplay}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{
                                opacity: imageLoaded ? 1 : 0,
                                scale: imageLoaded ? 1.15 : 1.2
                            }}
                            onLoad={() => setImageLoaded(true)}
                            src={imageDisplay}
                            alt={product.name}
                            className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-135`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart size={32} className="text-slate-200" />
                        </div>
                    )}
                </AnimatePresence>

                {/* Subtle Hover Action */}
                <div className="absolute inset-x-5 bottom-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30">
                    <div className="w-full bg-white shadow-xl border border-slate-100 rounded-xl py-3 text-center text-[9px] font-bold uppercase tracking-widest text-slate-800 flex items-center justify-center gap-2">
                        <Eye size={14} /> View Details
                    </div>
                </div>
            </Link>

            {/* Content Suite */}
            <div className="p-4 sm:p-7 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                        {product.subcategory?.name || product.category?.name || product.category || 'General'}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {minQty > 1 ? `MOQ: ${minQty}` : 'Verified'}
                    </span>
                </div>
                {product.brand && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {product.brand}
                    </span>
                )}

                {/* Rating */}
                {product.average_rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={10}
                                    className={star <= Math.round(product.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">({product.review_count || 0})</span>
                    </div>
                )}

                <Link to={`/products/${product.id}`} className="mb-3 block">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Variants Preview */}
                <div className="mb-8 min-h-[32px]">
                    {product.size ? (
                        <div className="flex flex-wrap gap-1.5">
                            {product.size.split(',').slice(0, 3).map(s => (
                                <span key={s} className="text-[8px] font-semibold bg-slate-50 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-100">{s.trim()}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Check size={12} strokeWidth={3} className="text-emerald-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-widest">School Approved</span>
                        </div>
                    )}
                </div>

                {/* Commercial Footer */}
                <div className="mt-auto pt-4 border-t border-slate-50 space-y-4">
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                ₹{Number(displayPrice).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Unit Price
                            </span>
                        </div>
                        {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through font-medium mb-1">
                                ₹{Number(product.pricing.original_price).toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Force redirect if any options/selections are needed */}
                        {(product.size || (product.color && product.color.includes(',')) || product.customization_flag || product.for_schools_only) ? (
                            <Link
                                to={`/products/${product.id}`}
                                className="h-11 sm:h-12 flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                            >
                                Select Options <ArrowRight size={14} />
                            </Link>
                        ) : (
                            <>
                                {canAddToCart && (
                                    <button
                                        onClick={handleBuyNow}
                                        className="w-11 h-11 sm:w-12 sm:h-12 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                        title="Buy Now"
                                    >
                                        <Zap size={16} className="fill-yellow-400 text-yellow-500" />
                                    </button>
                                )}

                                {canAddToCart ? (
                                    <button
                                        onClick={() => addToCart(product, minQty)}
                                        className={`flex-1 h-11 sm:h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${isInCart
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                            : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-slate-100'
                                            } active:scale-95 text-[10px] font-bold uppercase tracking-widest`}
                                    >
                                        {isInCart ? (
                                            <><Check size={18} strokeWidth={3} /> Added</>
                                        ) : (
                                            <><ShoppingCart size={18} strokeWidth={2} /> Add to Order</>
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        to={`/products/${product.id}`}
                                        className="h-11 sm:h-12 flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        View <ArrowRight size={14} />
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
