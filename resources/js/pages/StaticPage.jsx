import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const StaticPage = ({ slug, title }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState(title);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/static-pages/${slug}`);
                if (res.data) {
                    setContent(res.data.content || '');
                    if (res.data.title) {
                        setPageTitle(res.data.title);
                    }
                }
            } catch (error) {
                console.error('Failed to load page content', error);
                setContent('');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();

        // Reset state if slug changes
        return () => {
            setContent('');
            setPageTitle(title);
        };
    }, [slug, title]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden flex flex-col">
            <Navbar />

            <header className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <motion.h1
                        key={pageTitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        {pageTitle}
                    </motion.h1>
                </div>
            </header>

            <main className="flex-1 py-16 px-6 relative z-20 -mt-10 lg:-mt-16">
                <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-xl rounded-[2.5rem] p-8 lg:p-12 mb-16 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                            <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
                            <p className="font-medium text-lg text-slate-600">Loading {pageTitle}...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-lg max-w-none prose-indigo prose-headings:font-bold prose-a:text-indigo-600">
                            {content ? (
                                <div 
                                    dangerouslySetInnerHTML={{ __html: content }} 
                                    className="break-words [overflow-wrap:anywhere] overflow-hidden"
                                />
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Content Coming Soon</h3>
                                    <p>We are currently updating our {pageTitle.toLowerCase()} information. Please check back later.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StaticPage;
