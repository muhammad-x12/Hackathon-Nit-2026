import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, ArrowLeft, Zap, Sparkles, Star, Heart, GraduationCap, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import { APP_NAME } from '../utils/constants';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        const fetchSchoolInfo = async () => {
            const subdomain = getSubdomain();
            if (subdomain) {
                try {
                    const config = { headers: { 'X-Test-Subdomain': subdomain } };
                    const res = await api.get('/school/info', config);
                    if (res.data) {
                        setSchoolInfo(res.data);
                    }
                } catch (e) {
                    console.error('Failed to fetch school info', e);
                }
            }
        };
        fetchSchoolInfo();
    }, []);

    const displayName = schoolInfo?.name || APP_NAME;
    const themeColor = schoolInfo?.theme_color || '#4f46e5';
    const displayLogo = schoolInfo?.logo;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // Use window.location.href for dashboard entries to ensure a fresh, clean state
            // This prevents race conditions in AuthContext during role-based navigation
            if (result.role === 'super_admin') window.location.href = '/admin';
            else if (result.role === 'school') window.location.href = '/school';
            else if (result.role === 'supplier') window.location.href = '/supplier';
            else navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 selection:bg-indigo-500 selection:text-white overflow-hidden">
            {/* Left Panel - Vibrant Student Theme */}
            <div
                className="hidden md:flex md:w-[45%] lg:w-[40%] relative overflow-hidden group"
                style={{ backgroundColor: themeColor }}
            >
                {/* Sprinkles / Blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-white/10 rounded-full blur-[80px] group-hover:bg-white/20 transition-all duration-1000 rotate-12"></div>
                <div className="absolute bottom-[5%] left-[-10%] w-[50%] h-[30%] bg-pink-400/20 rounded-full blur-[60px] group-hover:bg-pink-400/30 transition-all duration-1000"></div>

                <div className="relative z-10 w-full h-full p-16 lg:p-20 flex flex-col justify-between items-start text-white">
                    <Link to="/" className="flex items-center gap-4 group/logo">
                        {displayLogo ? (
                            <img src={displayLogo} alt={displayName} className="h-14 object-contain group-hover/logo:scale-110 transition-all group-hover/logo:rotate-6 bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/30" />
                        ) : (
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/30 group-hover/logo:scale-110 transition-all group-hover/logo:rotate-6">
                                <GraduationCap size={28} className="text-white fill-white/20" />
                            </div>
                        )}
                        <div>
                            <span className="text-3xl font-black text-white uppercase tracking-tighter block leading-none drop-shadow-md">{displayName}</span>
                        </div>
                    </Link>

                    <div className="space-y-4">
                        <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase drop-shadow-2xl">
                            Welcome <br />
                            <span className="underline decoration-white/20">Back!</span>
                        </h2>
                        <p className="text-white/80 font-bold max-w-sm text-xl leading-relaxed">
                            {schoolInfo ? `Access the official store for ${displayName}.` : 'Ready to gear up for your next big adventure? Log in to your magical dashboard.'}
                        </p>
                    </div>

                    <div />
                </div>

                {/* Decorative Shapes */}
                <div className="absolute top-[20%] right-[10%] opacity-20 group-hover:rotate-45 transition-transform duration-1000">
                    <Star size={100} className="text-white" />
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-20 bg-slate-50 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-200/50 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/50 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                    className="w-full max-w-md relative z-10 bg-white p-10 md:p-14 rounded-[3.5rem] border-4 border-white shadow-2xl shadow-indigo-100/50"
                >
                    <div className="space-y-4 mb-12">
                        <Link to="/" className="md:hidden flex items-center gap-4 mb-8">
                            {displayLogo ? (
                                <img src={displayLogo} alt={displayName} className="h-12 object-contain bg-slate-50 p-2 rounded-xl" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{ backgroundColor: themeColor }}>
                                    <GraduationCap size={24} className="fill-white/20" />
                                </div>
                            )}
                            <span className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{displayName}</span>
                        </Link>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Log In <span style={{ color: themeColor }}>.</span></h3>
                        <p className="text-slate-500 font-bold text-sm">Please enter your credentials to access your account.</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 mb-8 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-black uppercase tracking-widest leading-none shadow-sm"
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Email Address</label>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within/input:bg-slate-100 transition-all border border-slate-100">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-18 pr-6 text-slate-800 font-black placeholder:text-slate-300 focus:outline-none transition-all text-sm"
                                    style={{ '--tw-ring-color': themeColor + '20' }}
                                    placeholder="your-name@school.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center pr-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Password</label>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within/input:bg-slate-100 transition-all border border-slate-100">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-18 pr-6 text-slate-800 font-black placeholder:text-slate-300 focus:outline-none transition-all text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: themeColor }}
                            className="w-full text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            {loading ? (
                                <span className="relative z-10 flex items-center gap-2">
                                    <RefreshCw className="animate-spin" size={18} />
                                    Logging in...
                                </span>
                            ) : (
                                <>
                                    <span className="relative z-10">Login Now</span>
                                    <LogIn size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="pt-10 mt-10 border-t-4 border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center sm:text-left">
                            New Here? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 transition-colors ml-2">Register Now</Link>
                        </p>
                        <Link to="/" className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                            <ArrowLeft size={14} />
                            Go Back
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
