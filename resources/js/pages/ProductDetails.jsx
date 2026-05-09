import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, ArrowLeft, ShieldCheck, RotateCcw, Loader2,
    Minus, Plus, Stamp, Layers, Info, Zap, MessageSquare,
    Palette, Ruler, Package2, Tag, CheckCircle2,
    Briefcase, Users, Truck, Weight, Star, StarHalf, User
} from 'lucide-react';
import ShareProduct from '../components/ShareProduct';
import { getSubdomain } from '../utils/subdomain';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, clearCart } = useCart();
    const { user } = useAuth();
    const isMain = !getSubdomain();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [platformSettings, setPlatformSettings] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [sizeError, setSizeError] = useState(false);
    const [colorError, setColorError] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    // Reviews State
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });

    const sizes = product?.size ? product.size.split(',').map(s => s.trim()).filter(Boolean) : [];
    const colors = product?.color ? product.color.split(',').map(c => c.trim()).filter(Boolean) : [];

    const variantDelta = (() => {
        const adj = product?.variant_price_adjustments;
        if (!adj || typeof adj !== 'object') return 0;
        const norm = (v) => String(v || '').trim().toLowerCase();
        const lookup = (map, key) => {
            if (!map || typeof map !== 'object') return 0;
            if (Object.prototype.hasOwnProperty.call(map, key)) return Number(map[key] || 0);
            const k = norm(key);
            for (const [label, val] of Object.entries(map)) {
                if (norm(label) === k) return Number(val || 0);
            }
            return 0;
        };
        return (lookup(adj.size, selectedSize) || 0) + (lookup(adj.color, selectedColor) || 0);
    })();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                const data = response.data.data || response.data;
                setProduct(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                setPlatformSettings(res.data);
            } catch (err) { /* silent */ }
        };
        fetchProduct();
        fetchSettings();
    }, [id]);

    useEffect(() => {
        if (product) {
            const currentMin = getSubdomain() ? (product.school_min_qty || 1) : (product.min_quantity || 1);
            setQuantity(Number(currentMin));
        }
    }, [product]);

    const isSchoolUser = user && (user.role === 'school' || user.role?.includes('school'));
    const canAddToCart = true; // Enabled for everyone as requested

    const validateSelection = () => {
        let isValid = true;
        if (sizes.length > 0 && !selectedSize) {
            setSizeError(true);
            isValid = false;
        } else {
            setSizeError(false);
        }

        if (colors.length > 1 && !selectedColor) {
            setColorError(true);
            isValid = false;
        } else {
            setColorError(false);
        }

        if (!isValid) {
            const el = document.getElementById('variant-selector');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return isValid;
    };

    const handleAddToCart = () => {
        if (!validateSelection()) return;
        addToCart(product, quantity, { size: selectedSize, color: selectedColor });
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!validateSelection()) return;
        clearCart();
        addToCart(product, quantity, { size: selectedSize, color: selectedColor });
        navigate('/cart');
        setTimeout(() => navigate('/checkout'), 0);
    };

    const minQty = product
        ? (getSubdomain() ? (product.school_min_qty || 1) : (product.min_quantity || 1))
        : 1;
    const decQty = () => setQuantity(q => Math.max(minQty, q - 1));
    const incQty = () => setQuantity(q => product.max_quantity ? Math.min(product.max_quantity, q + 1) : q + 1);
    
    const images = (() => {
        if (!product) return [null];
        // 1. If school customization has images, prioritize those
        if (product.school_customization?.rendered_images?.length > 0) {
            return product.school_customization.rendered_images;
        }
        
        // 2. If a color is selected and it has specific images, show them
        if (selectedColor && product.color_images && product.color_images[selectedColor]) {
            const colorSpecific = product.color_images[selectedColor];
            if (Array.isArray(colorSpecific) && colorSpecific.length > 0) {
                return colorSpecific;
            }
        }

        // 3. Fallback to general images
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images;
        }

        return [null];
    })();

    // Reset active image when color changes and new images are available
    useEffect(() => {
        setActiveImg(0);
    }, [selectedColor]);

    const baseDisplayPrice = product?.price ?? product?.pricing?.final_price ?? product?.base_price ?? 0;
    const displayPrice = Number(baseDisplayPrice || 0) + Number(variantDelta || 0);
    const hasDiscount = product?.pricing?.original_price && product?.pricing.original_price > displayPrice;
    const totalPrice = (Number(displayPrice) * quantity).toLocaleString('en-IN');

    const whatsappMsg = product ? `Hello, I'm interested in ordering *${quantity} units* of "${product.name}" (Product ID: ${product.id})${selectedSize ? `, Size: ${selectedSize}` : ''}${selectedColor ? `, Color: ${selectedColor}` : ''}. Please share availability and quote.` : '';
    const whatsappUrl = `https://wa.me/${platformSettings?.whatsapp_number || ''}?text=${encodeURIComponent(whatsappMsg)}`;

    // Fix for "disturbed lines" caused by excessive &nbsp; or concatenated text
    const cleanDescription = (html) => {
        if (!html) return '';
        // Replace &nbsp; with regular spaces to allow normal wrapping
        return html.replace(/&nbsp;/g, ' ');
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] text-slate-900 font-sans">
            <Navbar />

            {loading ? (
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                    <div className="flex flex-col items-center max-w-sm">
                        <div className="relative w-24 h-24 mb-10">
                            <div className="absolute inset-0 border-2 border-indigo-50 rounded-full scale-125" />
                            <div className="absolute inset-0 border-4 border-indigo-100/50 rounded-full" />
                            <Loader2 className="absolute inset-0 text-indigo-600 animate-spin" size={96} strokeWidth={1} />
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-lg font-black text-[#002B5B] uppercase tracking-[0.6em] font-mono translate-x-1">Loading</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Assembling Curated Specifications</span>
                        </div>
                    </div>
                </div>
            ) : !product ? (
                <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
                    <div className="text-center max-w-sm bg-white border border-slate-200 p-10 rounded-3xl shadow-lg">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mx-auto mb-6">
                            <RotateCcw size={28} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
                        <p className="text-slate-500 mb-6 text-sm">This item is no longer in the catalog.</p>
                        <button onClick={() => navigate('/products')}
                            className="px-6 py-3 bg-slate-900 text-white text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-slate-800 transition-colors">
                            Browse Catalog
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
                    {/* Breadcrumb */}
                    <button onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group w-fit">
                        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

                        {/* ── Left: Image Gallery ── */}
                        <div className="space-y-4 lg:sticky lg:top-28">
                            {/* Main image */}
                            <div className="aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center p-6 relative">
                                <AnimatePresence mode="wait">
                                    {images[activeImg] ? (
                                        <motion.img
                                            key={activeImg}
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            src={images[activeImg]}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <Package2 size={40} className="text-slate-300" />
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {images.map((img, idx) => (
                                        <button key={idx} onClick={() => setActiveImg(idx)}
                                            className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-white p-1.5 ${activeImg === idx ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            {img
                                                ? <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                                : <div className="w-full h-full bg-slate-100 rounded-lg" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Right: Details ── */}
                        <div className="space-y-6">

                            {/* Title & Price */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        <Layers size={12} className="text-indigo-600" />
                                        {product.subcategory?.name || product.category?.name || 'General'}
                                    </span>
                                    {product.sku && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            SKU: {product.sku}
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${product.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight flex-1 break-words">{product.name}</h1>
                                    <ShareProduct
                                        productName={product.name}
                                        productImage={images[0]}
                                    />
                                </div>
                                <div className="flex items-end gap-3">
                                    <span className="text-4xl font-black text-slate-900">₹{Number(displayPrice).toLocaleString('en-IN')}</span>
                                    {hasDiscount && (
                                        <span className="text-lg text-slate-400 font-bold line-through pb-1">
                                            ₹{Number(product.pricing.original_price).toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-slate-400 uppercase pb-1">/ unit</span>
                                </div>
                                {!isMain && (
                                    <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Single Unit & Bulk Available
                                    </p>
                                )}
                                {isMain && !isSchoolUser && (
                                    <p className="text-xs font-semibold text-slate-500 mt-1">Minimum order: {product.min_quantity || 1} units</p>
                                )}
                                {!isMain && (
                                    <p className="text-xs font-semibold text-slate-500 mt-1">Institutional MOQ: {product.school_min_qty || 1} units</p>
                                )}
                            </div>

                            {/* Variant Selectors (Size & Color) */}
                            {(sizes.length > 0 || colors.length > 1) && (
                                <div id="variant-selector" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                                    {sizes.length > 0 && (
                                        <div id="size-selector" className={`p-4 rounded-xl transition-all ${sizeError ? 'bg-rose-50 border border-rose-200 ring-4 ring-rose-500/10' : 'bg-slate-50/50 border border-slate-100'}`}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5"><Ruler size={11} /> Select Size</span>
                                                {sizeError && <span className="text-rose-600 animate-pulse">Required selection</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {sizes.map(s => (
                                                    <button key={s} type="button"
                                                        onClick={() => { setSelectedSize(s); setSizeError(false); }}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedSize === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {colors.length > 1 && (
                                        <div id="color-selector" className={`p-4 rounded-xl transition-all ${colorError ? 'bg-rose-50 border border-rose-200 ring-4 ring-rose-500/10' : 'bg-slate-50/50 border border-slate-100'}`}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5"><Palette size={11} /> Select Color</span>
                                                {colorError && <span className="text-rose-600 animate-pulse">Required selection</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {colors.map(c => (
                                                    <button key={c} type="button"
                                                        onClick={() => { setSelectedColor(c); setColorError(false); }}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedColor === c ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Product Specifications & Logistics */}
                            {(product.brand || product.gender || product.class_mapping || product.weight || product.dispatch_days || product.material) && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Info size={11} /> Specifications</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {product.brand && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Briefcase size={11} /> Brand
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate" title={product.brand}>{product.brand}</span>
                                            </div>
                                        )}
                                        {colors.length === 1 && product.color && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Palette size={11} /> Color
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate" title={product.color}>{product.color}</span>
                                            </div>
                                        )}
                                        {product.material && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Tag size={11} /> Material
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate" title={product.material}>{product.material}</span>
                                            </div>
                                        )}
                                        {product.gender && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Users size={11} /> Gender
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate" title={product.gender}>{product.gender}</span>
                                            </div>
                                        )}
                                        {product.class_mapping && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Layers size={11} /> Class Mapping
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate" title={product.class_mapping}>{product.class_mapping}</span>
                                            </div>
                                        )}
                                        {product.weight && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Weight size={11} /> Weight
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate">{product.weight} kg</span>
                                            </div>
                                        )}
                                        {product.length && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Ruler size={11} /> Length
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate">{product.length} cm</span>
                                            </div>
                                        )}
                                        {product.width && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Ruler size={11} /> Width
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate">{product.width} cm</span>
                                            </div>
                                        )}
                                        {product.height && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Ruler size={11} /> Height
                                                </p>
                                                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 w-full truncate">{product.height} cm</span>
                                            </div>
                                        )}
                                        {product.dispatch_days && (
                                            <div className="col-span-2 md:col-span-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Truck size={11} /> Dispatch & Logistics
                                                </p>
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                                                    Dispatches in {product.dispatch_days} days. {product.stock_type === 'ready' ? 'Ready to ship' : 'Made to order'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Order Box (Quantity & Purchase) */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
                                {/* Qty Selector */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        Order Quantity
                                        {(product.min_quantity > 1 || product.max_quantity) && (
                                            <span className="ml-2 text-indigo-600 normal-case font-semibold">
                                                (Min: {product.min_quantity || 1}{product.max_quantity ? ` · Max: ${product.max_quantity}` : ''})
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                                            <button onClick={decQty} disabled={quantity <= minQty}
                                                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30">
                                                <Minus size={14} />
                                            </button>
                                            <div className="w-14 text-center font-bold text-slate-900 text-base">{quantity}</div>
                                            <button onClick={incQty} disabled={product.max_quantity && quantity >= product.max_quantity}
                                                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Value</p>
                                            <p className="text-2xl font-black text-slate-900">₹{totalPrice}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-1 border-t border-slate-100">
                                    {canAddToCart ? (
                                        <div className="flex flex-col gap-3">
                                            <button onClick={handleAddToCart}
                                                className={`w-full py-3.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm ${addedToCart ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}>
                                                {addedToCart ? <><CheckCircle2 size={18} /> Added to Order!</> : <><ShoppingCart size={18} /> Add to Order</>}
                                            </button>
                                            <button onClick={handleBuyNow}
                                                className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group">
                                                <Zap size={18} className="fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" /> Checkout Now — ₹{totalPrice}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                            <p className="text-xs font-bold text-slate-600">This product is for institutional bulk orders</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Contact us via WhatsApp to place an order</p>
                                        </div>
                                    )}

                                    {/* WhatsApp — always shown if number configured */}
                                    {platformSettings?.whatsapp_number && (
                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                            className="w-full py-3.5 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#128C7E] font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 border border-[#25D366]/10 transition-colors">
                                            <MessageSquare size={18} />
                                            WhatsApp Enquiry
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* School Branding */}
                            {product.school_customization && (product.school_customization.logo || product.school_customization.text) && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Stamp size={13} /> Institutional Branding Applied
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {product.school_customization.logo && (
                                            <div className="bg-white rounded-xl p-3 border border-indigo-100">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">School Emblem</p>
                                                <img src={product.school_customization.logo} className="h-8 object-contain" alt="Logo" />
                                                <p className="text-[10px] text-slate-500 mt-1 capitalize">{(product.school_customization.logo_position || 'left_chest').replace('_', ' ')}</p>
                                            </div>
                                        )}
                                        {product.school_customization.text && (
                                            <div className="bg-white rounded-xl p-3 border border-indigo-100">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Text Imprint</p>
                                                <p className="text-sm font-bold text-slate-800 truncate">"{product.school_customization.text}"</p>
                                                <p className="text-[10px] text-slate-500 mt-1 capitalize">{(product.school_customization.text_position || 'back').replace('_', ' ')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Info size={12} /> Product Information
                                    </p>
                                    <div className="product-description"
                                        dangerouslySetInnerHTML={{ __html: cleanDescription(product.description) }} />
                                </div>
                            )}

                        </div>
                    </div>

                    {/* ── Reviews Section ── */}
                    <div className="mt-20 border-t border-slate-200 pt-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                            {/* Rating Summary */}
                            <div className="lg:col-span-1 space-y-6">
                                <h2 className="text-2xl font-black text-slate-900">Customer Reviews</h2>
                                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
                                    <p className="text-6xl font-black text-slate-900 mb-2">{product.average_rating || '0.0'}</p>
                                    <div className="flex justify-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={20}
                                                className={star <= Math.round(product.average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Based on {product.review_count || 0} reviews</p>

                                    {/* Detailed Breakdown */}
                                    <div className="mt-8 space-y-3">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count = product.reviews?.filter(r => r.rating === rating).length || 0;
                                            const percentage = product.review_count > 0 ? (count / product.review_count) * 100 : 0;
                                            return (
                                                <div key={rating} className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-slate-500 w-3">{rating}</span>
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${percentage}%` }}
                                                            className="h-full bg-yellow-400 rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 w-8">{percentage.toFixed(0)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Write Review Form */}
                                {user && (
                                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
                                        <h3 className="text-lg font-bold text-slate-900">Write a Review</h3>
                                        {reviewMessage.text && (
                                            <div className={`p-4 rounded-xl text-xs font-bold ${reviewMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                                {reviewMessage.text}
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Rating</p>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                                                            className={`p-2 rounded-lg border transition-all ${reviewForm.rating >= s ? 'bg-yellow-50 border-yellow-200 text-yellow-500' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                                            <Star size={20} className={reviewForm.rating >= s ? 'fill-yellow-500' : ''} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Experience</p>
                                                <textarea
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                                                    placeholder="What did you like or dislike?"
                                                    value={reviewForm.comment}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    setSubmittingReview(true);
                                                    try {
                                                        await api.post('/reviews/store', {
                                                            product_id: product.id,
                                                            ...reviewForm,
                                                            school_id: getSubdomain() ? product.school_id : null
                                                        });
                                                        setReviewMessage({ type: 'success', text: 'Thank you! Your review has been posted.' });
                                                        setReviewForm({ rating: 5, comment: '' });
                                                        // Refresh product
                                                        const res = await api.get(`/products/${id}`);
                                                        const updatedData = res.data.data || res.data;
                                                        setProduct(updatedData);
                                                    } catch (err) {
                                                        setReviewMessage({ type: 'error', text: 'Failed to post review. Please try again.' });
                                                    } finally {
                                                        setSubmittingReview(false);
                                                    }
                                                }}
                                                disabled={submittingReview}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {submittingReview ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Post Review'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reviews List */}
                            <div className="lg:col-span-2 space-y-8">
                                {product.reviews && product.reviews.length > 0 ? (
                                    product.reviews.map((rev) => (
                                        <div key={rev.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                                                        {rev.user_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{rev.user_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{rev.created_at}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} size={14}
                                                            className={star <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed">{rev.comment}</p>
                                            {rev.is_featured && (
                                                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-100">
                                                    <CheckCircle2 size={10} /> Top Review
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 border-dashed p-10">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <Star className="text-slate-300" size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Reviews Yet</h3>
                                        <p className="text-slate-500 text-sm max-w-xs">Be the first to share your thoughts about this product!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default ProductDetails;
