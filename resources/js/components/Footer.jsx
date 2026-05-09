import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Mail, Phone, MapPin, Package, Truck, Facebook, Instagram, Linkedin, Youtube, CreditCard, MessageCircle } from 'lucide-react';
import { getSubdomain } from '../utils/subdomain';
import { APP_NAME } from '../utils/constants';
import api from '../services/api';

const Footer = ({ schoolName = null, schoolInfo = null }) => {
    const subdomain = getSubdomain();
    const displayName = schoolInfo?.name || schoolName || (subdomain
        ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Store'
        : APP_NAME);

    const [platformSettings, setPlatformSettings] = React.useState({
        platform_email: 'contact@myschoolbranding.in',
        platform_phone: '+91-XXXXXXXXXX',
        social_facebook: '',
        social_instagram: '',
        social_linkedin: '',
        social_youtube: '',
    });

    React.useEffect(() => {
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

    const year = new Date().getFullYear();

    if (subdomain) {
        return (
            <footer className="bg-[#111827] text-white mt-6">
                <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
                        {/* Brand Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 w-fit group">
                                {schoolInfo?.logo ? (
                                    <img src={schoolInfo.logo} alt={displayName} className="h-14 w-auto object-contain bg-white rounded-xl p-2 shadow-lg" />
                                ) : (
                                    <div className="p-3 bg-indigo-600 rounded-2xl group-hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                                        <GraduationCap size={28} className="text-white" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-white tracking-tighter uppercase leading-none">{schoolInfo?.abbreviation || displayName}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Official Store</span>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-400">
                                The official portal for your institution's essential supplies. Quality gear and verified institutional products delivered directly.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-indigo-400 font-black mb-6 uppercase tracking-[0.2em] text-[11px]">Core categories</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-400">
                                <li><Link to="/products?category=uniforms" className="hover:text-white transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Uniforms</Link></li>
                                <li><Link to="/products?category=books" className="hover:text-white transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Books & Academic Kits</Link></li>
                                <li><Link to="/products?category=stationery" className="hover:text-white transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-700" /> Stationery</Link></li>
                            </ul>
                        </div>

                        {/* Contact & Location */}
                        <div>
                            <h4 className="text-indigo-400 font-black mb-6 uppercase tracking-[0.2em] text-[11px]">Reach Us</h4>
                            <div className="space-y-5">
                                {schoolInfo?.address && (
                                    <div className="flex gap-3 text-sm text-slate-400 leading-relaxed">
                                        <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <p>{schoolInfo.address}</p>
                                    </div>
                                )}

                                {schoolInfo?.contact_info && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {[
                                            { key: 'facebook', Icon: Facebook },
                                            { key: 'instagram', Icon: Instagram },
                                            { key: 'linkedin', Icon: Linkedin },
                                            { key: 'twitter', Icon: MessageCircle },
                                        ].map((social, idx) => {
                                            const url = schoolInfo.contact_info[social.key];
                                            if (!url) return null;
                                            return (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all border border-white/5">
                                                    <social.Icon size={16} />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Support Area */}
                        <div>
                            <h4 className="text-indigo-400 font-black mb-6 uppercase tracking-[0.2em] text-[11px]">Customer care</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-400">
                                <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
                                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
                                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy & Security</Link></li>
                                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            </ul>

                            {(schoolInfo?.contact_info?.email || schoolInfo?.contact_info?.phone) && (
                                <div className="mt-8 pt-6 border-t border-slate-800/50 space-y-3">
                                    {schoolInfo.contact_info.email && (
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                            <Mail size={14} className="text-indigo-500" />
                                            <span>{schoolInfo.contact_info.email}</span>
                                        </div>
                                    )}
                                    {schoolInfo.contact_info.phone && (
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                            <Phone size={14} className="text-emerald-500" />
                                            <span>{schoolInfo.contact_info.phone}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bottom bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
                        <span>© {year} {displayName}. All rights reserved.</span>
                        <div className="flex items-center gap-4">
                            <span>Powered by My School Branding</span>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <ShieldCheck size={13} />
                                <span>Secured with SSL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    // MAIN PLATFORM FOOTER
    return (
        <footer className="bg-[#111827] text-white mt-6">
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Company Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#002B5B] p-2 rounded-lg">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                            <span className="text-xl font-bold uppercase tracking-tighter">{displayName}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            India’s First Wholesale-to-School Store Ecosystem. We bridge the gap between premium manufacturers and educational institutions with verifiable quality and logistics.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#FFD700] mb-6">Company</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'About Us', path: '/about' },
                                { name: 'Our Mission', path: '/mission' },
                                { name: 'Logistics', path: '/logistics' },
                                { name: 'Contact Us', path: '/contact' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-slate-400 hover:text-[#FFD700] transition-colors text-sm font-medium">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#FFD700] mb-6">For Schools</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Create Your Store', path: '/create-store' },
                                { name: 'Wholesale Marketplace', path: '/wholesale' },
                                { name: 'Commission Model', path: '/commission' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-slate-400 hover:text-[#FFD700] transition-colors text-sm font-medium">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#FFD700] mb-6">Support & Legal</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Help Center', path: '/help' },
                                { name: 'FAQs', path: '/faqs' },
                                { name: 'Shipping Policy', path: '/shipping-policy' },
                                { name: 'Refund Policy', path: '/refund-policy' },
                                { name: 'Privacy Policy', path: '/privacy-policy' },
                                { name: 'Terms & Conditions', path: '/terms' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-slate-400 hover:text-[#FFD700] transition-colors text-sm font-medium">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-medium">
                        &copy; {year} {displayName}. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {[
                            { Icon: Facebook, link: platformSettings.social_facebook },
                            { Icon: Instagram, link: platformSettings.social_instagram },
                            { Icon: Linkedin, link: platformSettings.social_linkedin },
                            { Icon: Youtube, link: platformSettings.social_youtube },
                        ].map((social, idx) => (
                            <a
                                key={idx}
                                href={social.link || '#'}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-[#FFD700] hover:text-[#111827] transition-all"
                            >
                                <social.Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
