import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
    LayoutDashboard, Users, School, Truck, Package, ShoppingCart,
    CreditCard, Settings, LogOut, ShoppingBag, Layout, FileText, MessageSquare
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { getSubdomain } from '../utils/subdomain';
import { APP_NAME } from '../utils/constants';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const adminLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Schools', icon: School, path: '/admin/schools' },
        { name: 'Suppliers', icon: Truck, path: '/admin/suppliers' },
        { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
        { name: 'Products', icon: Package, path: '/admin/products' },
        { name: 'Categories', icon: ShoppingBag, path: '/admin/categories' },
        { name: 'Wallets', icon: CreditCard, path: '/admin/wallets' },
        { name: 'Settlements', icon: CreditCard, path: '/admin/settlements' },
        { name: 'Homepage', icon: Layout, path: '/admin/homepage' },
        { name: 'Static Pages', icon: FileText, path: '/admin/static-pages' },
        { name: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
        { name: 'Testimonials', icon: MessageSquare, path: '/admin/testimonials' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    const schoolLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/school' },
        { name: 'Catalog', icon: Package, path: '/school/catalog' },
        { name: 'Orders', icon: ShoppingCart, path: '/school/orders' },
        { name: 'Settlements', icon: CreditCard, path: '/school/settlements' },
        { name: 'Store Settings', icon: Layout, path: '/school/store-settings' },
        { name: 'Profile', icon: Settings, path: '/school/settings' },
    ];

    const supplierLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/supplier' },
        { name: 'Inventory', icon: Package, path: '/supplier/inventory' },
        { name: 'School Setups', icon: School, path: '/supplier/school-setups' },
        { name: 'Orders', icon: ShoppingCart, path: '/supplier/orders' },
        { name: 'Settings', icon: Settings, path: '/supplier/settings' },
    ];

    const getLinks = () => {
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        if (roles.includes('super_admin')) return adminLinks;
        if (roles.includes('school')) return schoolLinks;
        if (roles.includes('supplier')) return supplierLinks;
        return [];
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userRoleDisplay = (user?.primaryRole || user?.role || 'Guest').toString().replace('_', ' ');

    const isMainDomain = !getSubdomain();
    const displayLogo = user?.school?.logo_url || 
                       (user?.school?.logo && typeof user.school.logo === 'string' ? (user.school.logo.startsWith('http') ? user.school.logo : `/storage/${user.school.logo.replace(/^\//, '')}`) : null) || 
                       (isMainDomain ? '/images/logo.png' : null);

    return (
        <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-50">
            {/* Brand */}
            <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    {displayLogo ? (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-transparent border border-slate-100 overflow-hidden shrink-0 shadow-sm p-1">
                            <img src={displayLogo} alt={user?.school?.name || APP_NAME} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                            <ShoppingBag className="text-white" size={20} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <span className="text-lg font-bold text-slate-900 leading-tight block truncate uppercase tracking-tighter" title={user?.school?.name || APP_NAME}>
                            {user?.school?.abbreviation || user?.school?.name || APP_NAME}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{userRoleDisplay}</span>
                            {user?.school?.abbreviation && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate max-w-[80px]" title={user.school.name}>{user.school.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Navigation</p>

                {getLinks().map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end
                    >
                        {({ isActive }) => (
                            <div
                                className={`
                                    flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <link.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span>{link.name}</span>
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-900 font-bold text-sm shadow-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{userRoleDisplay}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-lg transition-all text-sm font-bold shadow-sm"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
