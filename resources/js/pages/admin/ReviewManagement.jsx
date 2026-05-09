import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Star, Trash2, CheckCircle, XCircle, Loader2, MessageSquare,
    User, Package, Calendar, Search, Filter, Plus
} from 'lucide-react';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [products, setProducts] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newReview, setNewReview] = useState({ product_id: '', rating: 5, comment: '', user_name: 'Admin', guest_name: '' });

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reviews');
            setReviews(res.data.data || []);

            // Also fetch products for the "Add Review" dropdown
            const prodRes = await api.get('/admin/products');
            setProducts(prodRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/admin/review/${id}/status`, { is_approved: !currentStatus });
            fetchReviews();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/admin/review/${id}`);
            fetchReviews();
        } catch (err) {
            console.error('Failed to delete review', err);
        }
    };

    const handleAddReview = async () => {
        if (!newReview.product_id) return alert('Please select a product');
        try {
            await api.post('/reviews/store', newReview);
            setShowAddModal(false);
            setNewReview({ product_id: '', rating: 5, comment: '', user_name: 'Admin', guest_name: '' });
            fetchReviews();
        } catch (err) {
            alert('Failed to add review');
        }
    };

    const filteredReviews = reviews.filter(rev => {
        const matchesSearch =
            (rev.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (rev.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (rev.comment || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'approved' && rev.is_approved) ||
            (statusFilter === 'pending' && !rev.is_approved);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Review Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Moderate and manage customer feedback</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                    <Plus size={18} /> Post Feedback
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search reviews, products, users..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden p-1">
                    {['all', 'approved', 'pending'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Rating & Comment</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                                        <p className="text-sm text-slate-400 mt-4 font-medium uppercase tracking-widest">Loading reviews...</p>
                                    </td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="text-slate-200" size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No reviews found</p>
                                    </td>
                                </tr>
                            ) : filteredReviews.map((rev) => (
                                <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                {rev.user?.name?.charAt(0) || <User size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{rev.guest_name || rev.user?.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-slate-400">{rev.guest_name ? 'Guest' : (rev.user?.email || 'Customer')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center p-1">
                                                {rev.product?.images?.[0] ? <img src={rev.product.images[0]} className="w-full h-full object-contain" /> : <Package size={16} className="text-slate-300" />}
                                            </div>
                                            <p className="text-sm font-bold text-slate-600 max-w-[150px] truncate">{rev.product?.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-0.5 mb-1.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={12} className={s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-600 max-w-[300px] line-clamp-2">{rev.comment}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                                            <Calendar size={14} />
                                            <span className="text-xs font-bold uppercase tracking-tighter">
                                                {new Date(rev.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(rev.id, rev.is_approved)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${rev.is_approved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}
                                        >
                                            {rev.is_approved ? 'Approved' : 'Pending'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => deleteReview(rev.id)}
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

            {/* Add Review Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-10 space-y-6 relative border border-slate-200">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">
                            <XCircle size={24} />
                        </button>

                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Post Customer Feedback</h2>
                            <p className="text-sm text-slate-500">Add reviews manually for quality control</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Select Product</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={newReview.product_id}
                                    onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })}
                                >
                                    <option value="">Choose a product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Reviewer Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="e.g. Rahul Sharma"
                                    value={newReview.guest_name}
                                    onChange={(e) => setNewReview({ ...newReview, guest_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Star Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} onClick={() => setNewReview({ ...newReview, rating: s })}
                                            className={`p-2.5 rounded-xl border transition-all ${newReview.rating >= s ? 'bg-yellow-50 border-yellow-200 text-yellow-500' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                            <Star size={20} className={newReview.rating >= s ? 'fill-yellow-500' : ''} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Comment</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-none"
                                    placeholder="Write your feedback here..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleAddReview}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagement;
