import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const AddEditSupplier = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [supplier, setSupplier] = useState({
        name: '', email: '', password: '',
        contact_info: { email: '', phone: '' },
        priority: 0,
        shiprocket_pickup_nickname: ''
    });
    const [pickups, setPickups] = useState([]);

    useEffect(() => {
        if (!isEditing) return;
        const fetchSupplier = async () => {
            try {
                const res = await api.get(`/admin/suppliers/${id}`);
                const s = res.data?.data ?? res.data;
                if (s) {
                    let contact = { email: '', phone: '' };
                    try { contact = typeof s.contact_info === 'string' ? JSON.parse(s.contact_info || '{}') : (s.contact_info || {}); } catch { }
                    setSupplier({ 
                        name: s.name, 
                        email: s.email || '', 
                        password: '', 
                        contact_info: contact, 
                        priority: s.priority || 0,
                        shiprocket_pickup_nickname: s.shiprocket_pickup_nickname || ''
                    });
                }
            } catch (err) { console.error('Failed to fetch supplier', err); }
            finally { setLoading(false); }
        };

        const fetchPickups = async () => {
            try {
                const res = await api.get('/admin/shipping/shiprocket/pickups');
                setPickups(res.data?.data || []);
            } catch (e) {
                console.error('Failed to fetch pickups', e);
            }
        };

        fetchSupplier();
        fetchPickups();
    }, [id, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', supplier.name);
            formData.append('email', supplier.email);
            formData.append('contact_info', JSON.stringify(supplier.contact_info));
            formData.append('priority', supplier.priority || 0);
            formData.append('shiprocket_pickup_nickname', supplier.shiprocket_pickup_nickname || '');
            if (supplier.password?.trim()) formData.append('password', supplier.password);

            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/admin/supplier/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/admin/create-supplier', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/admin/suppliers');
        } catch (error) {
            console.error('Failed to save supplier', error);
            alert(error.response?.data?.message || 'Failed to save supplier');
        } finally { setIsSubmitting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/suppliers')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Supplier' : 'Add Supplier'}</h1>
                        <p className="text-sm text-slate-500">{isEditing ? 'Update supplier details' : 'Register a new supplier'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/admin/suppliers')}
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

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <h2 className="text-base font-semibold text-slate-900">Supplier Details</h2>
                <div>
                    <label className={labelCls}>Company Name</label>
                    <input required type="text" placeholder="e.g. ABC Textiles Pvt Ltd" className={inputCls}
                        value={supplier.name} onChange={e => setSupplier({ ...supplier, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Login Email</label>
                        <input required type="email" placeholder="admin@supplier.com" className={inputCls}
                            value={supplier.email} onChange={e => setSupplier({ ...supplier, email: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>Priority</label>
                        <input type="number" min="0" placeholder="e.g. 1 (High)" className={inputCls}
                            value={supplier.priority} onChange={e => setSupplier({ ...supplier, priority: e.target.value })} />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className={labelCls}>{isEditing ? 'New Password (optional)' : 'Password'}</label>
                        <input required={!isEditing} type="password" placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
                            className={inputCls} value={supplier.password}
                            onChange={e => setSupplier({ ...supplier, password: e.target.value })} />
                        {isEditing && <p className="text-xs text-slate-400 mt-1">Leave blank to keep current password.</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <h2 className="text-base font-semibold text-slate-900">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Support Email</label>
                        <input type="email" placeholder="support@supplier.com" className={inputCls}
                            value={supplier.contact_info.email}
                            onChange={e => setSupplier({ ...supplier, contact_info: { ...supplier.contact_info, email: e.target.value } })} />
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="text" placeholder="+91 XXX XXX XXXX" className={inputCls}
                            value={supplier.contact_info.phone}
                            onChange={e => setSupplier({ ...supplier, contact_info: { ...supplier.contact_info, phone: e.target.value } })} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <h2 className="text-base font-semibold text-slate-900">Logistics & Shipping</h2>
                <div>
                    <label className={labelCls}>Shiprocket Pickup Location Nickname</label>
                    <select 
                        className={inputCls}
                        value={supplier.shiprocket_pickup_nickname}
                        onChange={e => setSupplier({ ...supplier, shiprocket_pickup_nickname: e.target.value })}
                    >
                        <option value="">-- Select Pickup Point (from Shiprocket) --</option>
                        {pickups.map(p => (
                            <option key={p.pickup_location || p.id} value={p.pickup_location}>
                                {p.pickup_location} ({p.city}, {p.pincode})
                            </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-widest">
                        This location must be pre-configured in your Shiprocket panel.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddEditSupplier;
