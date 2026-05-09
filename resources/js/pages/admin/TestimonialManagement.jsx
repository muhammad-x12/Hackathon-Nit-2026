import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Plus, Search, Edit2, Trash2, Star, User,
    MessageSquare, CheckCircle2, XCircle, Loader2,
    Image as ImageIcon
} from 'lucide-react';
import Modal from '../../components/Modal';

const TestimonialManagement = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        author_name: '',
        author_role: '',
        content: '',
        rating: 5,
        is_active: true
    });
    const [authorImage, setAuthorImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/testimonials');
            setTestimonials(res.data);
        } catch (error) {
            console.error('Failed to fetch testimonials', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (testimonial) => {
        setEditingId(testimonial.id);
        setForm({
            author_name: testimonial.author_name,
            author_role: testimonial.author_role || '',
            content: testimonial.content,
            rating: testimonial.rating,
            is_active: !!testimonial.is_active
        });
        setImagePreview(testimonial.author_image);
        setAuthorImage(null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            await api.delete(`/admin/testimonials/${id}`);
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAuthorImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('author_name', form.author_name);
            formData.append('author_role', form.author_role);
            formData.append('content', form.content);
            formData.append('rating', form.rating);
            formData.append('is_active', form.is_active ? 1 : 0);
            if (authorImage) formData.append('author_image', authorImage);

            if (editingId) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/testimonials/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/testimonials', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowModal(false);
            resetForm();
            fetchTestimonials();
        } catch (error) {
            console.error('Save failed', error);
            alert(error.response?.data?.message || 'Failed to save testimonial');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setForm({
            author_name: '',
            author_role: '',
            content: '',
            rating: 5,
            is_active: true
        });
        setAuthorImage(null);
        setImagePreview(null);
        setEditingId(null);
    };

    const filteredTestimonials = testimonials.filter(t =>
        t.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.author_role && t.author_role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Testimonial Management</h1>
                    <p className="text-sm text-slate-500">Manage customer stories and feedback displayed on the home page.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm"
                >
                    <Plus size={18} /> Add Testimonial
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or role..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Author</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Content</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Rating</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline-block mr-2" /> Loading testimonials...
                                    </td>
                                </tr>
                            ) : filteredTestimonials.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No testimonials found.</td>
                                </tr>
                            ) : filteredTestimonials.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                {t.author_image ? (
                                                    <img src={t.author_image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{t.author_name}</div>
                                                <div className="text-xs text-slate-500 font-medium">{t.author_role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-slate-600 line-clamp-2">{t.content}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {t.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-bold text-xs uppercase">
                                                <CheckCircle2 size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md font-bold text-xs uppercase">
                                                <XCircle size={12} /> Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
            </div>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Author Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                value={form.author_name}
                                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Author Role</label>
                            <input
                                type="text"
                                placeholder="e.g. Parent, Principal"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                value={form.author_role}
                                onChange={(e) => setForm({ ...form, author_role: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 text-xs uppercase tracking-widest">Author Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={24} className="text-slate-400" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <div className="text-xs text-slate-500">
                                <p className="font-bold">Click to upload photo</p>
                                <p>Square aspect ratio recommended. Max 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Testimonial Content</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Rating</label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setForm({ ...form, rating: val })}
                                        className={`p-1 transition-all ${val <= form.rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-200'}`}
                                    >
                                        <Star size={20} className={val <= form.rating ? 'fill-amber-400' : ''} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Set as Active</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {editingId ? 'Update Testimonial' : 'Create Testimonial'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TestimonialManagement;
