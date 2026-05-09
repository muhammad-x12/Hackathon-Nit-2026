import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Save, Loader2, CheckCircle2, AlertCircle, MapPin, Phone, User, Hash } from 'lucide-react';

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-widest';

const SavedAddress = () => {
  const { user, updateUser } = useAuth();
  const addr = useMemo(() => user?.default_shipping_address || {}, [user]);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    setForm({
      name: addr.name || user?.name || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      pincode: addr.pincode || '',
    });
  }, [addr, user]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setOk(false);
    try {
      const payload = {
        default_shipping_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        },
      };
      const res = await api.post('/auth/profile', payload);
      const u = res.data?.user;
      if (u) updateUser(u);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-lg font-black text-slate-900">Saved Address</h1>
          <p className="text-sm text-slate-500 mt-1">This address is pre-filled during checkout. You can edit it anytime.</p>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <AlertCircle size={14} /> {err}
            </div>
          )}
          {ok && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
              <CheckCircle2 size={14} /> Saved
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={`${inputCls} pl-10`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={`${inputCls} pl-10`} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-4 text-slate-400" />
              <textarea
                rows={3}
                className={`${inputCls} pl-10`}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Pincode</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={`${inputCls} pl-10`} value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SavedAddress;

