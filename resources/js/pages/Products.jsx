import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { getSubdomain } from '../utils/subdomain';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../utils/constants';
import {
    Filter, Search, X, Loader2, AlertCircle, RefreshCw,
    SlidersHorizontal, PackageX, Sparkles, ArrowUpDown,
    CheckSquare, Square, Tag, ChevronDown
} from 'lucide-react';

const SORT_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'name_asc', label: 'Name: A → Z' },
    { value: 'name_desc', label: 'Name: Z → A' },
    { value: 'newest', label: 'Newest First' },
    { value: 'moq_asc', label: 'Min Qty: Low → High' },
];

const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-50 pb-6 last:border-0 last:pb-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-between w-full mb-4 group"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {title}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-300 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Products = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [schoolName, setSchoolName] = useState(null);

    // ── Filter states ──────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('default');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [onlyBulk, setOnlyBulk] = useState(false);
    const [onlyCustomizable, setOnlyCustomizable] = useState(false);
    const [onlySchoolsOnly, setOnlySchoolsOnly] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    // Read query params from URL (e.g. from Navbar search or category links)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const catId = params.get('category_id');
        const catName = params.get('category');
        const query = params.get('search');

        if (catId) {
            setSelectedCategory(parseInt(catId));
        } else if (catName) {
            setSelectedCategory(catName);
        }

        if (query) {
            setSearchTerm(query);
        }
    }, [location.search]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        setPageError('');
        const subdomain = getSubdomain();
        try {
            const config = {
                ...(subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {}),
            };
            const [prodRes, catRes] = await Promise.all([
                api.get('/products', config),
                api.get('/categories', config),
            ]);
            setProducts(prodRes.data.data || []);
            // categories API returns flat array (not paginated)
            const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data.data || []);
            setCategories(cats);
            if (subdomain) {
                setSchoolName(subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Institution');
            }
        } catch (err) {
            const subdomain = getSubdomain();
            setPageError(subdomain
                ? 'Access restricted. Please sign in to view products.'
                : 'Failed to load catalog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Computed filtered + sorted products ───────────────────
    const filteredProducts = useMemo(() => {
        let list = products.filter(p => {
            // Search
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            // Category - if a parent category is selected, also include its children
            const prodCatId = p.category?.id ?? p.category_id;
            const prodSubCatId = p.subcategory?.id ?? p.subcategory_id;

            if (selectedCategory !== 'All') {
                // Build set of matching category IDs (including all descendants)
                const matchIds = new Set([selectedCategory]);

                const addChildren = (catId) => {
                    const cat = categories.find(c => c.id === catId);
                    if (cat?.children) {
                        cat.children.forEach(child => {
                            matchIds.add(child.id);
                            addChildren(child.id);
                        });
                    }
                };
                addChildren(selectedCategory);

                // Match if product's category OR subcategory matches our target set
                if (!matchIds.has(prodCatId) && !matchIds.has(prodSubCatId)) {
                    return false;
                }
            }

            // Price range
            const price = parseFloat(p.pricing?.school_price || p.pricing?.original_price || p.base_price || 0);
            if (priceMin !== '' && price < parseFloat(priceMin)) return false;
            if (priceMax !== '' && price > parseFloat(priceMax)) return false;

            // Toggles
            if (onlyInStock && p.stock_quantity <= 0) return false;
            if (onlyBulk && (!p.min_quantity || p.min_quantity <= 1)) return false;
            if (onlyCustomizable && !p.customizable && !p.customization_flag) return false;
            if (onlySchoolsOnly && !p.for_schools_only) return false;

            return true;
        });

        // Sort
        switch (sortBy) {
            case 'price_asc':
                list = [...list].sort((a, b) => {
                    const pa = parseFloat(a.pricing?.school_price || a.pricing?.original_price || a.base_price || 0);
                    const pb = parseFloat(b.pricing?.school_price || b.pricing?.original_price || b.base_price || 0);
                    return pa - pb;
                });
                break;
            case 'price_desc':
                list = [...list].sort((a, b) => {
                    const pa = parseFloat(a.pricing?.school_price || a.pricing?.original_price || a.base_price || 0);
                    const pb = parseFloat(b.pricing?.school_price || b.pricing?.original_price || b.base_price || 0);
                    return pb - pa;
                });
                break;
            case 'name_asc':
                list = [...list].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name_desc':
                list = [...list].sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
                list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'moq_asc':
                list = [...list].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
                break;
            default:
                break;
        }
        return list;
    }, [products, searchTerm, selectedCategory, sortBy, priceMin, priceMax,
        onlyInStock, onlyBulk, onlyCustomizable, onlySchoolsOnly]);

    const activeFilterCount = [
        searchTerm !== '',
        selectedCategory !== 'All',
        priceMin !== '' || priceMax !== '',
        onlyInStock,
        onlyBulk,
        onlyCustomizable,
        onlySchoolsOnly,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setPriceMin('');
        setPriceMax('');
        setOnlyInStock(false);
        setOnlyBulk(false);
        setOnlyCustomizable(false);
        setOnlySchoolsOnly(false);
        setSortBy('default');
    };

    // ── Loading / Error states ─────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="flex flex-col items-center max-w-sm">
                <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-2 border-indigo-50 rounded-full scale-125" />
                    <div className="absolute inset-0 border-4 border-indigo-100/50 rounded-full" />
                    <Loader2 className="absolute inset-0 text-indigo-600 animate-spin" size={96} strokeWidth={1} />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <span className="text-lg font-black text-[#002B5B] uppercase tracking-[0.6em] font-mono translate-x-1">Loading</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Synchronizing With Institutional Reserves</span>
                </div>
            </div>
        </div>
    );

    if (pageError) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md text-center bg-white border border-slate-200 p-10 rounded-3xl shadow-lg">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
                <p className="text-slate-600 mb-8 text-sm leading-relaxed">{pageError}</p>
                <button onClick={fetchData}
                    className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 w-full">
                    <RefreshCw size={18} /> Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            {/* PROFESSIONAL HEADER SECTION */}
            <div className="bg-[#002B5B] pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-10" />
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Link to="/" className="hover:text-[#FFD700] transition-colors cursor-pointer">Home</Link>
                                <ChevronDown size={10} className="-rotate-90" />
                                <span className="text-[#FFD700]">Catalog</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                                {selectedCategory === 'All' ? 'Our Collection' : (
                                    categories.find(c => c.id === selectedCategory)?.name ||
                                    (typeof selectedCategory === 'string' ? selectedCategory : 'Category Products')
                                )}
                            </h1>
                            <p className="text-white/60 font-medium max-w-xl text-sm lg:text-base">
                                Explore our premium range of educational essentials, from custom uniforms to advanced digital solutions.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest block mb-0.5">Total Products</span>
                                <span className="text-xl font-bold text-white tracking-tight">{filteredProducts.length} <span className="text-xs font-medium text-white/40 ml-1">Items</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* ── SIDEBAR FILTERS ── */}
                    <aside className="lg:w-72 shrink-0">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                            className="lg:hidden w-full flex items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 shadow-sm mb-6"
                        >
                            <Filter size={18} /> {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>

                        <div className={`lg:block ${isMobileFiltersOpen ? 'block' : 'hidden'}`}>
                            <div className="sticky top-28 space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">

                                {/* Search */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Products</span>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Keyword..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Categories */}
                                <FilterSection title="Categories">
                                    <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => setSelectedCategory('All')}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'All' ? 'bg-[#002B5B] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <span>All Products</span>
                                            {selectedCategory === 'All' && <Sparkles size={12} className="text-[#FFD700]" />}
                                        </button>
                                        {categories.map(cat => (
                                            <div key={cat.id} className="space-y-1">
                                                <button
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat.id ? 'bg-[#002B5B] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                                                >
                                                    <span className="truncate">{cat.name}</span>
                                                    {selectedCategory === cat.id && <CheckSquare size={12} className="text-[#FFD700]" />}
                                                </button>

                                                {/* Subcategories */}
                                                {(selectedCategory === cat.id || cat.children?.some(s => s.id === selectedCategory)) && cat.children?.length > 0 && (
                                                    <div className="ml-4 pl-4 border-l-2 border-slate-100 py-1 space-y-1">
                                                        {cat.children.map(sub => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => setSelectedCategory(sub.id)}
                                                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${selectedCategory === sub.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                                            >
                                                                <span className="truncate">{sub.name}</span>
                                                                {selectedCategory === sub.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </FilterSection>

                                {/* Price Filter */}
                                <FilterSection title="Budget Range">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Min (₹)</span>
                                            <input
                                                type="number" placeholder="0"
                                                value={priceMin}
                                                onChange={e => setPriceMin(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Max (₹)</span>
                                            <input
                                                type="number" placeholder="5000+"
                                                value={priceMax}
                                                onChange={e => setPriceMax(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </FilterSection>

                                {/* Badges/Toggles */}
                                <FilterSection title="Preferences">
                                    <div className="space-y-2">
                                        {[
                                            { label: 'In Stock', val: onlyInStock, set: setOnlyInStock, icon: PackageX },
                                            { label: 'Bulk Only', val: onlyBulk, set: setOnlyBulk, icon: Tag },
                                            { label: 'Customizable', val: onlyCustomizable, set: setOnlyCustomizable, icon: Sparkles },
                                            { label: 'Institutional', val: onlySchoolsOnly, set: setOnlySchoolsOnly, icon: AlertCircle },
                                        ].map(({ label, val, set, icon: Icon }) => (
                                            <button
                                                key={label}
                                                onClick={() => set(!val)}
                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${val
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon size={14} className={val ? 'text-emerald-600' : 'text-slate-300'} />
                                                    {label}
                                                </div>
                                                {val ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <button
                                    onClick={clearFilters}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-colors border-t border-slate-50 pt-5 mt-2"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* ── PRODUCT GRID AREA ── */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar: count + sort */}
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                                Displaying <span className="text-slate-900 font-black px-1.5 py-0.5 bg-slate-100 rounded-md mx-1">{filteredProducts.length}</span> Results
                            </h3>

                            {/* Sort dropdown */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Sort By</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setSortOpen(!sortOpen)}
                                        className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#002B5B] hover:border-indigo-500 transition-all shadow-sm"
                                    >
                                        <SlidersHorizontal size={14} />
                                        {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${sortOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {sortOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden p-2"
                                            >
                                                {SORT_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                                                        className={`flex items-center justify-between w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${sortBy === opt.value
                                                            ? 'bg-[#002B5B] text-white'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#002B5B]'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                        {sortBy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Grid - Denser for "Medium Cards" */}
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                <div className="w-24 h-24 mb-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                    <PackageX size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">No Items Matched</h3>
                                <p className="text-slate-500 text-sm max-w-sm font-medium">Try broadening your search criteria or resetting filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map(product => (
                                        <motion.div
                                            layout
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer schoolName={schoolName} />
        </div>
    );
};

export default Products;
