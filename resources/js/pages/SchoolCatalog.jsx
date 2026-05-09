import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, CheckCircle2, XCircle, Loader2, Percent, Archive, Grid, Check, Sparkles, ImageOff, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SchoolCatalog = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/master-catalog');
            // ProductResource::collection wraps in { data: [...] }
            const raw = response.data;
            const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
            setProducts(arr);
        } catch (error) {
            console.error('Failed to fetch catalog', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const severIntegration = async (product) => {
        try {
            await api.delete(`/school/remove-product/${product.id}`);
            fetchCatalog();
        } catch (error) {
            console.error('Action failed', error);
        }
    };

    const updateMargin = async (productId, newMargin) => {
        try {
            await api.post('/school/select-product', {
                product_id: productId,
                school_margin: newMargin
            });
            fetchCatalog();
        } catch (error) {
            console.error('Failed to update margin', error);
        }
    };

    const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const isSelected = Array.isArray(p.school_products) && p.school_products.length > 0;
        if (activeTab === 'selected') return matchesSearch && isSelected;
        return matchesSearch;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
                    <p className="text-slate-500 text-sm">Select and customize products to be available in your school's store.</p>
                </div>
                <div className="flex bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 items-center gap-2 text-xs font-bold text-slate-700">
                    <Grid size={14} className="text-indigo-500" />
                    <span className="uppercase tracking-wider">Product Management</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            All Products
                        </button>
                        <button
                            onClick={() => setActiveTab('selected')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'selected'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <CheckCircle2 size={12} />
                            My Store
                        </button>
                    </div>

                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                        {filteredProducts.length} Total Items
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                            <Loader2 className="text-indigo-500 animate-spin" size={32} />
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Catalog...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4 text-center">
                            <Box className="text-slate-200" size={48} />
                            <div className="text-slate-500 text-sm font-medium">No products found.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => {
                                const isSelected = product.school_products && product.school_products.length > 0;
                                const schoolData = isSelected ? product.school_products[0] : null;

                                return (
                                    <div
                                        key={product.id}
                                        className={`flex flex-col bg-white rounded-xl border transition-all duration-200 relative overflow-hidden group ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square w-full bg-slate-50 flex items-center justify-center p-4 relative border-b border-slate-100">
                                            {(() => {
                                                let images = product.images;
                                                if (typeof images === 'string') {
                                                    try {
                                                        const parsed = JSON.parse(images);
                                                        if (Array.isArray(parsed)) images = parsed;
                                                    } catch (e) { }
                                                }

                                                const imageDisplay = (isSelected && Array.isArray(schoolData.rendered_images) && schoolData.rendered_images.length > 0)
                                                    ? schoolData.rendered_images[0]
                                                    : (Array.isArray(images) && images.length > 0
                                                        ? images[0]
                                                        : (typeof images === 'string' ? images : null));

                                                return imageDisplay ? (
                                                    <img src={imageDisplay} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                                ) : (
                                                    <ImageOff className="text-slate-300" size={32} />
                                                );
                                            })()}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white border-2 border-white shadow-sm">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isSelected ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {product.subcategory?.name || product.category?.name || 'General'}
                                                    </span>
                                                    {product.sku && (
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-400 border-slate-100">
                                                            SKU: {product.sku}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold text-lg ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                        ₹{Number(product.pricing?.cost_to_school || product.base_price || 0).toLocaleString()}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">School Cost</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-50">
                                                {isSelected ? (
                                                    <div className="space-y-3">
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Margin (%)</label>
                                                                <div className="relative w-16">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-slate-900 focus:border-indigo-500"
                                                                        value={schoolData.school_margin}
                                                                        onChange={(e) => updateMargin(product.id, e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Selling Price</span>
                                                                <span className="text-xs font-bold text-indigo-600">
                                                                    ₹{Math.round(Number(product.pricing?.final_price || 0)).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => severIntegration(product)}
                                                            className="w-full py-1.5 text-red-500 hover:bg-red-50 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 hover:border-red-200 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/school/catalog/setup/${product.id}`)}
                                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                                                    >
                                                        Add to Store
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SchoolCatalog;
