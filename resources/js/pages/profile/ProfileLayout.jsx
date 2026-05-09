import React, { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../store/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { APP_NAME } from '../../utils/constants';
import { Calendar, LogOut, MapPin, Shield, ShoppingBag, User } from 'lucide-react';

const navItemCls = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors border ${
    isActive
      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
  }`;

const ProfileLayout = () => {
  const { user, logout } = useAuth();

  const initials = useMemo(() => {
    return (user?.name || 'U')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const roleLabel = useMemo(() => {
    const role = Array.isArray(user?.role) ? user.role[0] : user?.role || 'customer';
    return String(role).replace('_', ' ');
  }, [user]);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar schoolName={APP_NAME} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Hero Banner (keeps the old premium look) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-2xl font-black text-white backdrop-blur-sm flex-shrink-0 shadow-lg">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{user?.name}</h1>
              <p className="text-indigo-200 text-sm font-medium mt-0.5 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-bold text-white capitalize">
                  <Shield size={11} /> {roleLabel}
                </span>
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-indigo-200">
                    <Calendar size={11} /> Member since {memberSince}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition-colors flex-shrink-0"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Account</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Manage your profile</p>
              </div>
              <div className="p-4 space-y-2">
                <NavLink to="/profile" end className={navItemCls}>
                  <User size={16} /> User Info
                </NavLink>
                <NavLink to="/profile/address" className={navItemCls}>
                  <MapPin size={16} /> Saved Address
                </NavLink>
                <NavLink to="/profile/orders" className={navItemCls}>
                  <ShoppingBag size={16} /> Orders
                </NavLink>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-2 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfileLayout;

