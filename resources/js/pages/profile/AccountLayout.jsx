import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { APP_NAME } from '../../utils/constants';
import { User, MapPin, ShoppingBag } from 'lucide-react';

const navItemCls = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors border ${
    isActive
      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
  }`;

const AccountLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar schoolName={APP_NAME} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-72">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.25em]">My Account</p>
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

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AccountLayout;

