import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-xl"
                        onClick={onClose}
                    >
                        {/* Background Ambient Effects */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[100px]"
                            />
                        </div>

                        {/* Modal Container */}
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="w-full max-w-2xl max-h-[85vh] flex flex-col glass-card border border-white/50 rounded-[2.5rem] shadow-2xl shadow-brand-blue/10 overflow-hidden relative z-10 bg-white/90"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Inner ambient glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-[60px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

                            {/* Header */}
                            <div className="px-8 py-6 md:px-10 md:py-8 border-b border-zinc-200/50 flex items-center justify-between bg-white/50 backdrop-blur-md relative z-10">
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tighter flex items-center gap-3">
                                    <span className="w-2 h-8 bg-brand-blue rounded-full block"></span>
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-zinc-100/50 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all active:scale-95 shadow-sm border border-zinc-200/50"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar relative z-10 bg-white/30 backdrop-blur-sm">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
