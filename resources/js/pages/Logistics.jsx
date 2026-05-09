import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Truck, PackageCheck, MapPin, Clock, ShieldCheck, Zap } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Logistics = () => {
    const features = [
        {
            title: "Direct-to-School Delivery",
            description: "All supplies are shipped directly from verified suppliers to your institution's central receiving or designated departments.",
            icon: <Truck size={24} className="text-emerald-600" />,
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-100"
        },
        {
            title: "Real-Time Tracking",
            description: "Monitor your orders from dispatch to arrival with our integrated logistics dashboard.",
            icon: <MapPin size={24} className="text-indigo-600" />,
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-100"
        },
        {
            title: "Guaranteed Turnarounds",
            description: "Standard items arrive within 3-5 business days. Custom or bulk orders follow strict pre-agreed timelines.",
            icon: <Clock size={24} className="text-amber-600" />,
            bgColor: "bg-amber-50",
            borderColor: "border-amber-100"
        },
        {
            title: "Secure Packaging",
            description: "Materials are packed according to institutional standards, ensuring no damages during transit.",
            icon: <PackageCheck size={24} className="text-sky-600" />,
            bgColor: "bg-sky-50",
            borderColor: "border-sky-100"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar schoolName={APP_NAME} />

            {/* Header */}
            <header className="pt-32 pb-16 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest mb-6">
                            <Truck size={16} /> Secure Supply Chain
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                            Enterprise-Grade <span className="text-indigo-600">Logistics.</span>
                        </h1>
                        <p className="text-lg text-slate-600 font-medium">
                            We ensure that your institutional supplies reach you securely, promptly, and without hassle.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-20 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 lg:p-10 rounded-3xl border border-slate-200 shadow-sm flex gap-6 items-start hover:border-indigo-300 transition-colors group"
                        >
                            <div className={`w-14 h-14 ${feature.bgColor} ${feature.borderColor} border rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Partnership Note */}
            <section className="max-w-5xl mx-auto px-6 mb-16">
                <div className="bg-indigo-600 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={200} className="text-white" />
                    </div>
                    <div className="relative z-10 text-white">
                        <Zap size={40} className="mx-auto mb-6 text-indigo-200" />
                        <h2 className="text-3xl font-extrabold mb-4">Dedicated Supply Managers</h2>
                        <p className="text-indigo-100 text-lg font-medium max-w-2xl mx-auto">
                            Every institutional partner is assigned a dedicated logistics manager to oversee bulk orders and ensure compliance with delivery protocols.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Logistics;
