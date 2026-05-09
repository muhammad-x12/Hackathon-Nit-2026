import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Check, X } from 'lucide-react';

// ── Social platform configs ────────────────────────────────────
const platforms = (url, title, image) => [
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        color: 'bg-[#25D366] hover:bg-[#1ebe5c]',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.11 1.523 5.836L.044 23.522a.75.75 0 00.934.934l5.694-1.484A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 01-4.95-1.354l-.36-.213-3.725.97.993-3.626-.234-.373A9.75 9.75 0 1112 21.75z" />
            </svg>
        ),
        href: () => `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    },
    {
        key: 'facebook',
        label: 'Facebook',
        color: 'bg-[#1877F2] hover:bg-[#1464d0]',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
        ),
        href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        key: 'twitter',
        label: 'X (Twitter)',
        color: 'bg-black hover:bg-slate-800',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        href: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
        key: 'linkedin',
        label: 'LinkedIn',
        color: 'bg-[#0A66C2] hover:bg-[#0854a0]',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
        key: 'telegram',
        label: 'Telegram',
        color: 'bg-[#0088cc] hover:bg-[#0077b3]',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
        href: () => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
        key: 'pinterest',
        label: 'Pinterest',
        color: 'bg-[#E60023] hover:bg-[#c90016]',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
        ),
        href: () => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ''}`,
    },
    {
        key: 'email',
        label: 'Email',
        color: 'bg-slate-700 hover:bg-slate-800',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
        ),
        href: () => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this product:\n\n${title}\n${url}`)}`,
    },
];

// ── Main Component ─────────────────────────────────────────────
const ShareProduct = ({ productName, productImage }) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef(null);

    const url = window.location.href;
    const title = `${productName} — Check out this product!`;
    const image = productImage || '';

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openShare = (hrefFn) => {
        window.open(hrefFn(), '_blank', 'noopener,noreferrer,width=600,height=500');
    };

    return (
        <div className="relative" ref={ref}>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                title="Share this product"
            >
                <Share2 size={15} />
                Share
            </button>

            {/* Share Popover */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Share2 size={12} className="text-indigo-500" /> Share Product
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Social grid */}
                        <div className="p-4">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {platforms(url, title, image).map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => openShare(p.href)}
                                        title={p.label}
                                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 ${p.color}`}
                                    >
                                        {p.icon}
                                        <span className="text-[9px] font-bold leading-none">{p.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Copy link */}
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
                                <p className="flex-1 text-xs text-slate-500 font-medium truncate pl-1">{url}</p>
                                <button
                                    onClick={copyLink}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${copied
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-900 hover:bg-slate-700 text-white'
                                        }`}
                                >
                                    {copied ? <><Check size={11} /> Copied!</> : <><Link2 size={11} /> Copy</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShareProduct;
