import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, User } from 'lucide-react';

const TestimonialsSection = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await api.get('/testimonials');
                setTestimonials(res.data);
            } catch (error) {
                console.error('Failed to fetch testimonials', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTestimonials();
    }, []);

    const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    if (loading || testimonials.length === 0) return null;

    return (
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-white/5">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Voices of Confidence</span>
                    <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase mb-6">
                        Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Thousands.</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg lg:text-xl">
                        Hear from the community of parents, schools, and administrators who rely on us for their daily school essentials.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto px-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-10 lg:p-16 relative"
                        >
                            <Quote size={64} className="absolute top-10 right-10 text-white/10 rotate-180" />

                            <div className="flex flex-col items-center text-center">
                                <div className="flex gap-1 mb-8">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={20}
                                            className={i < testimonials[current].rating ? "fill-[#FFD700] text-[#FFD700]" : "text-white/20"}
                                        />
                                    ))}
                                </div>

                                <blockquote className="text-2xl lg:text-4xl font-bold italic text-white/90 mb-12 leading-tight">
                                    "{testimonials[current].content}"
                                </blockquote>

                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 p-0.5 shadow-xl">
                                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-800 flex items-center justify-center">
                                            {testimonials[current].author_image ? (
                                                <img src={testimonials[current].author_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={28} className="text-slate-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xl font-black tracking-tight text-white uppercase">{testimonials[current].author_name}</div>
                                        <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{testimonials[current].author_role}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {testimonials.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all group"
                            >
                                <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all group"
                            >
                                <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </>
                    )}
                </div>

                {/* Indicators */}
                {testimonials.length > 1 && (
                    <div className="flex justify-center gap-3 mt-12">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${i === current ? 'w-12 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;
