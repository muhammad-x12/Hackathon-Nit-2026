import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill-new'));
import { APP_DOMAIN } from '../../utils/constants';

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const AddEditSchool = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [school, setSchool] = useState({
        name: '', abbreviation: '', email: '', password: '', subdomain: '',
        commission_percentage: 10,
        contact_info: { email: '', phone: '', facebook: '', instagram: '', twitter: '', linkedin: '' },
        address: '',
        theme_color: '#4f46e5',
        academic_year: '2025-26',
        announcements: ''
    });

    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    useEffect(() => {
        if (!isEditing) return;
        const fetchSchool = async () => {
            try {
                const res = await api.get(`/admin/schools/${id}`);
                const s = res.data?.data ?? res.data;
                if (s) {
                    let contact = { email: '', phone: '', facebook: '', instagram: '', twitter: '', linkedin: '' };
                    try {
                        const parsed = typeof s.contact_info === 'string' ? JSON.parse(s.contact_info || '{}') : (s.contact_info || {});
                        contact = { ...contact, ...parsed };
                    } catch { }
                    setSchool({
                        name: s.name, abbreviation: s.abbreviation || '', email: s.email || '', password: '',
                        subdomain: s.subdomain, commission_percentage: s.commission_percentage || 10,
                        contact_info: contact,
                        address: s.address || '',
                        theme_color: s.theme_color || '#4f46e5',
                        academic_year: s.academic_year || '', announcements: s.announcements || ''
                    });
                    if (s.logo) setLogoPreview(s.logo);
                    if (s.school_banner) setBannerPreview(s.school_banner);
                }
            } catch (err) { console.error('Failed to fetch school', err); }
            finally { setLoading(false); }
        };
        fetchSchool();
    }, [id, isEditing]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') { setLogo(file); setLogoPreview(reader.result); }
            else { setBanner(file); setBannerPreview(reader.result); }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', school.name);
            formData.append('abbreviation', school.abbreviation);
            formData.append('email', school.email);
            formData.append('subdomain', school.subdomain);
            formData.append('commission_percentage', school.commission_percentage);
            formData.append('contact_info', JSON.stringify(school.contact_info));
            formData.append('theme_color', school.theme_color);
            formData.append('academic_year', school.academic_year);
            formData.append('announcements', school.announcements);
            formData.append('address', school.address);
            if (school.password?.trim()) formData.append('password', school.password);
            if (logo) formData.append('logo', logo);
            if (banner) formData.append('school_banner', banner);

            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/school/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/admin/create-school', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/admin/schools');
        } catch (error) {
            console.error('Failed to save school', error);
            alert(error.response?.data?.message || 'Failed to save school');
        } finally { setIsSubmitting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/schools')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit School' : 'Add School'}</h1>
                        <p className="text-sm text-slate-500">{isEditing ? 'Update school details' : 'Register a new school'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/admin/schools')}
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
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>School Name</label>
                                <input required type="text" placeholder="e.g. St. Xavier's Academy" className={inputCls}
                                    value={school.name} onChange={e => setSchool({ ...school, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Abbreviation (Short Name)</label>
                                <input type="text" placeholder="e.g. SXA" className={inputCls}
                                    value={school.abbreviation} onChange={e => setSchool({ ...school, abbreviation: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Email</label>
                                <input required type="email" placeholder="admin@school.com" className={inputCls}
                                    value={school.email} onChange={e => setSchool({ ...school, email: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>{isEditing ? 'New Password (optional)' : 'Password'}</label>
                                <input required={!isEditing} type="password" placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
                                    className={inputCls} value={school.password}
                                    onChange={e => setSchool({ ...school, password: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Subdomain</label>
                            <div className="flex">
                                <input required type="text" placeholder="school-handle" className={`${inputCls} rounded-r-none border-r-0`}
                                    value={school.subdomain}
                                    onChange={e => setSchool({ ...school, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} />
                                <span className="bg-slate-100 border border-slate-200 rounded-r-lg px-4 flex items-center text-sm text-slate-500 font-medium whitespace-nowrap">
                                    .{APP_DOMAIN}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Commission (%)</label>
                                <input required type="number" min="0" max="100" step="any" className={inputCls}
                                    value={school.commission_percentage}
                                    onChange={e => setSchool({ ...school, commission_percentage: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Academic Year</label>
                                <input type="text" placeholder="e.g. 2025-26" className={inputCls}
                                    value={school.academic_year}
                                    onChange={e => setSchool({ ...school, academic_year: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Notice</label>
                            <Suspense fallback={<div className="h-24 bg-slate-50 rounded-lg animate-pulse" />}>
                                <ReactQuill
                                    theme="snow"
                                    value={school.announcements || ''}
                                    onChange={val => setSchool({ ...school, announcements: val })}
                                    className="bg-white rounded-lg"
                                />
                            </Suspense>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Contact & Social Media</h2>
                        <div>
                            <label className={labelCls}>School Address</label>
                            <textarea placeholder="Full address..." className={`${inputCls} min-h-[80px]`}
                                value={school.address}
                                onChange={e => setSchool({ ...school, address: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Support Email</label>
                                <input type="email" placeholder="support@school.com" className={inputCls}
                                    value={school.contact_info.email}
                                    onChange={e => setSchool({ ...school, contact_info: { ...school.contact_info, email: e.target.value } })} />
                            </div>
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input type="text" placeholder="+91 XXX XXX XXXX" className={inputCls}
                                    value={school.contact_info.phone}
                                    onChange={e => setSchool({ ...school, contact_info: { ...school.contact_info, phone: e.target.value } })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Facebook URL</label>
                                <input type="text" placeholder="https://facebook.com/..." className={inputCls}
                                    value={school.contact_info.facebook}
                                    onChange={e => setSchool({ ...school, contact_info: { ...school.contact_info, facebook: e.target.value } })} />
                            </div>
                            <div>
                                <label className={labelCls}>Instagram URL</label>
                                <input type="text" placeholder="https://instagram.com/..." className={inputCls}
                                    value={school.contact_info.instagram}
                                    onChange={e => setSchool({ ...school, contact_info: { ...school.contact_info, instagram: e.target.value } })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Brand Assets */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                        <h2 className="text-base font-semibold text-slate-900">Brand Assets</h2>

                        <div>
                            <label className={labelCls}>Logo</label>
                            <div className="relative aspect-square max-w-[160px] mx-auto">
                                <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden">
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => handleFileChange(e, 'logo')} />
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <ImageIcon size={24} className="mx-auto mb-1" />
                                            <span className="text-xs">Upload Logo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Banner</label>
                            <div className="relative aspect-[21/9] w-full">
                                <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden">
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => handleFileChange(e, 'banner')} />
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400">Upload Banner</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Theme Color</label>
                            <div className="flex items-center gap-3">
                                <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                                    value={school.theme_color}
                                    onChange={e => setSchool({ ...school, theme_color: e.target.value })} />
                                <input type="text" className={`${inputCls} flex-1`}
                                    value={school.theme_color}
                                    onChange={e => setSchool({ ...school, theme_color: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEditSchool;
