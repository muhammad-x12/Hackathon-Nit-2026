import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import api from '../services/api';

const Contact = () => {
    const [platformSettings, setPlatformSettings] = useState({
        platform_email: 'contact@myschoolbranding.in',
        platform_phone: '+91-XXXXXXXXXX',
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const fetchPlatformSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data) setPlatformSettings(prev => ({ ...prev, ...res.data }));
            } catch (e) {
                console.error('Failed to fetch platform settings', e);
            }
        };
        fetchPlatformSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock successful submission
        setStatus({ type: 'success', message: 'Thank you for reaching out! Our team will get back to you shortly.' });
        setFormData({ name: '', email: '', subject: '', message: '' });

        // Hide success message after 5 seconds
        setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden flex flex-col">
            <Navbar />

            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                        <MessageSquare size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">We respond within 24 hours</span>
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6"
                    >
                        Get in Touch
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto"
                    >
                        Whether you're a school looking to set up your store or a supplier wanting to partner with us, we'd love to hear from you.
                    </motion.p>
                </div>
            </header>

            <main className="flex-1 py-16 px-6 relative z-20 -mt-10 lg:-mt-24 mb-16">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Information Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
                                <Mail className="text-indigo-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Email Us</h3>
                            <p className="text-slate-500 mb-4 font-medium">For general queries and support</p>
                            <a href={`mailto:${platformSettings.platform_email}`} className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors text-lg">
                                {platformSettings.platform_email}
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50"
                        >
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                                <Phone className="text-emerald-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Call Us</h3>
                            <p className="text-slate-500 mb-4 font-medium">Mon-Sat from 9am to 6pm</p>
                            <a href={`tel:${platformSettings.platform_phone}`} className="text-slate-900 font-bold hover:text-indigo-600 transition-colors text-lg">
                                {platformSettings.platform_phone}
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50"
                        >
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                                <MapPin className="text-amber-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Visit Us</h3>
                            <p className="text-slate-500 mb-4 font-medium">Registered Office</p>
                            <p className="text-slate-900 font-bold leading-relaxed">
                                Delhi, India
                            </p>
                        </motion.div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-slate-200/50 h-full"
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a message</h2>

                            {status.message && (
                                <div className={`p-4 rounded-2xl mb-8 font-medium border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {status.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none"
                                        placeholder="Type your message here..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Send Message <Send size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
