import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Plus, Search, Edit, Loader2, Box, Images, X, PackagePlus,
    CheckCircle2, Save, Image as ImageIcon
} from 'lucide-react';

const SIZE_PRESETS = {
    clothing: {
        label: 'Clothing',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '24', '26', '28', '30', '32', '34', '36', '38', '40'],
    },
    shoes: {
        label: 'Shoes',
        sizes: ['UK 1', 'UK 2', 'UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'],
    },
    bags: {
        label: 'Bags',
        sizes: ['Small (15L)', 'Medium (25L)', 'Large (35L)', 'XL (45L)'],
    },
    stationery: {
        label: 'Stationery',
        sizes: ['A4', 'A5', 'A6', 'Letter', 'Single Line', 'Double Line', 'Four Line', 'Square'],
    },
    custom: { label: 'Custom', sizes: [] },
};

const COMMON_COLORS = [
    'Black', 'White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Grey',
    'Light Grey', 'Khaki', 'Cream', 'Beige', 'Brown', 'Maroon', 'Red',
    'Green', 'Olive Green', 'Yellow',
];

const EMPTY_PRODUCT = {
    name: '', description: '', category_id: '', base_price: '',
    stock_quantity: 0, size: '', color: '', material: '',
    images: null, customization_flag: false, for_schools_only: true,
    min_quantity: 1, max_quantity: '',
};

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const getFirstImage = (images) => {
    let imgs = images;
    if (typeof imgs === 'string') {
        try { const p = JSON.parse(imgs); if (Array.isArray(p)) imgs = p; } catch (e) { }
    }
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    if (typeof imgs === 'string' && imgs) return imgs;
    return null;
};

const ProductPanel = ({ isOpen, onClose, onSave, categories, editingProduct }) => {
    const [product, setProduct] = useState(EMPTY_PRODUCT);
    const [sizeType, setSizeType] = useState('clothing');
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!editingProduct;

    useEffect(() => {
        if (isOpen) {
            if (editingProduct) {
                setProduct({
                    name: editingProduct.name || '',
                    description: editingProduct.description || '',
                    category_id: editingProduct.category_id || '',
                    base_price: editingProduct.base_price || '',
                    stock_quantity: editingProduct.stock_quantity ?? 0,
                    size: editingProduct.size || '',
                    color: editingProduct.color || '',
                    material: editingProduct.material || '',
                    images: null,
                    customization_flag: !!editingProduct.customizable,
                    for_schools_only: editingProduct.for_schools_only !== 0 && editingProduct.for_schools_only !== false,
                    min_quantity: editingProduct.min_quantity ?? 1,
                    max_quantity: editingProduct.max_quantity || '',
                });
            } else {
                setProduct(EMPTY_PRODUCT);
            }
            setImageFiles([]);
            setCustomSizeInput('');
        }
    }, [isOpen, editingProduct]);

    const set = (f, v) => setProduct(p => ({ ...p, [f]: v }));

    const selectedSizes = product.size ? product.size.split(',').map(s => s.trim()).filter(Boolean) : [];
    const availableSizes = SIZE_PRESETS[sizeType]?.sizes ?? [];

    const addSize = (s) => {
        if (!selectedSizes.includes(s)) set('size', [...selectedSizes, s].join(', '));
    };
    const removeSize = (s) => set('size', selectedSizes.filter(x => x !== s).join(', '));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(product).forEach(([key, val]) => {
                if (key === 'images') return;
                if (key === 'customization_flag' || key === 'for_schools_only') { fd.append(key, val ? 1 : 0); return; }
                if (val !== '' && val !== null && val !== undefined) fd.append(key, val);
            });
            if (imageFiles.length > 0) {
                Array.from(imageFiles).forEach(f => fd.append('images[]', f));
            }

            if (isEditing) {
                await api.post(`/supplier/product/${editingProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/supplier/product', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to save product', err);
            alert(err.response?.data?.message || 'Failed to save product. Please check all required fields.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <PackagePlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                            <p className="text-sm text-slate-500">{isEditing ? 'Update product information' : 'Fill in the details to add a product'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Basic Info */}
                        <section>
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelCls}>Product Name *</label>
                                    <input required type="text" placeholder="e.g. Boys School Uniform Shirt"
                                        className={inputCls} value={product.name}
                                        onChange={e => set('name', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Category *</label>
                                    <select required className={inputCls} value={product.category_id} onChange={e => {
                                        set('category_id', e.target.value);
                                    }}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => {
                                            if (c.children && c.children.length > 0) {
                                                return (
                                                    <optgroup key={c.id} label={c.name}>
                                                        <option value={c.id}>— {c.name} (All)</option>
                                                        {c.children.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                                    </optgroup>
                                                );
                                            }
                                            return <option key={c.id} value={c.id}>{c.name}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea placeholder="Describe the product in detail..."
                                    className={`${inputCls} min-h-[100px] resize-none`}
                                    value={product.description}
                                    onChange={e => set('description', e.target.value)} />
                            </div>
                        </section>

                        {/* Pricing & Inventory */}
                        <section>
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Pricing & Inventory</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelCls}>Base Price (₹) *</label>
                                    <input required type="number" min="0" step="0.01" className={inputCls}
                                        value={product.base_price} onChange={e => set('base_price', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Stock Quantity *</label>
                                    <input required type="number" min="0" className={inputCls}
                                        value={product.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Min Order Qty</label>
                                    <input type="number" min="1" className={inputCls}
                                        value={product.min_quantity} onChange={e => set('min_quantity', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Max Order Qty (optional)</label>
                                    <input type="number" min="1" className={inputCls}
                                        value={product.max_quantity} onChange={e => set('max_quantity', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                                        checked={product.for_schools_only} onChange={e => set('for_schools_only', e.target.checked)} />
                                    <span className="text-sm font-medium text-slate-700">Schools Only</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                                        checked={product.customization_flag} onChange={e => set('customization_flag', e.target.checked)} />
                                    <span className="text-sm font-medium text-slate-700">Allow Customization</span>
                                </label>
                            </div>
                        </section>

                        {/* Variants */}
                        <section>
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Attributes & Variants</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Product Type (Size Guide)</label>
                                    <div className="flex gap-2 mb-2 bg-slate-100 p-1 rounded-lg w-fit">
                                        {Object.entries(SIZE_PRESETS).map(([key, val]) => (
                                            <button key={key} type="button" onClick={() => setSizeType(key)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sizeType === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-lg">
                                        {selectedSizes.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {selectedSizes.map(s => (
                                                    <span key={s} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-1 rounded-md">
                                                        {s}
                                                        <button type="button" onClick={() => removeSize(s)} className="hover:text-indigo-900 ml-1"><X size={12} /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">
                                            {availableSizes.map(s => {
                                                const chosen = selectedSizes.includes(s);
                                                return (
                                                    <button key={s} type="button" onClick={() => chosen ? removeSize(s) : addSize(s)}
                                                        className={`px-2 py-1 flex items-center gap-1 border rounded-md text-xs transition-colors ${chosen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'}`}>
                                                        {chosen && <CheckCircle2 size={12} />} {s}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Add custom size…" value={customSizeInput}
                                                onChange={e => setCustomSizeInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (customSizeInput.trim()) { addSize(customSizeInput.trim()); setCustomSizeInput(''); }
                                                    }
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
                                            <button type="button"
                                                onClick={() => { if (customSizeInput.trim()) { addSize(customSizeInput.trim()); setCustomSizeInput(''); } }}
                                                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 transition-colors">
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Color</label>
                                        <input type="text" placeholder="Or enter multiple separated by comma"
                                            className={inputCls} value={product.color}
                                            onChange={e => set('color', e.target.value)} />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {COMMON_COLORS.map(c => (
                                                <button key={c} type="button" onClick={() => set('color', product.color === c ? '' : c)}
                                                    className={`px-2 py-1 rounded border text-xs transition-colors ${product.color === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Material</label>
                                        <input type="text" placeholder="e.g. Cotton, Polyester"
                                            className={inputCls} value={product.material}
                                            onChange={e => set('material', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Images */}
                        <section>
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Product Images</h3>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-indigo-400 transition-colors cursor-pointer relative">
                                <input type="file" multiple accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={e => setImageFiles(Array.from(e.target.files))} />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                                        <ImageIcon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Click or drag images to upload</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {imageFiles.length > 0 ? <span className="text-indigo-600 font-medium">{imageFiles.length} files selected</span> : 'PNG, JPG up to 2MB'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {imageFiles.length > 0 && (
                                <div className="flex gap-3 flex-wrap mt-4">
                                    {imageFiles.map((f, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                                            <button type="button"
                                                onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </form>

                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? <Save size={16} /> : <CheckCircle2 size={16} />)}
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Product')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SupplierInventory = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/supplier/products'),
                api.get('/categories'),
            ]);
            setProducts(prodRes.data.data || []);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    const updateStock = async (id, newStock) => {
        try {
            await api.patch(`/supplier/product/${id}/stock`, { stock_quantity: newStock });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p));
        } catch (error) {
            console.error('Stock update failed', error);
        }
    };

    const openAdd = () => { setEditingProduct(null); setIsPanelOpen(true); };
    const openEdit = (p) => { setEditingProduct(p); setIsPanelOpen(true); };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your products, catalog, and stock.</p>
                </div>
                <button onClick={openAdd}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm w-fit">
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search products..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Product</th>
                                <th className="px-6 py-3 font-medium">Attributes</th>
                                <th className="px-6 py-3 font-medium">Stock</th>
                                <th className="px-6 py-3 font-medium">Price</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={24} />
                                    Loading inventory...
                                </td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No products found.</td></tr>
                            ) : filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {getFirstImage(p.images)
                                                    ? <img src={getFirstImage(p.images)} alt={p.name} className="w-full h-full object-cover" />
                                                    : <Images className="text-slate-400" size={20} />}
                                            </div>
                                            <div className="min-w-[200px] whitespace-normal">
                                                <p className="font-semibold text-slate-900 line-clamp-2">{p.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{p.subcategory?.name || p.category?.name || 'Uncategorized'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1 text-xs">
                                            {p.size && <p className="text-slate-600"><span className="text-slate-400 font-medium">Size:</span> {p.size}</p>}
                                            {p.color && <p className="text-slate-600"><span className="text-slate-400 font-medium">Color:</span> {p.color}</p>}
                                            {p.material && <p className="text-slate-600"><span className="text-slate-400 font-medium">Material:</span> {p.material}</p>}
                                            {!p.size && !p.color && !p.material && <span className="text-slate-400">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                <button onClick={() => updateStock(p.id, Math.max(0, p.stock_quantity - 1))}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">—</button>
                                                <input type="number" className={`w-12 text-center text-sm font-medium border-x border-slate-200 p-0 h-7 focus:ring-0 ${p.stock_quantity < 10 ? 'text-rose-600' : 'text-slate-900'}`}
                                                    value={p.stock_quantity} onChange={e => updateStock(p.id, parseInt(e.target.value) || 0)} />
                                                <button onClick={() => updateStock(p.id, p.stock_quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">+</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="font-semibold text-slate-900">₹{Number(p.base_price || 0).toLocaleString('en-IN')}</p>
                                        {(p.min_quantity > 1 || p.max_quantity) && (
                                            <p className="text-xs text-slate-500 mt-0.5">Qty: {p.min_quantity}{p.max_quantity ? `–${p.max_quantity}` : '+'}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center align-top">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {p.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right align-top">
                                        <button onClick={() => openEdit(p)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                                            title="Edit Product">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onSave={fetchInventory} categories={categories} editingProduct={editingProduct} />
        </div>
    );
};

export default SupplierInventory;
