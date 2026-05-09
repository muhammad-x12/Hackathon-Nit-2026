import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { School, Plus, Search, Edit, Trash2, Loader2, Phone, Mail, ExternalLink } from 'lucide-react';
import { APP_DOMAIN } from '../../utils/constants';

const SchoolManagement = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/schools');
            setSchools(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch schools', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSchools(); }, []);

    const toggleStatus = async (id) => {
        try {
            await api.patch(`/admin/school/${id}/status`);
            fetchSchools();
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDeleteSchool = async (id) => {
        if (window.confirm('Are you sure you want to delete this school?')) {
            try {
                await api.delete(`/admin/school/${id}`);
                fetchSchools();
            } catch (error) {
                console.error('Failed to delete school', error);
                alert(error.response?.data?.message || 'Failed to delete school');
            }
        }
    };

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const parseContact = (info) => {
        try {
            return typeof info === 'string' ? JSON.parse(info || '{}') : (info || {});
        } catch { return {}; }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">School Management</h1>
                    <p className="text-sm text-slate-500 mt-1">{schools.length} schools registered</p>
                </div>
                <button
                    onClick={() => navigate('/admin/schools/add')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Add School
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or subdomain..."
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">School</th>
                                <th className="px-6 py-3">Subdomain</th>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={28} />
                                        <p className="text-sm text-slate-400 mt-2">Loading schools...</p>
                                    </td>
                                </tr>
                            ) : filteredSchools.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                                        <School size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No schools found</p>
                                    </td>
                                </tr>
                            ) : filteredSchools.map((school) => {
                                const contact = parseContact(school.contact_info);
                                return (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                                    {school.logo ? (
                                                        <img 
                                                            src={school.logo.startsWith('http') ? school.logo : `/storage/${school.logo.replace(/^\//, '')}`} 
                                                            alt="" 
                                                            className="w-full h-full object-cover p-1" 
                                                        />
                                                    ) : (
                                                        <School size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{school.name}</span>
                                                    {school.abbreviation && (
                                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{school.abbreviation}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={`https://${school.subdomain}.${APP_DOMAIN}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                            >
                                                {school.subdomain}.{APP_DOMAIN}
                                                <ExternalLink size={12} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {contact.email && <p className="flex items-center gap-1.5 text-slate-600"><Mail size={12} /> {contact.email}</p>}
                                                {contact.phone && <p className="flex items-center gap-1.5 text-slate-500 mt-0.5"><Phone size={12} /> {contact.phone}</p>}
                                                {!contact.email && !contact.phone && <span className="text-slate-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(school.id)}
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer
                                                    ${school.status === 'active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {school.status === 'active' ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/schools/edit/${school.id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchool(school.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SchoolManagement;
