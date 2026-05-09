import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, ExternalLink, Search, School, MapPin } from 'lucide-react';

const Schools = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const res = await api.get('/homepage/partners');
                setSchools(res.data.data || res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchools();
    }, []);

    const filteredSchools = schools.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSchoolUrl = (subdomain) => {
        if (!subdomain) return '#';
        const { protocol, hostname, port } = window.location;
        const proto = protocol + '//';
        
        // Handle localhost testing
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${proto}${subdomain}.localhost${port ? `:${port}` : ''}`;
        }
        
        // Handle production/staging domains
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            // Keep the last two parts for the base domain (e.g., mysite.com)
            const baseDomain = parts.slice(-2).join('.');
            return `${proto}${subdomain}.${baseDomain}${port ? `:${port}` : ''}`;
        }
        
        return `${proto}${subdomain}.${hostname}${port ? `:${port}` : ''}`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            
            <header className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-slate-100">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6 shadow-sm">
                            <School size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Established Partnerships</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight mb-6 uppercase tracking-tight">Our Partner <span className="text-indigo-600">Schools.</span></h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">Access exclusive institutional catalogs curated specifically for each campus through our secure e-commerce portals.</p>
                        
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search by school name or location..."
                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 animate-pulse h-64" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSchools.map((school, idx) => (
                            <motion.div
                                key={school.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white rounded-3xl border border-slate-100 hover:border-indigo-500 transition-all duration-500 shadow-sm hover:shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="p-8 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 duration-500">
                                            {school.logo ? (
                                                <img src={school.logo} alt={school.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <GraduationCap size={40} className="text-slate-200" />
                                            )}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Official Partner</div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{school.name}</h3>
                                    
                                    {school.address && (
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-6 font-medium">
                                            <MapPin size={12} />
                                            <span className="truncate">{school.address}</span>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                                            <span className="text-xs font-bold text-slate-900">Online Store Active</span>
                                        </div>
                                        <a 
                                            href={getSchoolUrl(school.subdomain)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-100"
                                        >
                                            Visit <ArrowRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                
                {!loading && filteredSchools.length === 0 && (
                    <div className="py-32 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                        <School className="text-slate-200 mx-auto mb-6" size={64} />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Matching Schools Found</h3>
                        <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Try searching for a different name or browse the entire list.</p>
                        <button onClick={() => setSearchTerm('')} className="mt-8 px-6 py-3 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-colors">Clear Search</button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Schools;
