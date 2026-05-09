import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bell, Search, Package, ShoppingCart, Clock, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import { getSubdomain } from '../utils/subdomain';


const DashboardLayout = () => {
    const { user, updateUser } = useAuth();

    const [notifications, setNotifications] = React.useState([]);
    const [isNotifOpen, setIsNotifOpen] = React.useState(false);
    const [loadingNotifs, setLoadingNotifs] = React.useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoadingNotifs(true);
        try {
            const roles = Array.isArray(user.role) ? user.role : [user.role];
            let endpoint = '';
            const subdomain = getSubdomain();

            if (roles.includes('super_admin')) endpoint = '/admin/notifications';
            else if (roles.includes('school')) endpoint = '/school/notifications';
            else if (roles.includes('supplier')) endpoint = '/supplier/notifications';

            if (endpoint) {
                const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};
                const res = await api.get(endpoint, config);
                setNotifications(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoadingNotifs(false);
        }
    };

    const markAllRead = async () => {
        try {
            const roles = Array.isArray(user.role) ? user.role : [user.role];
            let endpoint = '';
            const subdomain = getSubdomain();

            if (roles.includes('super_admin')) endpoint = '/admin/notifications/read';
            else if (roles.includes('school')) endpoint = '/school/notifications/read';
            else if (roles.includes('supplier')) endpoint = '/supplier/notifications/read';

            if (endpoint) {
                const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};
                await api.post(endpoint, {}, config);
                setNotifications([]); // Clear locally
            }
        } catch (error) {
            console.error('Failed to mark notifications read', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 mins
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        // Automatically sync school data if it's missing the new abbreviation field
        // This ensures the sidebar is consistent across all dashboard pages
        if (user?.role === 'school' && user?.school && !user.school.hasOwnProperty('abbreviation')) {
            const syncSchoolData = async () => {
                try {
                    const res = await api.get('/school/info');
                    if (res.data) {
                        updateUser({ school: res.data });
                    }
                } catch (error) {
                    console.error('Failed to sync school data in layout', error);
                }
            };
            syncSchoolData();
        }
    }, [user, updateUser]);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white overflow-hidden relative">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Simplified Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-20 transition-all shadow-sm">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm placeholder:text-slate-400"
                                placeholder="Search..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className={`relative p-2.5 bg-white border shadow-sm rounded-lg transition-all ${isNotifOpen ? 'border-indigo-600 text-indigo-600 ring-2 ring-indigo-50' : 'border-slate-200 text-slate-400 hover:text-indigo-600'}`}
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                                )}
                            </motion.button>

                            {/* Notifications Dropdown */}
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{notifications.length || 0} New</span>
                                                </div>
                                                {notifications.length > 0 && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAllRead();
                                                        }}
                                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 px-2 py-1 rounded-md transition-all shadow-sm"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-[350px] overflow-y-auto">
                                                {loadingNotifs && notifications.length === 0 ? (
                                                    <div className="p-10 text-center">
                                                        <Clock className="animate-spin text-slate-200 mx-auto mb-2" size={24} />
                                                        <p className="text-xs text-slate-400">Loading alerts...</p>
                                                    </div>
                                                ) : notifications.length === 0 ? (
                                                    <div className="p-10 text-center">
                                                        <Bell className="text-slate-100 mx-auto mb-2" size={40} />
                                                        <p className="text-xs text-slate-400 font-medium">No new notifications</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {notifications.map((notif) => (
                                                            <Link 
                                                                key={notif.id} 
                                                                to={notif.link}
                                                                onClick={() => setIsNotifOpen(false)}
                                                                className="block p-4 hover:bg-slate-50 transition-colors group"
                                                            >
                                                                <div className="flex gap-3">
                                                                    <div className={`p-2 rounded-lg shrink-0 ${notif.type === 'order' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                        {notif.type === 'order' ? <ShoppingCart size={16} /> : <Package size={16} />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{notif.title}</p>
                                                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                                                                        <span className="text-[10px] text-slate-400 mt-2 block font-medium uppercase">{notif.created_at}</span>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {notifications.length > 0 && (
                                                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                                    <button 
                                                        onClick={() => setIsNotifOpen(false)}
                                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        Close View <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-700 leading-none">Management</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">System Online</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
