import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Loader2, Image as ImageIcon, X, Plus, Save, Trash2, Upload
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill-new'));

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center">
                    <p className="text-sm text-rose-600 font-medium">Editor failed to load.</p>
                    <p className="text-xs text-rose-400 mt-1">Please refresh the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const SIZE_PRESETS = {
    clothing: { label: 'Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44'] },
    shoes: { label: 'Shoes', sizes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'] },
    bags: { label: 'Bags', sizes: ['Small', 'Medium', 'Large', 'Extra Large'] },
    stationery: { label: 'Stationery', sizes: ['A4', 'A5', 'A6', 'Letter', 'Single Line', 'Double Line', 'Four Line', 'Square'] },
    custom: { label: 'Custom', sizes: [] },
};

const COMMON_COLORS = ['Black', 'White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Grey', 'Light Grey', 'Khaki', 'Cream', 'Beige', 'Brown', 'Maroon', 'Red', 'Green', 'Olive Green', 'Yellow'];

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const AddEditSupplierProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [sizeType, setSizeType] = useState('clothing');
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [colorImageFiles, setColorImageFiles] = useState({});
    const [existingColorImages, setExistingColorImages] = useState({});

    const [product, setProduct] = useState({
        sku: '', name: '', brand: '', short_description: '', description: '',
        product_type: 'both', category_id: '', subcategory_id: '',
        base_price: '', bulk_pricing: [], hsn_code: '',
        size: '', color: '', material: '', gender: '', class_mapping: '',
        variant_price_adjustments: { size: {}, color: {} },
        customization_flag: false, customization_options: [],
        stock_quantity: 0, low_stock_threshold: 10, stock_type: 'ready',
        weight: '', length: '', width: '', height: '', dimensions: '', dispatch_days: 3, delivery_type: 'direct',
        target_schools: [], for_schools_only: true, status: 'active',
        min_quantity: 1, school_min_qty: 1, max_quantity: '',
        meta_title: '', meta_description: '', meta_keywords: '',
    });

    const set = (field, value) => setProduct(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const catRes = await api.get('/categories');
                setCategories(catRes.data || []);
            } catch (err) { console.error('Failed to fetch dependencies', err); }
        };

        const fetchProduct = async () => {
            if (!isEditing) return;
            try {
                const res = await api.get(`/supplier/product/${id}`);
                const s = res.data.data || res.data;
                if (s) {
                    setProduct({
                        sku: s.sku || '', name: s.name || '', brand: s.brand || '',
                        short_description: s.short_description || '', description: s.description || '',
                        product_type: s.product_type || 'both', category_id: s.category_id || '', subcategory_id: s.subcategory_id || '',
                        supplier_id: s.supplier_id || '', base_price: s.base_price || '',
                        bulk_pricing: s.bulk_pricing || [],
                        hsn_code: s.hsn_code || '', size: s.size || '', color: s.color || '',
                        variant_price_adjustments: s.variant_price_adjustments || { size: {}, color: {} },
                        material: s.material || '', gender: s.gender || '',
                        class_mapping: s.class_mapping || '', customization_flag: !!s.customization_flag,
                        customization_options: s.customization_options || [],
                        stock_quantity: s.stock_quantity ?? 0, low_stock_threshold: s.low_stock_threshold ?? 10,
                        stock_type: s.stock_type || 'ready', weight: s.weight || '',
                        length: s.length || '', width: s.width || '', height: s.height || '',
                        dimensions: s.dimensions || '', dispatch_days: s.dispatch_days ?? 3,
                        delivery_type: s.delivery_type || 'direct', target_schools: s.target_schools || [],
                        for_schools_only: !!s.for_schools_only,
                        min_quantity: s.min_quantity ?? 1, school_min_qty: s.school_min_qty ?? 1,
                        max_quantity: s.max_quantity || '',
                        status: s.status || 'active',
                        meta_title: s.meta_title || '', meta_description: s.meta_description || '',
                        meta_keywords: s.meta_keywords || '',
                    });
                    setExistingImages(s.images || []);
                    setExistingColorImages(s.color_images || {});
                }
            } catch (err) { console.error('Failed to fetch product', err); }
            finally { setLoading(false); }
        };

        fetchDependencies();
        fetchProduct();
    }, [id, isEditing]);

    const addSizeChip = (size) => {
        setProduct(prev => {
            const current = (prev.size || '').split(',').map(s => s.trim()).filter(Boolean);
            if (!current.includes(size)) {
                return { ...prev, size: [...current, size].join(', ') };
            }
            return prev;
        });
    };

    const removeSizeChip = (size) => {
        setProduct(prev => {
            const current = (prev.size || '').split(',').map(s => s.trim()).filter(s => s && s !== size);
            return { ...prev, size: current.join(', ') };
        });
    };
    const selectedSizes = product.size ? product.size.split(',').map(s => s.trim()).filter(Boolean) : [];
    const availableSizes = SIZE_PRESETS[sizeType]?.sizes ?? [];
    const selectedColors = product.color ? product.color.split(',').map(c => c.trim()).filter(Boolean) : [];
    const [customColorInput, setCustomColorInput] = useState('');

    const addColorChip = (color) => {
        setProduct(prev => {
            const current = (prev.color || '').split(',').map(c => c.trim()).filter(Boolean);
            if (!current.includes(color)) {
                return { ...prev, color: [...current, color].join(', ') };
            }
            return prev;
        });
    };

    const removeColorChip = (color) => {
        setProduct(prev => {
            const current = (prev.color || '').split(',').map(c => c.trim()).filter(c => c && c !== color);
            return { ...prev, color: current.join(', ') };
        });
    };

    const [logoPlacementFile, setLogoPlacementFile] = useState(null);
    const [sizeChartFile, setSizeChartFile] = useState(null);
    const [demoImageFile, setDemoImageFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(product).forEach(([key, val]) => {
                if (key === 'customization_flag' || key === 'for_schools_only') {
                    formData.append(key, val ? '1' : '0');
                } else if (['bulk_pricing', 'customization_options', 'target_schools', 'variant_price_adjustments', 'color_images'].includes(key)) {
                    if (key !== 'color_images') {
                        formData.append(key, JSON.stringify(val || []));
                    }
                } else if (val !== null && val !== undefined) {
                    formData.append(key, val);
                }
            });
            formData.append('color_images_data', JSON.stringify(product.color_images || {}));
            if (imageFiles?.length > 0) Array.from(imageFiles).forEach(file => formData.append('images[]', file));
            
            // Color Specific Images
            Object.entries(colorImageFiles).forEach(([color, files]) => {
                files.forEach(file => {
                    formData.append(`color_images[${color}][]`, file);
                });
            });
            if (logoPlacementFile) formData.append('logo_placement_image', logoPlacementFile);
            if (sizeChartFile) formData.append('size_chart', sizeChartFile);
            if (demoImageFile) formData.append('demo_image', demoImageFile);

            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/supplier/product/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/supplier/product', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/supplier/inventory');
        } catch (error) {
            console.error('Failed to save product', error);
            alert(error.response?.data?.message || 'Error saving product.');
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/supplier/inventory')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
                        <p className="text-sm text-slate-500">{isEditing ? 'Update product details' : 'Add a new product to the catalog'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/supplier/inventory')}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Product Name</label>
                                <input required type="text" placeholder="e.g. Premium Cotton Polo" className={inputCls}
                                    value={product.name} onChange={e => set('name', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>SKU / Code</label>
                                <input type="text" placeholder="e.g. SKU-12345" className={inputCls}
                                    value={product.sku} onChange={e => set('sku', e.target.value.toUpperCase())} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Category</label>
                            <select required className={inputCls} value={product.category_id} onChange={e => {
                                set('category_id', e.target.value);
                                set('subcategory_id', '');
                            }}>
                                <option value="">Select category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        {product.category_id && categories.find(c => c.id == product.category_id)?.children?.length > 0 && (
                            <div>
                                <label className={labelCls}>Subcategory</label>
                                <select className={inputCls} value={product.subcategory_id} onChange={e => set('subcategory_id', e.target.value)}>
                                    <option value="">Select subcategory</option>
                                    {categories.find(c => c.id == product.category_id)?.children.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className={labelCls}>Brand</label>
                            <input type="text" placeholder="e.g. Nike" className={inputCls}
                                value={product.brand} onChange={e => set('brand', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Short Description</label>
                            <input type="text" placeholder="Brief product summary..." className={inputCls}
                                value={product.short_description} onChange={e => set('short_description', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Full Description</label>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <ErrorBoundary>
                                    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>}>
                                        <ReactQuill theme="snow" value={product.description}
                                            onChange={val => set('description', val)}
                                            className="product-description-editor min-h-[200px]" />
                                    </Suspense>
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>

                    {/* Product Type */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Product Type</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'wholesale', label: 'Wholesale Only' },
                                { id: 'school_store', label: 'School Store' },
                                { id: 'both', label: 'Both' },
                            ].map(t => (
                                <button key={t.id} type="button" onClick={() => set('product_type', t.id)}
                                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-all
                                        ${product.product_type === t.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Pricing</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Base Price (₹)</label>
                                <input required type="number" step="0.01" className={inputCls}
                                    value={product.base_price} onChange={e => set('base_price', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>HSN Code</label>
                            <input type="text" placeholder="e.g. 6203" className={inputCls}
                                value={product.hsn_code} onChange={e => set('hsn_code', e.target.value)} />
                        </div>

                        {/* Bulk Pricing */}
                        <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-slate-700">Bulk Pricing Tiers</h3>
                                <button type="button" onClick={() => set('bulk_pricing', [...product.bulk_pricing, { qty: '', price: '' }])}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            {product.bulk_pricing.map((tier, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <input type="number" placeholder="Min Qty" className={`${inputCls} flex-1`}
                                        value={tier.qty} onChange={e => {
                                            const t = [...product.bulk_pricing]; t[idx].qty = e.target.value; set('bulk_pricing', t);
                                        }} />
                                    <input type="number" placeholder="Price (₹)" className={`${inputCls} flex-1`}
                                        value={tier.price} onChange={e => {
                                            const t = [...product.bulk_pricing]; t[idx].price = e.target.value; set('bulk_pricing', t);
                                        }} />
                                    <button type="button" onClick={() => set('bulk_pricing', product.bulk_pricing.filter((_, i) => i !== idx))}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {product.bulk_pricing.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No bulk pricing tiers added.</p>}
                        </div>
                    </div>

                    {/* Variants & Specs */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Variants & Specifications</h2>

                        {/* Sizes */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Sizes</label>
                                <div className="flex bg-slate-100 rounded-lg overflow-hidden">
                                    {Object.entries(SIZE_PRESETS).map(([key, val]) => (
                                        <button key={key} type="button" onClick={() => setSizeType(key)}
                                            className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize
                                                ${sizeType === key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
                                {/* Render currently selected sizes first (including custom ones) */}
                                {selectedSizes.map(s => (
                                    <button key={s} type="button" onClick={() => removeSizeChip(s)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 group">
                                        {s}
                                        <X size={10} className="text-white/60 group-hover:text-white transition-colors" />
                                    </button>
                                ))}

                                {/* Render available preset sizes that are NOT yet selected */}
                                {availableSizes.filter(s => !selectedSizes.includes(s)).map(s => (
                                    <button key={s} type="button" onClick={() => addSizeChip(s)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 transition-colors">
                                        {s}
                                    </button>
                                ))}
                                <input type="text" placeholder="Custom size..." value={customSizeInput}
                                    onChange={e => setCustomSizeInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const sc = customSizeInput.trim();
                                            if (sc) {
                                                addSizeChip(sc);
                                                setCustomSizeInput('');
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg flex-1 min-w-[150px] focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>

                        {/* Colors */}
                        <div>
                            <label className={labelCls}>Colors</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
                                {selectedColors.map(c => (
                                    <button key={c} type="button" onClick={() => removeColorChip(c)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 group">
                                        {c}
                                        <X size={10} className="text-white/60 group-hover:text-white transition-colors" />
                                    </button>
                                ))}

                                {COMMON_COLORS.filter(c => !selectedColors.includes(c)).map(c => (
                                    <button key={c} type="button" onClick={() => addColorChip(c)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 transition-colors">
                                        {c}
                                    </button>
                                ))}

                                <input
                                    type="text"
                                    placeholder="Custom color..."
                                    value={customColorInput}
                                    onChange={(e) => setCustomColorInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const cc = customColorInput.trim();
                                            if (cc) {
                                                addColorChip(cc);
                                                setCustomColorInput('');
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg flex-1 min-w-[150px] focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Variant Price Adjustments */}
                        {(selectedSizes.length > 0 || selectedColors.length > 0) && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Variant price adjustments</p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Base price stays same. Add/subtract amounts per selected size/color.
                                    </p>
                                </div>

                                {selectedSizes.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Size delta (₹)</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedSizes.map((s) => (
                                                <label key={s} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                                    <span className="text-xs font-bold text-slate-700">{s}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-28 text-right text-sm font-bold text-indigo-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500"
                                                        value={product.variant_price_adjustments?.size?.[s] ?? 0}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setProduct((prev) => ({
                                                                ...prev,
                                                                variant_price_adjustments: {
                                                                    size: { ...(prev.variant_price_adjustments?.size || {}), [s]: Number(v) },
                                                                    color: { ...(prev.variant_price_adjustments?.color || {}) },
                                                                },
                                                            }));
                                                        }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedColors.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Color delta (₹)</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedColors.map((c) => (
                                                <label key={c} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                                    <span className="text-xs font-bold text-slate-700">{c}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-28 text-right text-sm font-bold text-indigo-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500"
                                                        value={product.variant_price_adjustments?.color?.[c] ?? 0}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setProduct((prev) => ({
                                                                ...prev,
                                                                variant_price_adjustments: {
                                                                    size: { ...(prev.variant_price_adjustments?.size || {}) },
                                                                    color: { ...(prev.variant_price_adjustments?.color || {}), [c]: Number(v) },
                                                                },
                                                            }));
                                                        }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Material */}
                        <div>
                            <label className={labelCls}>Material</label>
                            <input type="text" placeholder="e.g. 100% Cotton" className={inputCls}
                                value={product.material} onChange={e => set('material', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Gender</label>
                                <div className="flex bg-slate-100 rounded-lg overflow-hidden">
                                    {['Boys', 'Girls', 'Unisex'].map(g => (
                                        <button key={g} type="button" onClick={() => set('gender', g)}
                                            className={`flex-1 py-2.5 text-xs font-medium transition-colors
                                                ${product.gender === g ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Class Mapping</label>
                                <input type="text" placeholder="e.g. Class 1-12" className={inputCls}
                                    value={product.class_mapping} onChange={e => set('class_mapping', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Customization */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Customization Options</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-slate-500">Enable</span>
                                <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${product.customization_flag ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    onClick={() => set('customization_flag', !product.customization_flag)}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${product.customization_flag ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                        </div>
                        {product.customization_flag && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['Logo Printing', 'Embroidery', 'Name Personalization', 'Custom Patch'].map(opt => (
                                        <button key={opt} type="button"
                                            onClick={() => {
                                                const current = product.customization_options || [];
                                                set('customization_options', current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]);
                                            }}
                                            className={`py-2.5 rounded-lg text-xs font-medium border transition-colors
                                                ${(product.customization_options || []).includes(opt) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <label className={labelCls}>Logo Placement Reference</label>
                                    <div className="flex gap-4">
                                        {product.logo_placement_image && (
                                            <div className="w-24 h-24 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                                                <img src={product.logo_placement_image} className="w-full h-full object-cover" alt="Existing Logo Placement" />
                                            </div>
                                        )}
                                        <div className="relative flex-1">
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={e => setLogoPlacementFile(e.target.files[0])} />
                                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-400 transition-colors">
                                                <Upload size={16} />
                                                <span className="text-[10px] text-center px-2">{logoPlacementFile ? logoPlacementFile.name : 'Upload new reference'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Inventory */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Inventory</h2>
                        <div>
                            <label className={labelCls}>Stock Quantity</label>
                            <input type="number" className={inputCls}
                                value={product.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Low Stock Threshold</label>
                            <input type="number" className={inputCls}
                                value={product.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Stock Type</label>
                            <div className="flex bg-slate-100 rounded-lg overflow-hidden">
                                {['ready', 'made_to_order'].map(t => (
                                    <button key={t} type="button" onClick={() => set('stock_type', t)}
                                        className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
                                            ${product.stock_type === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                        {t.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Global MOQ</label>
                                <input type="number" className={inputCls}
                                    value={product.min_quantity} onChange={e => set('min_quantity', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>School MOQ</label>
                                <input type="number" className={inputCls}
                                    value={product.school_min_qty} onChange={e => set('school_min_qty', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Shipping</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Weight (kg)</label>
                                <input type="number" step="0.01" className={inputCls}
                                    value={product.weight} onChange={e => set('weight', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Length (cm)</label>
                                <input type="number" step="0.1" className={inputCls}
                                    value={product.length} onChange={e => set('length', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Width (cm)</label>
                                <input type="number" step="0.1" className={inputCls}
                                    value={product.width} onChange={e => set('width', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Height (cm)</label>
                                <input type="number" step="0.1" className={inputCls}
                                    value={product.height} onChange={e => set('height', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Dispatch Days</label>
                            <input type="number" className={inputCls}
                                value={product.dispatch_days} onChange={e => set('dispatch_days', e.target.value)} />
                        </div>
                    </div>

                    {/* General Images */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Product Images</h2>
                        <div className="relative">
                            <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={e => setImageFiles(Array.from(e.target.files))} />
                            <div className="h-28 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 transition-colors">
                                <ImageIcon size={20} />
                                <span className="text-xs">{imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'Upload images'}</span>
                            </div>
                        </div>
                        {existingImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {existingImages.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-lg border border-slate-200 overflow-hidden">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Specific Images */}
                    {selectedColors.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                            <h2 className="text-base font-semibold text-slate-900">Images by Color</h2>
                            <p className="text-[11px] text-slate-500 mt-1">Upload specific images for each color variation.</p>
                            
                            <div className="space-y-6 mt-4">
                                {selectedColors.map(color => (
                                    <div key={color} className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                {color}
                                            </span>
                                        </div>
                                        
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*" 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={e => {
                                                    const files = Array.from(e.target.files);
                                                    setColorImageFiles(prev => ({ ...prev, [color]: files }));
                                                }} 
                                            />
                                            <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-400 transition-colors bg-white">
                                                <Upload size={16} />
                                                <span className="text-[10px]">{colorImageFiles[color]?.length > 0 ? `${colorImageFiles[color].length} new files` : 'Upload color images'}</span>
                                            </div>
                                        </div>

                                        {(existingColorImages[color]?.length > 0 || colorImageFiles[color]?.length > 0) && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {/* Existing */}
                                                {existingColorImages[color]?.map((img, i) => (
                                                    <div key={`exist-${i}`} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = (existingColorImages[color] || []).filter((_, idx) => idx !== i);
                                                                setExistingColorImages(prev => ({ ...prev, [color]: updated }));
                                                                // We'll also need to sync this to the product object or send it separately
                                                                setProduct(prev => ({
                                                                    ...prev,
                                                                    color_images: { ...existingColorImages, [color]: updated }
                                                                }));
                                                            }}
                                                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Extra Files */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Extra Media</h2>
                        {[
                            { label: 'Size Chart', ref: sizeChartFile, set: setSizeChartFile, current: product.size_chart },
                            { label: 'Demo Image', ref: demoImageFile, set: setDemoImageFile, current: product.demo_image },
                        ].map(m => (
                            <div key={m.label}>
                                <label className={labelCls}>{m.label}</label>
                                <div className="flex gap-2">
                                    {m.current && (
                                        <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden shrink-0">
                                            <img src={m.current} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    )}
                                    <div className="relative flex-1">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={e => m.set(e.target.files[0])} />
                                        <div className="py-3 px-3 border border-slate-200 rounded-lg flex items-center gap-2 text-slate-400 hover:border-indigo-400 transition-colors text-[10px] h-12 overflow-hidden">
                                            <Upload size={12} />
                                            {m.ref ? m.ref.name : 'Update'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SEO */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">SEO</h2>
                        <div>
                            <label className={labelCls}>Meta Title</label>
                            <input type="text" className={inputCls}
                                value={product.meta_title} onChange={e => set('meta_title', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Meta Description</label>
                            <textarea rows="2" className={`${inputCls} resize-none`}
                                value={product.meta_description} onChange={e => set('meta_description', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Keywords</label>
                            <input type="text" placeholder="e.g. uniform, cotton, premium" className={inputCls}
                                value={product.meta_keywords} onChange={e => set('meta_keywords', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEditSupplierProduct;
