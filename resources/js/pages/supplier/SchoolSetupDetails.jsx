import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    ArrowLeft, Loader2, Image as ImageIcon, Box,
    Shapes, LayoutGrid, Calendar, Building2,
    Archive, CheckCircle2, ChevronRight
} from 'lucide-react';

const printStyles = `
@media print {
    @page { size: A4; margin: 1cm; }
    html, body { height: auto !important; overflow: visible !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print, nav, footer, aside, header, .sidebar, button { display: none !important; }
    
    .print-only { 
        display: block !important;
        width: 100% !important;
        padding: 0 !important;
    }
    
    .print-product-info {
        margin-bottom: 30px !important;
        text-align: center !important;
        border-bottom: 2px solid #000 !important;
        padding-bottom: 10px !important;
        break-after: avoid !important;
    }

    .print-main-title {
        font-family: sans-serif !important;
        font-size: 20px !important;
        font-weight: 700 !important;
        margin: 0 !important;
    }

    .print-sub-title {
        font-family: sans-serif !important;
        font-size: 12px !important;
        color: #475569 !important;
    }
    
    .print-image-card {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 2cm 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        text-align: center !important;
    }
    
    .print-image-title {
        display: block !important;
        font-family: sans-serif !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        margin-bottom: 20px !important;
    }

    .print-image-wrapper {
        border-radius: 8px !important;
        padding: 20px !important;
        display: inline-block !important;
        width: 90% !important;
    }

    img {
        max-width: 100% !important;
        max-height: 18cm !important;
        object-fit: contain !important;
    }
}
.print-only { display: none; }
`;

const SchoolSetupDetails = () => {
    const { schoolProductId } = useParams();
    const navigate = useNavigate();
    const [setup, setSetup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!schoolProductId) {
                setError(true);
                setLoading(false);
                return;
            }
            try {
                const response = await api.get(`/supplier/school-setup-details/${schoolProductId}`);
                if (response.data) {
                    setSetup(response.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Failed to fetch setup details", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [schoolProductId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-sm font-medium">Loading setup details...</p>
        </div>
    );

    const product = setup?.product || {};
    const school = setup?.school || {};

    if (error || !setup || Object.keys(setup).length === 0) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <Archive size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Setup Not Found</h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">This school product setup could not be loaded. It may have been removed.</p>
            <button onClick={() => navigate('/supplier/school-setups')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                Return to School Setups
            </button>
        </div>
    );

    const basePrice = Number(product?.base_price || 0);
    const margin = Number(setup?.school_margin || 0);
    const totalMarketValue = Math.round(basePrice * (1 + margin / 100));

    // Consolidate gallery: Original first, then renders
    const gallery = [
        ...(product?.images?.[0] ? [{ url: product.images[0], type: 'Reference' }] : []),
        ...(setup?.rendered_images || []).map(url => ({ url, type: 'Render' }))
    ];

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <style>{printStyles}</style>

            {/* 📋 PRODUCTION PRINT VIEW (ONLY ACTIVATED DURING PRINT) */}
            <div className="print-only">
                <div className="print-product-info">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Production Specimen</p>
                    <h1 className="print-main-title">{product?.name}</h1>
                    <p className="print-sub-title">Partner School: {school?.name}</p>
                </div>

                <div className="print-image-card">
                    <h3 className="print-image-title">1. Final Rendered Design</h3>
                    <div className="print-image-wrapper">
                        {setup?.rendered_images?.[0] ? (
                            <img src={setup.rendered_images[0]} alt="Render" />
                        ) : (
                            <p className="text-sm text-slate-400">No Render Image Available</p>
                        )}
                    </div>
                </div>

                <div className="print-image-card">
                    <h3 className="print-image-title">2. Base Product Reference</h3>
                    <div className="print-image-wrapper">
                        {product?.images?.[0] ? (
                            <img src={product.images[0]} alt="Original" />
                        ) : (
                            <p className="text-sm text-slate-400">No Reference Image Found</p>
                        )}
                    </div>
                </div>

                {/* Secondary Perspectives If Any */}
                {setup?.rendered_images?.length > 1 && setup.rendered_images.slice(1).map((img, idx) => (
                    <div key={idx} className="print-image-card">
                        <h3 className="print-image-title">Additional Perspective View {idx + 2}</h3>
                        <div className="print-image-wrapper">
                            <img src={img} alt={`Perspective ${idx + 2}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 💻 DASHBOARD VIEW (HIDDEN ON PRINT) */}
            <div className="space-y-6 no-print">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/supplier/school/${school?.id || 'all'}/catalog`)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{product?.name || 'Untitled Product'}</h1>
                            <div className="flex items-center gap-3 mt-1.5 text-sm">
                                <span className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                    <Building2 size={14} />
                                    {school?.name || 'Partner school'}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <Shapes size={14} />
                                    {product?.subcategory?.name || product?.category?.name || 'Uncategorized'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm shrink-0">
                        <div className="text-center pr-6 border-r border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                                <CheckCircle2 size={16} /> Ready
                            </span>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-slate-500 mb-1">Batch Qty</p>
                            <span className="text-sm font-bold text-slate-900">{setup?.required_qty || 1} units</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Main Content Gallery */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-slate-900">Product Preview</h3>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${gallery[activeImageIndex]?.type === 'Reference' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                    {gallery[activeImageIndex]?.type === 'Reference' ? 'Original Reference' : 'Rendered Design'}
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 mb-4 flex items-center justify-center min-h-[400px]">
                                {gallery[activeImageIndex]?.url ? (
                                    <img
                                        src={gallery[activeImageIndex].url}
                                        className="max-w-full max-h-[400px] object-contain"
                                        alt="Preview Asset"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <ImageIcon size={48} />
                                        <p className="text-sm">No Preview Image</p>
                                    </div>
                                )}
                            </div>

                            {gallery.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {gallery.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors bg-white ${activeImageIndex === idx ? 'border-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <img src={item.url} className="w-full h-full object-contain p-2" alt="thumb" />
                                            {item.type === 'Reference' && (
                                                <div className="absolute top-0 right-0 bg-slate-100 text-[10px] text-slate-500 px-1 py-0.5 rounded-bl-lg font-medium">Ref</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Details */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Specifications */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-6">
                                <LayoutGrid size={18} className="text-indigo-500" />
                                Specifications
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Base Price</span>
                                    <span className="text-sm font-semibold text-slate-900">₹{basePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">School Margin</span>
                                    <span className="text-sm font-semibold text-slate-900">{margin}%</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-sm text-slate-500 font-medium">Final MRP</span>
                                    <span className="text-sm font-bold text-indigo-600">₹{totalMarketValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm text-slate-500">Material</span>
                                    <span className="text-sm font-medium text-slate-900">{product?.material || 'Standard'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Color Variant</span>
                                    <span className="text-sm font-medium text-slate-900">{product?.color || 'Standard'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Added Date</span>
                                    <span className="text-sm font-medium text-slate-900">{setup?.created_at ? new Date(setup.created_at).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Reference Product */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                                <Box size={18} className="text-indigo-500" />
                                Original Product
                            </h3>

                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-md overflow-hidden shrink-0">
                                    {product?.images?.[0] ? (
                                        <img src={product.images[0]} className="w-full h-full object-contain" alt="Original" />
                                    ) : (
                                        <ImageIcon className="text-slate-300 w-full h-full p-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1">{product?.name}</p>
                                    <p className="text-xs font-medium text-indigo-600">₹{basePrice.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSetupDetails;
