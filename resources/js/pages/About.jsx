import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Users, Zap, Building, GraduationCap } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const About = () => {
    const stats = [
        { label: "Partner Schools", value: "50+", icon: <Building size={24} className="text-indigo-600" /> },
        { label: "Active Suppliers", value: "120+", icon: <Users size={24} className="text-indigo-600" /> },
        { label: "Products Delivered", value: "1M+", icon: <Zap size={24} className="text-indigo-600" /> },
        { label: "Quality Guaranteed", value: "100%", icon: <ShieldCheck size={24} className="text-indigo-600" /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar schoolName={APP_NAME} />

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-widest mb-8">
                            <GraduationCap size={16} /> Empowering Education
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight break-words">
                            Streamlining <span className="text-indigo-600 relative">Institutional<span className="absolute -bottom-2 left-0 w-full h-3 bg-indigo-100 -z-10 rounded-full"></span></span> Procurement.
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                            We provide a seamless bridge between top-tier suppliers and leading educational institutions, ensuring quality, transparency, and efficiency at every step.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Stats Section */}
            <section className="py-16 bg-slate-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center group hover:border-indigo-200 transition-colors"
                            >
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 mb-2">{stat.value}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Our Mission</h2>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                            Our platform was built with a singular vision: to remove the friction from educational procurement. By connecting schools directly with vetted suppliers, we eliminate unnecessary overhead, guarantee product quality, and ensure timely deliveries. We believe that when schools spend less time worrying about supplies, they can spend more time focusing on what truly matters—education.
                        </p>
                        <div className="w-24 h-1 bg-indigo-100 mx-auto rounded-full"></div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default About;
