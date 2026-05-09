import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Save, Layout, Image as ImageIcon, Plus, Trash2,
    Loader2, CheckCircle2, AlertCircle, Upload
} from 'lucide-react';

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const HomepageSetup = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [newBanner, setNewBanner] = useState({
        image: null, title: '', subtitle: '', button_text: '', button_link: '', order: 0
    });

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/admin/banners');
            setBanners(res.data.data || res.data || []);
        } catch (error) { console.error('Failed to fetch banners', error); }
        finally { setFetching(false); }
    };

    const handleFileChange = (e) => setNewBanner({ ...newBanner, image: e.target.files[0] });
    const handleNewBannerChange = (e) => setNewBanner({ ...newBanner, [e.target.name]: e.target.value });

    const handleAddBanner = async (e) => {
        e.preventDefault();
        if (!newBanner.image) return alert('Please select an image');
        setLoading(true);
        const formData = new FormData();
        formData.append('image', newBanner.image);
        formData.append('title', newBanner.title);
        formData.append('subtitle', newBanner.subtitle);
        formData.append('button_text', newBanner.button_text);
        formData.append('button_link', newBanner.button_link);
        formData.append('order', newBanner.order);

        try {
            await api.post('/admin/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            setNewBanner({ image: null, title: '', subtitle: '', button_text: '', button_link: '', order: 0 });
            fetchBanners();
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) { setErrorMsg('Failed to add banner'); }
        finally { setLoading(false); }
    };

    const handleDeleteBanner = async (id) => {
        if (!window.confirm('Delete this banner?')) return;
        try { await api.delete(`/admin/banners/${id}`); fetchBanners(); }
        catch (error) { alert('Failed to delete banner'); }
    };

    if (fetching) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Homepage Setup</h1>
                <p className="text-sm text-slate-500 mt-1">Manage homepage banners and promotions</p>
            </div>

            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-500" />
                    <span className="text-sm text-rose-700">{errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-sm text-emerald-700">Banner added successfully!</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Existing Banners */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Active Banners</h2>
                            <span className="text-xs text-slate-400">{banners.length} banners</span>
                        </div>
                        <div className="p-6">
                            {banners.length === 0 ? (
                                <div className="py-16 text-center text-slate-400">
                                    <ImageIcon size={36} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No banners added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {banners.map((banner) => (
                                        <div key={banner.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-colors">
                                            <div className="w-32 aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                <img src={banner.image} className="w-full h-full object-cover" alt="Banner" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 truncate">{banner.title || 'Untitled'}</h4>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">{banner.subtitle || 'No subtitle'}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    {banner.button_text && (
                                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">{banner.button_text}</span>
                                                    )}
                                                    <span className="text-xs text-slate-400">Order: {banner.order}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteBanner(banner.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add New Banner */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4">
                        <h2 className="text-base font-semibold text-slate-900 mb-5">Add New Banner</h2>
                        <form onSubmit={handleAddBanner} className="space-y-4">
                            <div>
                                <label className={labelCls}>Banner Image</label>
                                <div className="relative">
                                    <input type="file" onChange={handleFileChange} className="hidden" id="banner-upload" accept="image/*" />
                                    <label htmlFor="banner-upload"
                                        className="flex items-center justify-center gap-2 h-28 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer">
                                        {newBanner.image ? (
                                            <div className="text-center">
                                                <CheckCircle2 size={20} className="mx-auto mb-1 text-emerald-500" />
                                                <span className="text-xs text-slate-600 font-medium">{newBanner.image.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={20} className="mx-auto mb-1" />
                                                <span className="text-xs">Upload image (2560×1080 recommended)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Title</label>
                                <input name="title" value={newBanner.title} onChange={handleNewBannerChange}
                                    placeholder="Banner headline" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Subtitle</label>
                                <textarea name="subtitle" value={newBanner.subtitle} onChange={handleNewBannerChange}
                                    placeholder="Supporting text" rows="2" className={`${inputCls} resize-none`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Button Text</label>
                                    <input name="button_text" value={newBanner.button_text} onChange={handleNewBannerChange}
                                        placeholder="Shop Now" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Order</label>
                                    <input name="order" type="number" value={newBanner.order} onChange={handleNewBannerChange}
                                        className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Button Link</label>
                                <input name="button_link" value={newBanner.button_link} onChange={handleNewBannerChange}
                                    placeholder="/shop/uniforms" className={inputCls} />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                {loading ? 'Adding...' : 'Add Banner'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomepageSetup;
