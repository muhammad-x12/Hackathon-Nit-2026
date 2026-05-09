import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Search, Edit, Trash2, Loader2, Package, ImageOff, Power } from 'lucide-react';

const ProductManagement = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSupplier, setSelectedSupplier] = useState('all');

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20
    });

    const fetchAllData = async (page = 1) => {
        setLoading(true);
        try {
            const url = `/admin/products?page=${page}&limit=20&search=${searchQuery}&status=${activeFilter}&category_id=${selectedCategory}&supplier_id=${selectedSupplier}`;
            const [prodRes, catRes, supRes] = await Promise.allSettled([
                api.get(url),
                api.get('/admin/categories/all'),
                api.get('/admin/suppliers/all')
            ]);

            if (prodRes.status === 'fulfilled') {
                const data = prodRes.value.data;
                setProducts(data.data || []);
                if (data.meta) {
                    setPagination({
                        current_page: data.meta.current_page,
                        last_page: data.meta.last_page,
                        total: data.meta.total,
                        per_page: data.meta.per_page
                    });
                }
            }
            if (catRes.status === 'fulfilled') {
                setCategories(catRes.value.data || []);
            }
            if (supRes.status === 'fulfilled') {
                setSuppliers(supRes.value.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load for categories/suppliers
    useEffect(() => {
        fetchAllData(1);
    }, []);

    // Debounced call for search/filters
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAllData(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, activeFilter, selectedCategory, selectedSupplier]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchAllData(newPage);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await api.patch(`/admin/product/${id}/status`);
            fetchAllData(pagination.current_page);
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/admin/product/${id}`);
                fetchAllData(pagination.current_page);
            } catch (error) {
                console.error('Failed to delete product', error);
            }
        }
    };

    const filteredProducts = products; // Already filtered by server

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
                    <p className="text-sm text-slate-500 mt-1">{pagination.total} products in catalog</p>
                </div>
                <button
                    onClick={() => navigate('/admin/products/add')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, SKU, or supplier..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {['all', 'active', 'inactive'].map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors
                                ${activeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {f}
                        </button>
                    ))}
                </div>

                <select
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                    <option value="all">All Suppliers</option>
                    {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                </select>

                <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 font-medium flex items-center whitespace-nowrap">
                    {filteredProducts.length} results
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Supplier</th>
                                <th className="px-6 py-3 text-right">Price</th>
                                <th className="px-6 py-3 text-center">Stock</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                        <p className="text-sm text-slate-400 mt-2">Loading products...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                                        <Package size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No products found</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageOff size={18} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                                                {product.sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                            {product.subcategory?.name || product.category?.name || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                {product.supplier?.name?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">{product.supplier?.name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                        ₹{Number(product.base_price || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-sm font-semibold ${product.stock_quantity < 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                                            {product.stock_quantity}
                                        </span>
                                        {product.stock_quantity < 10 && <p className="text-xs text-rose-400">Low stock</p>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(product.id)}
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer
                                                ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {product.status === 'active' ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Pagination Controls */}
                {!loading && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-2">
                                Showing <span className="text-slate-900">{products.length}</span> of <span className="text-slate-900">{pagination.total}</span> products
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{products.filter(p => p.status === 'active').length} active records shown</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center px-4">
                                <span className="text-xs font-bold text-slate-900">Page {pagination.current_page}</span>
                                <span className="text-xs text-slate-400 mx-1">of</span>
                                <span className="text-xs font-semibold text-slate-600">{pagination.last_page}</span>
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
