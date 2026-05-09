import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Save, Loader2, CheckCircle2, AlertCircle, User, Mail, Lock, Gift, Copy, Share2 } from 'lucide-react';

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-widest';

const UserInfo = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [refLoading, setRefLoading] = useState(true);
  const [referral, setReferral] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    const run = async () => {
      setRefLoading(true);
      try {
        const res = await api.get('/auth/my-referrals');
        setReferral(res.data || null);
      } catch {
        setReferral(null);
      } finally {
        setRefLoading(false);
      }
    };
    run();
  }, []);

  const referralCode = useMemo(() => referral?.referral_code || user?.referral_code || '', [referral, user]);
  const referralEnabled = String(referral?.referral_enabled ?? '1') === '1';

  const onCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch {
      // ignore
    }
  };

  const onShare = async () => {
    if (!referralCode) return;
    const text = `Use my referral code ${referralCode} on checkout.`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // ignore
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch {
      // ignore
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setOk(false);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      const res = await api.post('/auth/profile', payload);
      const u = res.data?.user;
      if (u) updateUser(u);
      setOk(true);
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }));
      setTimeout(() => setOk(false), 2500);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-lg font-black text-slate-900">User Info</h1>
          <p className="text-sm text-slate-500 mt-1">Update your account details and password.</p>
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
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={`${inputCls} pl-10`} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className={`${labelCls} mb-3`}>Change Password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className={`${inputCls} pl-10`}
                  placeholder="New password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className={`${inputCls} pl-10`}
                  placeholder="Confirm password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {referralEnabled && (
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden p-6 relative">
          <div className="absolute top-[-20px] right-[-20px] opacity-10">
            <Gift size={100} className="text-indigo-600" />
          </div>

          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 relative">
            <Gift size={16} className="text-indigo-600" /> Refer & Earn
          </h2>

          {refLoading ? (
            <div className="text-sm text-slate-600 flex items-center gap-2 relative">
              <Loader2 size={16} className="animate-spin text-indigo-600" /> Loading referral info…
            </div>
          ) : (
            <div className="space-y-3 relative">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-200/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Your Referral Code</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black text-indigo-600 tracking-wider">{referralCode || '—'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCopy}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors"
                    >
                      <Copy size={14} /> {copyOk ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={onShare}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 border border-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                    >
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/70 border border-indigo-200/40 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referrals</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{referral?.referral_count ?? 0}</p>
                </div>
                <div className="bg-white/70 border border-indigo-200/40 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discount</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {String(referral?.discount_type || 'percentage') === 'percentage'
                      ? `${referral?.discount_value ?? 0}%`
                      : `₹${referral?.discount_value ?? 0}`}
                  </p>
                </div>
                <div className="bg-white/70 border border-indigo-200/40 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max</p>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{referral?.discount_max ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInfo;

