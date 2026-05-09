import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Edit, Loader2, Images, Trash2 } from 'lucide-react';

const getFirstImage = (images) => {
    let imgs = images;
    if (typeof imgs === 'string') {
        try { const p = JSON.parse(imgs); if (Array.isArray(p)) imgs = p; } catch (e) { }
    }
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    if (typeof imgs === 'string' && imgs) return imgs;
    return null;
};

const SupplierInventory = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const prodRes = await api.get('/supplier/products');
            setProducts(prodRes.data?.data ?? prodRes.data ?? []);
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

    const openAdd = () => navigate('/supplier/products/add');
    const openEdit = (p) => navigate(`/supplier/products/edit/${p.id}`);

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
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(p)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                                                title="Edit Product">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this product?')) {
                                                    try {
                                                        await api.delete(`/supplier/product/${p.id}`);
                                                        setProducts(prev => prev.filter(x => x.id !== p.id));
                                                    } catch (error) {
                                                        console.error('Delete failed', error);
                                                        alert(error.response?.data?.message || 'Failed to delete product');
                                                    }
                                                }
                                            }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                                                title="Delete Product">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default SupplierInventory;
