import React, { useState, useEffect, lazy, Suspense } from 'react';
import api from '../../services/api';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill-new'));

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center">
                    <p className="text-sm text-rose-600 font-medium">Editor failed to load.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const STATIC_PAGES = [
    { slug: 'about', title: 'About Us' },
    { slug: 'mission', title: 'Our Mission' },
    { slug: 'contact', title: 'Contact Us (Extra Info)' },
    { slug: 'press', title: 'Press' },
    { slug: 'create-store', title: 'Create Your Store' },
    { slug: 'wholesale', title: 'Wholesale Marketplace' },
    { slug: 'commission', title: 'Commission Model' },
    { slug: 'help', title: 'Help Center' },
    { slug: 'faqs', title: 'FAQs' },
    { slug: 'shipping-policy', title: 'Shipping Policy' },
    { slug: 'refund-policy', title: 'Refund Policy' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms', title: 'Terms & Conditions' },
    { slug: 'gst', title: 'GST Information' },
];

const StaticPageManagement = () => {
    const [selectedSlug, setSelectedSlug] = useState(STATIC_PAGES[0].slug);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const selectedPage = STATIC_PAGES.find(p => p.slug === selectedSlug);

    useEffect(() => {
        fetchPageContent();
    }, [selectedSlug]);

    const fetchPageContent = async () => {
        setFetching(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await api.get(`/static-pages/${selectedSlug}`);
            setContent(res.data.content || '');
        } catch (error) {
            if (error.response?.status === 404) {
                setContent('');
            } else {
                console.error('Failed to fetch page', error);
                setStatus({ type: 'error', message: 'Failed to load page content from server.' });
            }
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/admin/static-pages', {
                slug: selectedSlug,
                title: selectedPage.title,
                content: content
            });

            setStatus({ type: 'success', message: `${selectedPage.title} page updated successfully!` });
            setTimeout(() => setStatus({ type: '', message: '' }), 5000);
        } catch (error) {
            console.error('Save failed', error);
            setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update page.' });
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ]
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Static Pages Management</h1>
                    <p className="text-slate-600 mt-2">Edit the content of the informational pages on your site.</p>
                </div>
            </div>

            {status.message && (
                <div className={`mb-6 p-4 rounded-xl font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{status.message}</span>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 flex flex-col min-h-[600px]">
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Select Page to Edit</label>
                    <div className="relative">
                        <select
                            value={selectedSlug}
                            onChange={(e) => setSelectedSlug(e.target.value)}
                            className="w-full md:w-1/2 lg:w-1/3 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium appearance-none"
                            disabled={fetching || loading}
                        >
                            {STATIC_PAGES.map((page) => (
                                <option key={page.slug} value={page.slug}>{page.title}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 max-w-full md:w-1/2 lg:left-[33.33%] lg:translate-x-[-100%]">
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative w-full mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Page Content ({selectedPage.title})</label>

                    {fetching ? (
                        <div className="flex-1 flex items-center justify-center min-h-[300px] border border-slate-200 rounded-xl bg-slate-50 opacity-70">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Loader2 className="animate-spin" size={20} /> Loading Content...
                            </div>
                        </div>
                    ) : (
                        <ErrorBoundary>
                            <Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl"><Loader2 className="animate-spin text-slate-400" /></div>}>
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    className="h-[300px] lg:h-[400px] mb-12 bg-white"
                                />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={handleSave}
                        disabled={loading || fetching}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={18} /> Saving...</>
                        ) : (
                            <><Save size={18} /> Save Page Content</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaticPageManagement;
