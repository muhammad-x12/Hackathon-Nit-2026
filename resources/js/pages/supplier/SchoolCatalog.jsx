import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Search, Loader2, ArrowLeft, Box, ImageOff,
    ChevronRight, GraduationCap
} from 'lucide-react';

const SchoolCatalog = () => {
    const { schoolId } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                // Initial fetch to get the catalog products first
                const prodResponse = await api.get(`/supplier/school-catalog/${schoolId}`);
                setProducts(prodResponse.data || []);

                // Then fetch school info to get the name
                const schoolResponse = await api.get('/supplier/school-setups');
                const matched = schoolResponse.data?.find(s => s.id === parseInt(schoolId));
                setSchoolInfo(matched);
            } catch (err) {
                console.error("Failed to fetch school catalog", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCatalog();
    }, [schoolId]);

    const categories = ['all', ...new Set(products.map(p => p.category?.toLowerCase() || 'general'))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || p.category?.toLowerCase() === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/supplier/school-setups')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{schoolInfo?.name || 'School Catalog'}</h1>
                        <p className="text-sm text-slate-500 mt-1">Configured designs for this institutional store.</p>
                    </div>
                </div>
                <div className="flex bg-white px-4 py-2 rounded-xl border border-slate-200 items-center gap-2 shadow-sm shrink-0">
                    <GraduationCap size={18} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">{products.length} Designs</span>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search designs..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar items-center">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                        >
                            <span className="capitalize">{cat}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                    Loading school designs...
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <Box className="text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No Designs Found</h3>
                    <p className="text-sm text-slate-500 max-w-sm">This school hasn't customized any products matching your search yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((sp) => (
                        <div key={sp.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all flex flex-col">
                            <div className="aspect-square bg-slate-50 relative p-6 flex flex-col items-center justify-center border-b border-slate-100">
                                {sp.rendered_images?.[0] ? (
                                    <img src={sp.rendered_images[0]} alt={sp.name} className="w-full h-full object-contain" />
                                ) : (
                                    <ImageOff className="text-slate-300" size={32} />
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 shadow-sm capitalize">
                                        {sp.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3 line-clamp-2 min-h-[40px] leading-snug">{sp.name}</h3>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                                        <span className="text-slate-500">Batch Requirement</span>
                                        <span className="font-medium text-slate-900">{sp.required_qty || 1} Units</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/supplier/school-setup/${sp.id}`)}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        View Configuration <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SchoolCatalog;
