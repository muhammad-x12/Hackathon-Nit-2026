import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit, Loader2, Trash2, Tag, ChevronDown, ChevronRight, CheckCircle2, X, Image as ImageIcon, Upload } from 'lucide-react';
import Modal from '../../components/Modal';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', parent_id: null, image: null, image_preview: null, icon_svg: '', gst_percentage: 0, sort_order: 0 });
    const [expandedCategories, setExpandedCategories] = useState({});

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const toggleExpand = (id) => setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    const handleOpenModal = (cat = { id: null, name: '', parent_id: null, image_url: null, icon_svg: '', gst_percentage: 0, sort_order: 0 }) => {
        setCurrentCategory({ ...cat, image: null, image_preview: cat.image_url, icon_svg: cat.icon_svg || '', gst_percentage: cat.gst_percentage || 0, sort_order: cat.sort_order || 0 });
        setIsModalOpen(true);
    };
    const handleOpenSubcategoryModal = (parentId) => {
        setCurrentCategory({ id: null, name: '', parent_id: parentId, image: null, image_preview: null, icon_svg: '', gst_percentage: 0, sort_order: 0 });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory({ id: null, name: '', parent_id: null, image: null, image_preview: null, icon_svg: '', gst_percentage: 0, sort_order: 0 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', currentCategory.name);
            if (currentCategory.parent_id) formData.append('parent_id', currentCategory.parent_id);
            if (currentCategory.image) formData.append('image', currentCategory.image);
            if (currentCategory.icon_svg) formData.append('icon_svg', currentCategory.icon_svg);
            formData.append('gst_percentage', currentCategory.gst_percentage || 0);
            formData.append('sort_order', currentCategory.sort_order || 0);

            if (currentCategory.id) {
                // Use POST for update as well since we need to send files, and spoof PUT
                formData.append('_method', 'PUT');
                await api.post(`/admin/category/${currentCategory.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/create-category', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save category', error);
            alert(error.response?.data?.error || error.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will also delete all subcategories.')) return;
        try {
            await api.delete(`/admin/category/${id}`);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.error || 'Delete failed');
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.children || []).some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalSubcategories = categories.reduce((sum, c) => sum + (c.children?.length || 0), 0);

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
                    <p className="text-sm text-slate-500 mt-1">{categories.length} categories, {totalSubcategories} subcategories</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Add Category
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search categories..."
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {loading ? (
                    <div className="py-16 text-center">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                        <p className="text-sm text-slate-400 mt-2">Loading categories...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <Tag size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No categories found</p>
                    </div>
                ) : filteredCategories.map((cat) => (
                    <div key={cat.id}>
                        <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {cat.image_url ? (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-300 border border-slate-200 overflow-hidden shrink-0">
                                        <ImageIcon size={20} />
                                    </div>
                                )}
                                {cat.children?.length > 0 ? (
                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(cat.id); }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                                        {expandedCategories[cat.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>
                                ) : (
                                    <div className="w-8 h-8" />
                                )}
                                <div>
                                    <span className="font-semibold text-slate-900">{cat.name}</span>
                                    <span className="text-xs text-slate-400 ml-2">{cat.children?.length || 0} subcategories</span>
                                    {cat.gst_percentage > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">{cat.gst_percentage}% GST</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenSubcategoryModal(cat.id)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Add subcategory">
                                    <Plus size={16} />
                                </button>
                                <button onClick={() => handleOpenModal(cat)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(cat.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {expandedCategories[cat.id] && cat.children?.length > 0 && (
                            <div className="bg-slate-50/50">
                                {cat.children.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between pl-16 pr-6 py-3 hover:bg-slate-100/50 transition-colors group/sub border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            {sub.image_url ? (
                                                <img src={sub.image_url} alt="" className="w-6 h-6 rounded object-cover border border-slate-200" />
                                            ) : (
                                                <Tag size={14} className="text-slate-300" />
                                            )}
                                            <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                            <span className="text-xs text-slate-400">{sub.slug}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(sub)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(sub.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}
                title={currentCategory.id ? "Edit Category" : "Add Category"} size="sm">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {currentCategory.parent_id && !currentCategory.id && (
                        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm font-medium">
                            Adding subcategory under: {categories.find(c => c.id === currentCategory.parent_id)?.name}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Name</label>
                        <input required autoFocus type="text"
                            placeholder="Enter category name"
                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            value={currentCategory.name}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                        />
                    </div>

                    {(!currentCategory.parent_id || currentCategory.id) && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent Category</label>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={currentCategory.parent_id || ''}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                            >
                                <option value="">None (Root Category)</option>
                                {categories.filter(c => currentCategory.id ? c.id !== currentCategory.id : true).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {!currentCategory.parent_id && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">GST (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.00"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    value={currentCategory.gst_percentage}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, gst_percentage: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Tax percentage.</p>
                            </div>
                        )}
                        <div className={currentCategory.parent_id ? "col-span-2" : ""}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={currentCategory.sort_order}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, sort_order: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Lower is first.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Icon SVG Code (Optional)</label>
                        <textarea
                            placeholder='<svg ...>...</svg>'
                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24"
                            value={currentCategory.icon_svg || ''}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, icon_svg: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Image</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                                {currentCategory.image_preview ? (
                                    <img src={currentCategory.image_preview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <ImageIcon size={24} className="text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                    <Upload size={16} />
                                    <span>{currentCategory.image ? 'Change Image' : 'Upload Image'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setCurrentCategory({
                                                    ...currentCategory,
                                                    image: file,
                                                    image_preview: URL.createObjectURL(file)
                                                });
                                            }
                                        }}
                                    />
                                </label>
                                <p className="text-[10px] text-slate-400 mt-2 lowercase">Recommended size: 400x400px, max 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={handleCloseModal}
                            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                            {currentCategory.id ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CategoryManagement;
