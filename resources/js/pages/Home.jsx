import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import { useAuth } from '../store/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, ShieldCheck, Truck, Star, ArrowRight, Package, Lock,
    ChevronRight, Zap, CheckCircle2, GraduationCap, ChevronLeft,
    Headphones, Award, Percent, Users, Building2, Layers, Search,
    BookOpen, Shirt, Pencil, Activity, Briefcase, Footprints,
    Store, Settings, LineChart, Cpu, BarChart3, Clock,
    PenTool, Armchair, Laptop, Beaker, Image as ImageIcon
} from 'lucide-react';
import TestimonialsSection from '../components/TestimonialsSection';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../utils/constants';

// ─── HERO CAROUSEL COMPONENT ─────────────────────────────────
const HeroCarousel = ({ subdomain, schoolName, banners = [] }) => {
    // If we have dynamic banners, use them. Otherwise use fallback slides.
    const slides = banners.length > 0 ? banners.map(b => ({
        title: b.title,
        subtitle: b.subtitle,
        image: b.image,
        badges: b.badges || [],
        stats: b.stats || "",
        buttonText: b.button_text,
        buttonLink: b.button_link
    })) : [
        {
            title: subdomain ? `Premium Essentials` : "India’s First Wholesale-to-School Ecosystem",
            subtitle: subdomain ? "High-quality uniforms and kits delivered directly to your home." : "Helping schools build zero-cost stores with premium curated products.",
            image: "https://images.unsplash.com/photo-1577891720246-8691693f83f8?auto=format&fit=crop&q=80&w=2000",
            badges: ["Direct to Home", "Best Quality"],
            stats: "Trusted by Schools"
        }
    ];

    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <section className="relative h-[500px] lg:h-[650px] overflow-hidden bg-slate-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <img
                        src={slides[current].image}
                        alt=""
                        className="w-full h-full object-cover opacity-100"
                    />

                    <div className="absolute inset-0 z-20 flex items-center">
                        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="max-w-2xl"
                            >
                                {false && /* Removed text overlay to allow for pure image showcase */ (
                                    <div className="bg-slate-900/40 backdrop-blur-md p-8 lg:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
                                        <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1] uppercase tracking-tighter break-words">
                                            {slides[current].title}
                                        </h1>
                                        <p className="text-lg lg:text-xl text-white/90 mb-10 font-medium leading-relaxed max-w-lg">
                                            {slides[current].subtitle}
                                        </p>

                                        <div className="flex items-center gap-6">
                                            {(slides[current].buttonText || !banners.length) && (
                                                <Link
                                                    to={slides[current].buttonLink || "/products"}
                                                    className="inline-flex items-center gap-2 bg-[#FFD700] text-[#002B5B] px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:-translate-y-1"
                                                >
                                                    {slides[current].buttonText || "Shop Now"} <ArrowRight size={18} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-12 h-1.5 rounded-full transition-all ${i === current ? 'bg-[#FFD700]' : 'bg-white/30 hover:bg-white/60'}`}
                    />
                ))}
            </div>
        </section>
    );
};

const CategoryGrid = ({ categories }) => {
    const pastelColors = [
        'bg-indigo-50/50', 'bg-rose-50/50', 'bg-amber-50/50', 'bg-emerald-50/50',
        'bg-sky-50/50', 'bg-violet-50/50', 'bg-orange-50/50', 'bg-teal-50/50'
    ];

    if (!categories || categories.length === 0) return null;

    return (
        <section className="py-24 md:py-32 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between gap-8 mb-16">
                    <div className="flex flex-col">
                        <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2 font-mono">Explore Collection</span>
                        <h2 className="text-2xl lg:text-3xl font-black text-[#002B5B] uppercase tracking-tighter shrink-0">
                            Shop by Category
                        </h2>
                    </div>
                    <div className="h-px bg-slate-100 flex-1 hidden sm:block" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
                    {categories.slice(0, 12).map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/products?category_id=${cat.id}`}
                            className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-700 bg-slate-900 border border-transparent hover:border-white/20"
                        >
                             {/* Background Image */}
                            {cat.image_url ? (
                                <img 
                                    src={cat.image_url} 
                                    alt={cat.name} 
                                    className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-1000 opacity-100" 
                                />
                            ) : (
                                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <ImageIcon size={48} strokeWidth={1} className="text-slate-600" />
                                </div>
                            )}

                            {/* Category Name Styled as Badge */}
                            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-center">
                                <span className="bg-[#FFD700] text-[#002B5B] px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500 whitespace-nowrap">
                                    {cat.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ProductSection = ({ title, categoryId, products, index }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className={`py-24 md:py-32 ${index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'} border-t border-slate-100`}>
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between gap-8 mb-16">
                    <div className="flex flex-col">
                        <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-2 font-mono">Curated Collection</span>
                        <h2 className="text-3xl lg:text-4xl font-black text-[#002B5B] uppercase tracking-tighter">{title}</h2>
                    </div>
                    <Link
                        to={`/products?category_id=${categoryId}`}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-[#002B5B] border border-slate-200 rounded-full font-bold text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm group"
                    >
                        View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                    {products.slice(0, 4).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── MAIN HOME COMPONENT ─────────────────────────────────────
const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banners, setBanners] = useState([]);
    const [categories, setCategories] = useState([]);
    const [majorCategories, setMajorCategories] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState({});
    const [partnerSchools, setPartnerSchools] = useState([]);
    const isSubdomain = !!getSubdomain();

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const subdomain = getSubdomain();

            try {
                const config = subdomain ? { headers: { 'X-Test-Subdomain': subdomain } } : {};
                
                // 1. Fetch CORE data in parallel
                const [prodRes, bannerRes, catRes, schoolResData] = await Promise.all([
                    api.get(`/products`, config),
                    api.get('/homepage/banners').catch(() => ({ data: [] })),
                    api.get('/categories', config),
                    subdomain ? api.get('/school/info', config).catch(() => null) : Promise.resolve(null)
                ]);

                // Set primary data
                setProducts(prodRes.data.data ? prodRes.data.data.slice(0, 8) : []);
                const fetchedCats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []);
                setCategories(fetchedCats);
                
                let allBanners = bannerRes.data?.data || bannerRes.data || [];
                if (schoolResData?.data) {
                    setSchool(schoolResData.data);
                    if (schoolResData.data.school_banner) {
                        allBanners = [
                            {
                                image: schoolResData.data.school_banner,
                                title: "Premium Essentials",
                                subtitle: "Official Premium Catalog",
                                button_text: 'Shop Now',
                                button_link: '/products',
                                is_external: true
                            },
                            ...allBanners
                        ];
                    }
                }
                setBanners(allBanners);

                // 2. Determine major categories and fetch their products in parallel
                const sortedCats = [...fetchedCats].sort((a, b) => {
                    const priorities = ['uniform', 'stationary', 'stationery', 'book', 'kit'];
                    const aName = a.name.toLowerCase();
                    const bName = b.name.toLowerCase();
                    const aIndex = priorities.findIndex(p => aName.includes(p));
                    const bIndex = priorities.findIndex(p => bName.includes(p));
                    if (aIndex !== -1 && bIndex === -1) return -1;
                    if (bIndex !== -1 && aIndex === -1) return 1;
                    return (aIndex !== -1 && bIndex !== -1) ? aIndex - bIndex : 0;
                }).slice(0, 6);

                setMajorCategories(sortedCats);

                // Fetch products for each major category IN PARALLEL
                const catProdPromises = sortedCats.map(cat => 
                    api.get(`/products?category_id=${cat.id}`, config)
                       .then(res => ({ id: cat.id, data: res.data.data ? res.data.data.slice(0, 4) : (Array.isArray(res.data) ? res.data.slice(0, 4) : []) }))
                       .catch(() => ({ id: cat.id, data: [] }))
                );

                const catProdResults = await Promise.all(catProdPromises);
                const catProdMap = {};
                catProdResults.forEach(res => {
                    catProdMap[res.id] = res.data;
                });
                setCategoryProducts(catProdMap);

            } catch (err) {
                if (subdomain) {
                    setError('Authentication required to access local catalog.');
                } else {
                    console.error('Failed to load catalog', err);
                    setProducts([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // Fetch partner schools for the marquee (main domain only)
    useEffect(() => {
        if (!isSubdomain) {
            const fetchPartnerSchools = async () => {
                try {
                    const res = await api.get('/homepage/partners');
                    setPartnerSchools(res.data || []);
                } catch (e) {
                    setPartnerSchools([]);
                }
            };
            fetchPartnerSchools();
        }
    }, [isSubdomain]);

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="flex flex-col items-center max-w-sm">
                <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-2 border-indigo-50 rounded-full scale-125" />
                    <div className="absolute inset-0 border-4 border-indigo-100/50 rounded-full" />
                    <Loader2 className="absolute inset-0 text-indigo-600 animate-spin" size={96} strokeWidth={1} />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <span className="text-lg font-black text-[#002B5B] uppercase tracking-[0.6em] font-mono translate-x-1">Loading</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Optimizing Your Premium Experience</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden">
            <Navbar schoolName={school?.name || APP_NAME} schoolInfo={school} />

            {/* HERO — Dynamic Carousel or Fallback */}
            {banners.length > 0 ? (
                <div className="pt-[64px]">
                    <HeroCarousel subdomain={isSubdomain} schoolName={school?.name || APP_NAME} banners={banners} />
                </div>
            ) : (
                <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white border-b border-slate-200">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-4xl mx-auto flex flex-col items-center"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                                    {isSubdomain ? `Notice` : 'Premium Institutional Supply'}
                                </span>
                            </div>

                            <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
                                {isSubdomain ? (
                                    <>Shop Your <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">School Essentials.</span></>
                                ) : (
                                    <>Streamline Your <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Campus Procurement.</span></>
                                )}
                            </h1>

                            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-medium leading-relaxed mb-10">
                                {isSubdomain
                                    ? `The official portal for high-quality uniforms, academic books, and customized school gear.`
                                    : 'Premium B2B procurement solutions and verifiable logistics for educational institutions. Quality guaranteed.'}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                                <Link
                                    to="/products"
                                    className={`w-full sm:w-auto px-8 py-4 ${isSubdomain ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm`}
                                >
                                    {isSubdomain ? 'Start Shopping' : 'Browse Catalog'} <ArrowRight size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </header>
            )}

            {/* SHOP BY CATEGORY */}
            <CategoryGrid categories={categories} />

            {/* PRODUCT SECTIONS BY CATEGORY */}
            {majorCategories.map((cat, idx) => (
                <ProductSection
                    key={cat.id}
                    title={cat.name}
                    categoryId={cat.id}
                    products={categoryProducts[cat.id] || []}
                    index={idx}
                />
            ))}

            {/* HOW IT WORKS — ONLY ON MAIN DOMAIN */}
            {!isSubdomain && (
                <section className="py-32 bg-slate-900 text-white relative overflow-hidden" id="how-it-works">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-20" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center mb-24">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
                                <Cpu size={12} className="text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Seamless Process</span>
                            </div>
                            <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
                                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Works.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                                A streamlined ecosystem bridging the gap between premium manufacturers and educational institutions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connector Line */}
                            <div className="hidden md:block absolute top-[50px] left-10 right-10 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-emerald-500/0 z-0" />

                            {[
                                { step: '01', title: 'Connect & Customize', desc: 'Schools register and select their uniform designs, book lists, and required inventory standards from our verified suppliers.', icon: Settings, color: 'indigo' },
                                { step: '02', title: 'Dedicated Storefront', desc: 'We auto-generate a custom-branded e-commerce portal for your school, completely free of charge.', icon: Store, color: 'sky' },
                                { step: '03', title: 'Seamless Fulfillment', desc: 'Parents order directly. Suppliers fulfill immediately. Schools track commissions via live dashboards.', icon: Truck, color: 'emerald' }
                            ].map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="relative z-10 flex flex-col items-center text-center p-6"
                                >
                                    <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 shadow-xl shadow-black/50 flex items-center justify-center mb-8 relative group">
                                        <div className={`absolute inset-0 rounded-full bg-${step.color}-500 opacity-0 group-hover:opacity-20 transition-opacity blur-xl`} />
                                        <step.icon size={36} className={`text-${step.color}-400 group-hover:scale-110 transition-transform`} />
                                        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-slate-700 text-white font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-sm">
                                            {step.step}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                    <p className="text-slate-400 text-base leading-relaxed">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {!isSubdomain && <TestimonialsSection />}
            <Footer schoolName={school?.name} schoolInfo={school} />
        </div>
    );
};

export default Home;
