import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    AlertCircle, ArrowLeft, RefreshCcw, HelpCircle,
    ShieldAlert, Calendar, LayoutGrid, Zap, PhoneCall
} from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_NAME } from '../utils/constants';

const OrderFailed = () => {
    const { id } = useParams();

    useEffect(() => {
        if (!id || !/^\d+$/.test(String(id))) return;
        api.post('/order/abandon-payment', { order_id: Number(id) }).catch(() => {});
    }, [id]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1, transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col items-center justify-center">
            <Navbar schoolName={APP_NAME} />

            <div className="max-w-3xl mx-auto px-6 pt-32 lg:pt-40 text-center relative z-10 w-full">

                {/* Central Focus Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                    className="inline-flex items-center justify-center p-6 bg-rose-50 border border-rose-100 rounded-full mb-10 shadow-sm relative"
                >
                    <AlertCircle size={56} className="text-rose-500" />
                </motion.div>

                {/* Main Header Group */}
                <div className="space-y-6 mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                            <ShieldAlert size={14} className="text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Transaction Terminated</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900"
                    >
                        Payment <span className="text-rose-600">Failed.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-slate-500 max-w-xl mx-auto font-medium"
                    >
                        We encountered an issue while processing your institutional supply payment. No funds have been deducted, or they will be reversed automatically.
                    </motion.p>

                    {id && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="inline-flex items-center justify-center bg-white border border-slate-200 px-6 py-4 rounded-xl shadow-sm mt-4 group"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reference Identifier</span>
                                <span className="font-mono text-xl font-bold text-slate-900 tracking-widest">{id}</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Guidance Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto"
                >
                    <motion.div variants={itemVariants} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600 mx-auto mb-6">
                            <RefreshCcw size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-2">Retry Payment</h4>
                        <p className="text-xs text-slate-500 font-medium">Verify card status</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-600 mx-auto mb-6">
                            <PhoneCall size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-2">Support Relay</h4>
                        <p className="text-xs text-slate-500 font-medium">Available 24/7</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100 text-yellow-600 mx-auto mb-6">
                            <HelpCircle size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-2">Bank Sync</h4>
                        <p className="text-xs text-slate-500 font-medium">Check credit limits</p>
                    </motion.div>
                </motion.div>

                {/* Operations */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10 border-t border-slate-200 w-full max-w-2xl mx-auto"
                >
                    <Link to="/checkout" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none">
                        <RefreshCcw size={16} /> Return to Checkout
                    </Link>
                    <Link to="/contact" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold uppercase tracking-widest text-xs border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none">
                        <HelpCircle size={16} /> Technical Support
                    </Link>
                </motion.div>

                <div className="mt-16 flex justify-center text-slate-400">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Zap size={14} className="text-slate-300" />
                        System active & awaiting retry.
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OrderFailed;
