import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, Zap, Sparkles, BookOpen, GraduationCap, Gift, School, Truck, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSubdomain, isMainDomain } from '../utils/subdomain';
import { APP_NAME, APP_DOMAIN } from '../utils/constants';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        referral_code: '',
        role: 'customer', // customer, school, supplier
        school_name: '',
        abbreviation: '',
        subdomain: '',
        school_id: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [schools, setSchools] = useState([]);

    React.useEffect(() => {
        const fetchSchoolInfo = async () => {
            const subdomain = getSubdomain();
            if (subdomain) {
                try {
                    const config = { headers: { 'X-Test-Subdomain': subdomain } };
                    const res = await api.get('/school/info', config);
                    if (res.data) {
                        setSchoolInfo(res.data);
                        setFormData(prev => ({ ...prev, school_id: res.data.id }));
                    }
                } catch (e) {
                    console.error('Failed to fetch school info', e);
                }
            } else {
                // Fetch all schools for the dropdown if on main domain
                try {
                    const res = await api.get('/homepage/partners');
                    setSchools(res.data);
                } catch (e) {
                    console.error('Failed to fetch schools', e);
                }
            }
        };
        fetchSchoolInfo();
    }, []);

    const displayName = schoolInfo?.name || APP_NAME;
    const themeColor = schoolInfo?.theme_color || '#4f46e5';
    const displayLogo = schoolInfo?.logo;

    const handleRoleChange = (role) => {
        setFormData(prev => ({
            ...prev,
            role,
            school_name: '',
            abbreviation: '',
            subdomain: ''
        }));
    };

    const handleSchoolNameChange = (e) => {
        const name = e.target.value;
        const sub = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
        setFormData(prev => ({ ...prev, school_name: name, subdomain: sub }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            navigate('/login');
        } catch (error) {
            let errorMsg = 'Registration failed';
            const resData = error.response?.data;
            if (resData?.errors && typeof resData.errors === 'object') {
                const keys = Object.keys(resData.errors);
                if (keys.length > 0) {
                    const firstError = resData.errors[keys[0]];
                    errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
                } else if (resData.message) {
                    errorMsg = resData.message;
                }
            } else if (resData?.message) {
                errorMsg = resData.message;
            } else if (error.message) {
                errorMsg = error.message;
            }
            setError(String(errorMsg));
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-indigo-500 selection:text-white">
            {/* Left Panel - Premium Brand Theme */}
            <div
                className="hidden md:flex md:w-[40%] lg:w-[35%] relative overflow-hidden shrink-0"
                style={{ backgroundColor: schoolInfo ? themeColor : '#0f172a' }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:40px_40px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-[130px] opacity-20 translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-16 text-white">
                    <Link to="/" className="flex items-center gap-4 group">
                        {displayLogo ? (
                            <img src={displayLogo} alt={displayName} className="h-12 object-contain bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/30" />
                        ) : (
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 transform group-hover:rotate-12 transition-transform">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                        )}
                        <span className="text-xl font-black text-white uppercase tracking-tighter">{displayName}</span>
                    </Link>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                                <Sparkles size={12} /> Join our community
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase">
                                Level <span className="italic opacity-80">Up.</span>
                            </h2>
                            <p className="text-white/60 font-medium text-lg leading-relaxed max-w-xs">
                                {schoolInfo ? `Create your official student account for ${displayName}.` : 'Access all study gear and institutional benefits with a single account.'}
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {[
                                { icon: BookOpen, label: 'Access All Study Gear', color: 'text-white/80' },
                                { icon: ShieldCheck, label: 'Institutional Benefits', color: 'text-white/80' },
                                { icon: Zap, label: 'Fast Enrollment', color: 'text-white/80' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className={`w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-white/80 uppercase tracking-widest">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                        &copy; {new Date().getFullYear()} {displayName}. {schoolInfo ? 'Official Store' : 'Modernizing Education.'}
                    </p>
                </div>
            </div>

            {/* Right Panel: Registration Form */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 lg:px-20 overflow-y-auto bg-slate-50/50">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-xl"
                    >
                        <div className="bg-white rounded-[3rem] p-10 lg:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100 border-b-8 shadow-indigo-100/30" style={{ borderBottomColor: themeColor }}>
                            <div className="mb-12">
                                <Link to="/" className="md:hidden flex items-center gap-3 mb-10">
                                    {displayLogo ? (
                                        <img src={displayLogo} alt={displayName} className="h-10 object-contain bg-slate-50 p-2 rounded-xl" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                                            <GraduationCap size={20} />
                                        </div>
                                    )}
                                    <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">{displayName}</span>
                                </Link>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Enroll <span style={{ color: themeColor }}>Now.</span></h3>
                                <p className="text-slate-500 font-medium text-sm">Create your institutional account to start shopping.</p>

                                {/* Role Selection */}
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mt-8">
                                    {[
                                        { id: 'customer', label: 'Student', icon: <User size={14} /> },
                                        { id: 'school', label: 'School', icon: <School size={14} /> },
                                        { id: 'supplier', label: 'Supplier', icon: <Truck size={14} /> },
                                    ].map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => handleRoleChange(r.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r.id
                                                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 border border-indigo-50'
                                                : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                        >
                                            {r.icon} {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-5 mb-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">
                                        {formData.role === 'customer' ? 'Full Legal Name' : 'Administrator Name'}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                            placeholder={formData.role === 'customer' ? "Jane Doe" : "John Smith"}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {formData.role === 'school' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">School Full Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                                    placeholder="St. Edwards Int."
                                                    value={formData.school_name}
                                                    onChange={handleSchoolNameChange}
                                                    required={formData.role === 'school'}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Short Name / Abbr.</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                                    placeholder="e.g. SEI"
                                                    value={formData.abbreviation}
                                                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                                                    required={formData.role === 'school'}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Subdomain URL / Handle</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-32 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                                    placeholder="schoolhandle"
                                                    value={formData.subdomain}
                                                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                                    required={formData.role === 'school'}
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">.{APP_DOMAIN}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.role === 'supplier' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Company / Business Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                            placeholder="Reliable Supplies Ltd."
                                            value={formData.school_name}
                                            onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                            required={formData.role === 'supplier'}
                                        />
                                    </div>
                                )}

                                {formData.role === 'customer' && !schoolInfo && schools.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Select Your Institution</label>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm appearance-none cursor-pointer"
                                                value={formData.school_id}
                                                onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Click to Select Your School --</option>
                                                {schools.map(school => (
                                                    <option key={school.id} value={school.id}>
                                                        {school.name}
                                                     </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <School size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                        placeholder="admin@institution.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Secure Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-2">Confirm Key</label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm"
                                            placeholder="••••••••"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full text-white font-black py-5 rounded-2xl shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 mt-4 h-16"
                                    style={{ backgroundColor: themeColor, boxShadow: `0 20px 40px ${themeColor}20` }}
                                >
                                    {loading ? 'Finalizing Profile...' : 'Create Account Now'}
                                    {!loading && <ArrowRight size={18} />}
                                </motion.button>
                            </form>
                        </div>

                        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-10">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                Registered? <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors ml-2">Auth Portal</Link>
                            </p>
                            <Link to="/" className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors">
                                Return to Main Station
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;
