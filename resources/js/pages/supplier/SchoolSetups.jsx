import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Loader2, Search, Building2, Globe, MapPin, ChevronRight, GraduationCap
} from 'lucide-react';
import { APP_DOMAIN } from '../../utils/constants';

const SchoolSetups = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await api.get('/supplier/school-setups');
                setSchools(response.data || []);
            } catch (err) {
                console.error("Failed to fetch school setups", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchools();
    }, []);

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Partner Schools</h1>
                    <p className="text-sm text-slate-500 mt-1">Schools currently utilizing your catalog.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search schools..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="animate-spin mb-3 text-indigo-600" size={28} />
                            Loading schools...
                        </div>
                    ) : filteredSchools.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Building2 className="text-slate-300 mb-3" size={40} />
                            <h3 className="text-base font-medium text-slate-900 mb-1">No Schools Found</h3>
                            <p className="text-sm text-slate-500">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSchools.map((school) => (
                                <div key={school.id} className="bg-white border text-left border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                            {school.logo ? (
                                                <img 
                                                    src={school.logo.startsWith('http') ? school.logo : `/storage/${school.logo.replace(/^\//, '')}`} 
                                                    alt={school.name} 
                                                    className="w-full h-full object-contain" 
                                                />
                                            ) : (
                                                <Building2 className="text-slate-400" size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-slate-900 truncate">{school.name}</h3>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                                <Globe size={14} className="text-slate-400" />
                                                <span className="truncate">{school.subdomain}.{APP_DOMAIN}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${school.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {school.status || 'Active'}
                                        </span>
                                        <button
                                            onClick={() => navigate(`/supplier/school/${school.id}/catalog`)}
                                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                                        >
                                            View Catalog <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolSetups;
