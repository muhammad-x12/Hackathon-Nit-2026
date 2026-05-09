import React, { useState, useEffect, lazy, Suspense } from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill-new'));
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import {
    Save, Layout, Image as ImageIcon, Palette, Calendar, Megaphone,
    Loader2, CheckCircle2, AlertCircle, Upload
} from 'lucide-react';

const SchoolStoreSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        name: '',
        abbreviation: '',
        theme_color: '#4f46e5',
        academic_year: '',
        announcements: '',
        address: '',
        contact_info: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
            youtube: ''
        }
    });

    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [previews, setPreviews] = useState({ logo: null, banner: null });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/school/info');
                if (res.data) {
                    // Sync the session user with the latest school data (including abbreviation)
                    updateUser({ school: res.data });

                    setForm({
                        name: res.data.name || '',
                        abbreviation: res.data.abbreviation || '',
                        theme_color: res.data.theme_color || '#4f46e5',
                        academic_year: res.data.academic_year || '',
                        announcements: res.data.announcements || '',
                        address: res.data.address || '',
                        contact_info: {
                            facebook: res.data.contact_info?.facebook || '',
                            instagram: res.data.contact_info?.instagram || '',
                            twitter: res.data.contact_info?.twitter || '',
                            linkedin: res.data.contact_info?.linkedin || '',
                            youtube: res.data.contact_info?.youtube || ''
                        }
                    });
                    setPreviews({
                        logo: res.data.logo,
                        banner: res.data.school_banner
                    });
                }
            } catch (error) {
                console.error('Failed to fetch store settings', error);
                setErrorMsg('Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'logo') setLogo(file);
        else setBanner(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('abbreviation', form.abbreviation);
            formData.append('theme_color', form.theme_color);
            formData.append('academic_year', form.academic_year);
            formData.append('announcements', form.announcements);
            formData.append('address', form.address);

            // Send contact_info as individual fields or JSON
            Object.keys(form.contact_info).forEach(key => {
                formData.append(`contact_info[${key}]`, form.contact_info[key]);
            });

            if (logo) formData.append('logo', logo);
            if (banner) formData.append('school_banner', banner);

            const res = await api.post('/school/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data?.school) {
                updateUser({ school: res.data.school });
            }
 
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Update failed', error);
            setErrorMsg(error.response?.data?.message || 'Failed to update store settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="text-sm font-medium">Loading Settings...</p>
            </div>
        );
    }

    const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400';
    const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Store Branding & Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Customize how your school store appears to students and parents.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Layout size={16} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">Public View</span>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-500" />
                    {errorMsg}
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Store settings updated successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Branding */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <Palette size={18} className="text-slate-400" />
                                    Branding Elements
                                </h3>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelCls}>School Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. St. Xavier's International"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Abbreviation (Short Name)</label>
                                        <input
                                            type="text"
                                            value={form.abbreviation}
                                            onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
                                            placeholder="e.g. SXI"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Logo & Banner Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelCls}>School Logo</label>
                                        <div className="relative group">
                                            <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer">
                                                {previews.logo ? (
                                                    <img src={previews.logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-slate-400">
                                                        <ImageIcon size={32} className="mb-2" />
                                                        <span className="text-xs">Square Recommended</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'logo')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Store Banner</label>
                                        <div className="relative group">
                                            <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer">
                                                {previews.banner ? (
                                                    <img src={previews.banner} alt="Banner Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-slate-400">
                                                        <ImageIcon size={32} className="mb-2" />
                                                        <span className="text-xs">16:9 Aspect Ratio</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'banner')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className={labelCls}>Primary Theme Color</label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="color"
                                            value={form.theme_color}
                                            onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                                            className="h-10 w-16 bg-white border border-slate-200 rounded p-1 cursor-pointer shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={form.theme_color}
                                            onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                                            className={`${inputCls} font-mono uppercase max-w-[120px]`}
                                        />
                                        <p className="text-xs text-slate-500">Hex color code for your elements.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Social Section */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <Megaphone size={18} className="text-slate-400" />
                                    Contact & Social Media
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className={labelCls}>School Address</label>
                                    <textarea
                                        placeholder="Enter the full school address..."
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        className={`${inputCls} min-h-[80px]`}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Facebook URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://facebook.com/your-school"
                                            value={form.contact_info.facebook}
                                            onChange={(e) => setForm({
                                                ...form,
                                                contact_info: { ...form.contact_info, facebook: e.target.value }
                                            })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Instagram URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://instagram.com/your-school"
                                            value={form.contact_info.instagram}
                                            onChange={(e) => setForm({
                                                ...form,
                                                contact_info: { ...form.contact_info, instagram: e.target.value }
                                            })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Twitter / X URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://twitter.com/your-school"
                                            value={form.contact_info.twitter}
                                            onChange={(e) => setForm({
                                                ...form,
                                                contact_info: { ...form.contact_info, twitter: e.target.value }
                                            })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>LinkedIn URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://linkedin.com/school/your-school"
                                            value={form.contact_info.linkedin}
                                            onChange={(e) => setForm({
                                                ...form,
                                                contact_info: { ...form.contact_info, linkedin: e.target.value }
                                            })}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <Calendar size={18} className="text-slate-400" />
                                    Session Info
                                </h3>
                            </div>
                            <div className="p-6">
                                <label className={labelCls}>Academic Year</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 2025-26"
                                    value={form.academic_year}
                                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <Megaphone size={18} className="text-slate-400" />
                                    Notice
                                </h3>
                            </div>
                            <div className="p-6">
                                <label className={labelCls}>Display Message</label>
                                <Suspense fallback={<div className="h-24 bg-slate-50 rounded-lg animate-pulse" />}>
                                    <ReactQuill
                                        theme="snow"
                                        value={form.announcements}
                                        onChange={(val) => setForm({ ...form, announcements: val })}
                                        className="bg-white rounded-lg"
                                    />
                                </Suspense>
                                <p className="text-xs text-slate-500 mt-2">This will appear in the top notification bar on your homepage.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {saving ? 'Publishing...' : 'Save & Publish'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SchoolStoreSettings;
