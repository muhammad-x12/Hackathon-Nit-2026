import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageCircle } from 'lucide-react';

const WhatsAppFloat = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                setSettings(res.data);
            } catch (error) {
                console.error('Failed to fetch platform settings for WhatsApp float', error);
            }
        };
        fetchSettings();
    }, []);

    if (!settings?.whatsapp_number) return null;

    const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('Hello! I have a query regarding the products.')}`;

    return (
        <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:-rotate-6 transition-all duration-300 group flex items-center gap-3 active:scale-95"
            title="Chat with us on WhatsApp"
        >
            <div className="hidden group-hover:block transition-all duration-300 overflow-hidden whitespace-nowrap px-2">
                <span className="text-[10px] font-black uppercase tracking-widest">Connect with Us</span>
            </div>
            <MessageCircle size={24} className="fill-white/10" strokeWidth={2.5} />
            
            {/* Visual Pulse Effect */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
        </a>
    );
};

export default WhatsAppFloat;
