import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ShoppingBag, Search, Menu, User, X, GraduationCap, ChevronRight, ChevronDown, Layers, ArrowRight, Phone, Mail, Globe, Shirt, BookOpen, PenTool, Briefcase, Armchair, Laptop, Beaker, Footprints, Zap, Image as ImageIcon } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import { APP_NAME } from '../utils/constants';

const Navbar = ({ schoolName = APP_NAME, schoolInfo: initialSchoolInfo = null }) => {
    const { user } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const [schoolInfo, setSchoolInfo] = useState(initialSchoolInfo);
    const [platformSettings, setPlatformSettings] = useState({
        platform_email: 'contact@myschoolbranding.in',
        platform_phone: '+91-XXXXXXXXXX'
    });

    useEffect(() => {
        if (initialSchoolInfo) {
            setSchoolInfo(initialSchoolInfo);
        }
    }, [initialSchoolInfo]);

    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCat, setActiveCat] = useState(null);

    // Sync search input with URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search');
        if (query) {
            setSearchQuery(query);
        } else if (location.pathname !== '/products') {
            setSearchQuery('');
        }
    }, [location.search, location.pathname]);

    const subdomain = getSubdomain();

    useEffect(() => {
        const fetchAllNavData = async () => {
            const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};
            
            const promises = [
                api.get('/settings').catch(() => null),
                api.get('/categories', config).catch(() => null)
            ];

            // Only fetch school info if we are on a subdomain and don't have it yet
            if (subdomain && !schoolInfo) {
                promises.push(api.get('/school/info', config).catch(() => null));
            }

            try {
                const results = await Promise.all(promises);
                
                // Result 0: Settings
                if (results[0]?.data) {
                    setPlatformSettings(prev => ({ ...prev, ...results[0].data }));
                }

                // Result 1: Categories
                if (results[1]?.data) {
                    const rawCats = results[1].data;
                    const cats = Array.isArray(rawCats) ? rawCats : (rawCats?.data || []);
                    setCategories(cats);
                }

                // Result 2: School Info (if requested)
                if (promises.length > 2 && results[2]?.data) {
                    const sData = results[2].data;
                    setSchoolInfo(sData.data ? sData.data : sData);
                }
            } catch (e) {
                console.error('Navbar data fetch error', e);
            }
        };

        fetchAllNavData();
    }, [subdomain]);

    useEffect(() => {
        if (categories.length > 0 && !activeCat) {
            setActiveCat(categories[0]);
        }
    }, [categories]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setIsMobileMenuOpen(false);
        }
    };

    const displayLogo = schoolInfo?.logo ? (schoolInfo.logo.startsWith('http') ? schoolInfo.logo : `/storage/${schoolInfo.logo.replace(/^\//, '')}`) : (!subdomain ? "/images/logo.png" : null);
    const displayName = schoolInfo?.name || schoolName;
    const shortDisplayName = schoolInfo?.abbreviation || (displayName.length > 20 ? displayName.substring(0, 17) + '...' : displayName);
    const themeColor = schoolInfo?.theme_color || '#4f46e5';

    const mainNavLinks = [
        { name: 'Home', path: '/' },
        { name: 'Schools', path: '/schools' },
        { name: 'About Us', path: '/about' },
        { name: 'Our Mission', path: '/mission' },
        { name: 'Press', path: '/press' },
        { name: 'Contact Us', path: '/contact' },
    ];

    const subdomainNavLinks = [
        { name: 'Home', path: '/' },
        { name: 'Categories', path: '#', isDropdown: true },
        { name: 'About Us', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
    ];

    const navLinks = subdomain ? subdomainNavLinks : mainNavLinks;

    const getDashboardPath = () => {
        if (!user) return '/login';
        const roles = Array.isArray(user.role) ? user.role : [user.role];
        if (roles.includes('super_admin')) return '/admin';
        if (roles.includes('school')) return '/school';
        if (roles.includes('supplier')) return '/supplier';
        return '/profile';
    };

    return (
        <>
            {/* Conditional Top Utility Bar */}
            {!subdomain ? (
                <div className="hidden lg:block bg-slate-950 text-white py-1.5 w-full z-[60] relative transition-all border-b border-white/5">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-center items-center text-[11px] font-bold tracking-[0.2em] uppercase">
                        <div className="flex items-center gap-2">
                            <Zap size={10} className="text-amber-400 fill-amber-400" />
                            <span>Create Your School store at zero cost</span>
                            <Zap size={10} className="text-amber-400 fill-amber-400" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden lg:block bg-slate-950 text-white py-2 w-full z-[60] relative transition-all overflow-hidden border-b border-white/5">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-8">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Notice</span>
                            </div>
                            
                            <div className="relative flex-1 overflow-hidden">
                                <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-white border-r border-white/10 pr-4">{displayName}</span>
                                        {schoolInfo?.announcements ? (
                                            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: schoolInfo.announcements }} />
                                        ) : (
                                            <span className="text-[11px] font-medium text-slate-400">Welcome to the official institutional store.</span>
                                        )}
                                    </div>
                                    {/* Duplicated for seamless loop */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-white border-r border-white/10 pr-4">{displayName}</span>
                                        {schoolInfo?.announcements ? (
                                            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: schoolInfo.announcements }} />
                                        ) : (
                                            <span className="text-[11px] font-medium text-slate-400">Welcome to the official institutional store.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 flex-shrink-0">
                            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                <Mail size={12} className="text-indigo-500" />
                                <span>{platformSettings.platform_email}</span>
                            </div>
                            {platformSettings.platform_phone && platformSettings.platform_phone !== '+91-XXXXXXXXXX' && (
                                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                    <Phone size={12} className="text-emerald-500" />
                                    <span>{platformSettings.platform_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <nav className={`fixed w-full z-50 transition-all duration-300 ${!scrolled ? 'lg:top-[28px] top-0' : 'top-0'} ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2 lg:py-0.5 border-b border-slate-200/50' : 'bg-white border-b border-slate-100 py-2.5 lg:py-0.5'}`}>
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between gap-8 h-10 lg:h-14">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-3 shrink-0">
                            {displayLogo ? (
                                <div className="flex items-center gap-3">
                                    <img src={displayLogo} alt={displayName} className="h-8 lg:h-10 w-auto object-contain" />
                                    {subdomain && (
                                        <span className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                                            <span className="hidden md:inline">{displayName}</span>
                                            <span className="md:hidden">{shortDisplayName}</span>
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: themeColor }}>
                                        <GraduationCap size={20} className="text-white" />
                                    </div>
                                    <span className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                                        <span className="hidden md:inline">{displayName}</span>
                                        <span className="md:hidden">{shortDisplayName}</span>
                                    </span>
                                </div>
                            )}
                        </Link>

                        {/* SEARCH CENTER (Only Main Platform) */}
                        {!subdomain && (
                            <div className="hidden lg:flex flex-1 max-w-2xl px-12">
                                <form onSubmit={handleSearch} className="relative w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search for products, brands and more..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:bg-white rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-[#002B5B] focus:ring-4 focus:ring-[#002B5B]/5 transition-all"
                                    />
                                </form>
                            </div>
                        )}

                        {/* Desktop Navigation (Subdomain Center) */}
                        {subdomain && (
                            <div className="hidden lg:flex items-center justify-center flex-1 gap-10">
                                {navLinks.map((link) => (
                                    link.isDropdown ? (
                                        <div key={link.name} className="group/nav-cat relative h-full flex items-center">
                                            <button className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-indigo-600 transition-colors h-full uppercase tracking-widest">
                                                {link.name} <ChevronDown size={14} className="group-hover/nav-cat:rotate-180 transition-transform" />
                                            </button>
                                            
                                            {/* Reuse the Mega Menu logic here */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-max min-w-[650px] opacity-0 invisible group-hover/nav-cat:opacity-100 group-hover/nav-cat:visible transition-all duration-300 z-[60] origin-top">
                                                <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
                                                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex overflow-hidden min-h-[400px]">
                                                    {/* LEFT PANE: Category List */}
                                                    <div className="w-64 border-r border-slate-50 bg-slate-50/30 overflow-y-auto">
                                                        {categories.map((cat) => (
                                                            <div 
                                                                key={cat.id}
                                                                onMouseEnter={() => setActiveCat(cat)}
                                                                className={`px-6 py-4 cursor-pointer transition-all flex items-center justify-between group/mn-cat ${activeCat?.id === cat.id ? 'bg-white text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                                                            >
                                                                <Link 
                                                                    to={`/products?category_id=${cat.id}`}
                                                                    className={`flex items-center gap-3 text-[13px] font-bold uppercase tracking-tight ${activeCat?.id === cat.id ? 'text-indigo-600' : ''}`}
                                                                >
                                                                    {cat.image_url ? (
                                                                        <img src={cat.image_url} alt="" className="w-6 h-6 object-contain opacity-80 group-hover/mn-cat:opacity-100" />
                                                                    ) : (
                                                                        <Layers size={14} className="opacity-40" />
                                                                    )}
                                                                    {cat.name}
                                                                </Link>
                                                                <ChevronRight size={14} className={`transition-transform ${activeCat?.id === cat.id ? 'translate-x-1' : 'opacity-0 group-hover/mn-cat:opacity-100'}`} />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* RIGHT PANE: Subcategories Dropdown */}
                                                    <div className="flex-1 p-8 bg-white overflow-y-auto">
                                                        {activeCat && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                                                                    <h3 className="font-black text-lg text-slate-900 uppercase tracking-tighter">{activeCat.name}</h3>
                                                                    <Link to={`/products?category_id=${activeCat.id}`} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                                        View All <ArrowRight size={12} />
                                                                    </Link>
                                                                </div>
                                                                
                                                                {activeCat.children && activeCat.children.length > 0 ? (
                                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                                        {activeCat.children.map(sub => (
                                                                            <Link 
                                                                                key={sub.id} 
                                                                                to={`/products?category_id=${sub.id}`} 
                                                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group/sub"
                                                                            >
                                                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover/sub:bg-indigo-600 group-hover/sub:text-white transition-colors overflow-hidden">
                                                                                    {sub.image_url ? (
                                                                                        <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <Layers size={18} />
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <span className="block text-[13px] font-bold text-slate-700 uppercase tracking-tight">{sub.name}</span>
                                                                                    <span className="text-[10px] text-slate-400 font-medium">Explore Collection</span>
                                                                                </div>
                                                                            </Link>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="py-20 text-center">
                                                                        <Layers className="mx-auto text-slate-100 mb-4" size={48} />
                                                                        <p className="text-slate-400 text-sm font-medium">Explore our premium selection of {activeCat.name}.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className={`relative flex items-center text-[13px] font-bold transition-all hover:text-indigo-600 py-2 uppercase tracking-widest ${location.pathname === link.path ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-700'}`}
                                            style={location.pathname === link.path ? { color: themeColor, borderColor: themeColor } : {}}
                                        >
                                            {link.name}
                                        </Link>
                                    )
                                ))}
                            </div>
                        )}

                        {/* Right Area: Cart, CTA, Auth */}
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {subdomain && (
                                <form onSubmit={handleSearch} className="hidden lg:flex relative mr-2">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-40 xl:w-48 bg-slate-50 border border-slate-200 focus:bg-white rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </form>
                            )}

                            <Link to="/cart" className="relative p-2.5 text-slate-600 hover:text-[#002B5B] hover:bg-slate-50 rounded-full transition-all">
                                <ShoppingBag size={24} strokeWidth={1.5} />
                                {getCartCount() > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[20px] h-[20px] flex items-center justify-center text-[11px] font-bold text-white rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: subdomain ? themeColor : '#FFD700', color: !subdomain ? '#111827' : 'white' }}>
                                        {getCartCount()}
                                    </span>
                                )}
                            </Link>

                            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                                {user ? (
                                    <Link to={getDashboardPath()} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-[#002B5B] hover:text-white transition-all shadow-sm">
                                        <User size={18} strokeWidth={1.5} />
                                    </Link>
                                ) : (
                                    <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-[#111827] bg-[#FFD700] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all uppercase tracking-wider">
                                        <User size={16} /> Login
                                    </Link>
                                )}
                            </div>

                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-700 hover:bg-slate-50 rounded-lg">
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Nav Strip (Only Main Platform) */}
                {!subdomain && (
                    <div className="hidden lg:block bg-[#002B5B] border-t border-white/10">
                        <div className="max-w-[1400px] mx-auto px-12 h-9 flex items-center">
                            <ul className="flex justify-center items-center gap-10 h-full">
                                <li>
                                    <Link to="/" className={`flex items-center gap-1.5 text-[13px] font-black h-full uppercase tracking-widest border-b-2 px-1 ${location.pathname === '/' ? 'text-[#FFD700] border-[#FFD700]' : 'text-white/90 border-transparent hover:text-[#FFD700]'}`}>
                                        Home
                                    </Link>
                                </li>
                                <li className="group/nav-cat relative h-full flex items-center">
                                    <button className="flex items-center gap-1.5 text-[13px] font-bold text-white/90 group-hover/nav-cat:text-[#FFD700] transition-colors h-full uppercase tracking-widest">
                                        Shop by Category <ChevronDown size={14} className="group-hover/nav-cat:rotate-180 transition-transform" />
                                    </button>                                    {/* Cleaner Two-Pane Mega Menu */}
                                    <div className="absolute top-full left-0 mt-0 w-max min-w-[650px] opacity-0 invisible group-hover/nav-cat:opacity-100 group-hover/nav-cat:visible transition-all duration-300 z-[60] origin-top">
                                        <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
                                        <div className="bg-white rounded-b-2xl shadow-2xl border border-slate-100 flex overflow-hidden min-h-[400px]">
                                            {/* LEFT PANE: Category List */}
                                            <div className="w-64 border-r border-slate-50 bg-slate-50/30 overflow-y-auto">
                                                {categories.map((cat) => (
                                                    <div 
                                                        key={cat.id}
                                                        onMouseEnter={() => setActiveCat(cat)}
                                                        className={`px-6 py-4 cursor-pointer transition-all flex items-center justify-between group/mn-cat ${activeCat?.id === cat.id ? 'bg-white text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                                                    >
                                                        <Link 
                                                            to={`/products?category_id=${cat.id}`}
                                                            className={`flex items-center gap-3 text-[13px] font-bold uppercase tracking-tight ${activeCat?.id === cat.id ? 'text-indigo-600' : ''}`}
                                                        >
                                                            {cat.image_url ? (
                                                                <img src={cat.image_url} alt="" className="w-6 h-6 object-contain opacity-80 group-hover/mn-cat:opacity-100" />
                                                            ) : (
                                                                <Layers size={14} className="opacity-40" />
                                                            )}
                                                            {cat.name}
                                                        </Link>
                                                        <ChevronRight size={14} className={`transition-transform ${activeCat?.id === cat.id ? 'translate-x-1' : 'opacity-0 group-hover/mn-cat:opacity-100'}`} />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* RIGHT PANE: Subcategories Dropdown */}
                                            <div className="flex-1 p-8 bg-white overflow-y-auto">
                                                {activeCat && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                                                            <h3 className="font-black text-lg text-slate-900 uppercase tracking-tighter">{activeCat.name}</h3>
                                                            <Link to={`/products?category_id=${activeCat.id}`} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                                View All <ArrowRight size={12} />
                                                            </Link>
                                                        </div>
                                                        
                                                        {activeCat.children && activeCat.children.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                                {activeCat.children.map(sub => (
                                                                    <Link 
                                                                        key={sub.id} 
                                                                        to={`/products?category_id=${sub.id}`} 
                                                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group/sub"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover/sub:bg-indigo-600 group-hover/sub:text-white transition-colors overflow-hidden">
                                                                            {sub.image_url ? (
                                                                                <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <Layers size={18} />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="block text-[13px] font-bold text-slate-700 uppercase tracking-tight">{sub.name}</span>
                                                                            <span className="text-[10px] text-slate-400 font-medium">Explore Collection</span>
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-20 text-center">
                                                                <Layers className="mx-auto text-slate-100 mb-4" size={48} />
                                                                <p className="text-slate-400 text-sm font-medium">Explore our premium selection of {activeCat.name}.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                {['Schools', 'About Us', 'Our Mission', 'Press', 'Contact Us'].map(name => (
                                    <li key={name}>
                                        <Link 
                                            to={name === 'Home' ? '/' : `/${name.toLowerCase().replace(' ', '-')}`} 
                                            className="text-[13px] font-bold text-white/90 hover:text-[#FFD700] transition-colors uppercase tracking-widest"
                                        >
                                            {name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </nav>

            {/* Mobile Menu */}
            {typeof document !== 'undefined' && document.body && createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
                                className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl z-[70] flex flex-col"
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-slate-900 uppercase">Menu</span>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                    <div className="space-y-1">
                                        {navLinks.map(link => (
                                            !link.isDropdown ? (
                                                <Link key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className="block py-3.5 px-4 font-bold text-slate-700 border-b border-slate-50 uppercase tracking-wider text-[11px] hover:bg-slate-50 hover:text-indigo-600 transition-all">
                                                    {link.name}
                                                </Link>
                                            ) : (
                                                <div key={link.name} className="border-b border-slate-50">
                                                    <button 
                                                        onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                                                        className="w-full py-3.5 px-4 flex items-center justify-between font-bold text-slate-700 uppercase tracking-wider text-[11px]"
                                                    >
                                                        <span>{link.name}</span>
                                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    
                                                    <AnimatePresence>
                                                        {isMobileCategoryOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-slate-50/50 rounded-xl mb-2"
                                                            >
                                                                {categories.map(cat => (
                                                                    <div key={cat.id} className="border-b border-white/40 last:border-0">
                                                                        <Link 
                                                                            to={`/products?category_id=${cat.id}`}
                                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                                            className="flex items-center gap-3 p-4 text-[13px] font-bold text-[#002B5B] uppercase tracking-tight"
                                                                        >
                                                                            {cat.image_url ? (
                                                                                <img src={cat.image_url} alt="" className="w-5 h-5 object-contain" />
                                                                            ) : (
                                                                                <Layers size={14} className="opacity-40" />
                                                                            )}
                                                                            {cat.name}
                                                                        </Link>
                                                                        {cat.children && cat.children.length > 0 && (
                                                                            <div className="pl-6 pb-2 space-y-1">
                                                                                {cat.children.map(sub => (
                                                                                    <Link 
                                                                                        key={sub.id}
                                                                                        to={`/products?category_id=${sub.id}`}
                                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                                        className="flex items-center gap-2 p-2 text-xs text-slate-500 hover:text-indigo-600"
                                                                                    >
                                                                                        {sub.image_url ? (
                                                                                            <img src={sub.image_url} alt="" className="w-4 h-4 object-contain rounded-sm" />
                                                                                        ) : (
                                                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                                        )}
                                                                                        {sub.name}
                                                                                    </Link>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
                                    {!subdomain && !user && (
                                        <Link to="/register-school" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">
                                            Create School Store
                                        </Link>
                                    )}
                                    {user ? (
                                        <Link to={getDashboardPath()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-sm gap-2">
                                            <User size={16} /> Dashboard
                                        </Link>
                                    ) : (
                                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-sm">
                                            Login / Register
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default Navbar;
