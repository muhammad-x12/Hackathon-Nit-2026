import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Zap, Building2, TrendingUp, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getSubdomain } from '../utils/subdomain';

const Pricing = () => {
    const isSubdomain = !!getSubdomain();

    // If on a subdomain (school site), pricing might not be relevant to parents, but let's show an empty state or redirect just in case, or show info.
    // For now, let's assume Pricing is mainly for the main domain.

    const plans = [
        {
            name: "Basic Registration",
            price: "Free",
            period: "Forever",
            desc: "For schools wanting to digitize their uniform & book supply process.",
            features: [
                "Custom branded school portal",
                "Access to verified supplier network",
                "Automated student ordering",
                "Standard commission tracking",
                "Basic email support"
            ],
            notIncluded: [
                "Custom domain mapping",
                "Dedicated account manager",
                "Advanced analytics dashboard"
            ],
            color: "slate",
            buttonText: "Register School",
            popular: false
        },
        {
            name: "Premium Partner",
            price: "Commission",
            period: "Based",
            desc: "For suppliers looking to reach hundreds of verified institutions.",
            features: [
                "Unlimited product listings",
                "Direct B2B school networks",
                "Automated order fulfillment tracking",
                "Guaranteed payment settlements",
                "Volume-based shipping discounts",
                "Dedicated account manager",
                "Advanced analytics dashboard"
            ],
            notIncluded: [],
            color: "indigo",
            buttonText: "Become a Supplier",
            popular: true
        }
    ];

    const faqs = [
        {
            q: "Do schools pay setup fees to create a platform?",
            a: "No. We completely waive all setup fees, domain fees, and maintenance fees for schools. You simply register, select your uniform/book designs, and we deploy your custom storefront."
        },
        {
            q: "How do schools earn commissions?",
            a: "Schools define a small markup or commission percentage on catalog items supplied by manufacturers. When parents order, the commission is automatically calculated and settled to the school's account."
        },
        {
            q: "How do suppliers get paid?",
            a: "Suppliers receive weekly automated settlements directly to their bank accounts for all fulfilled parent orders minus the platform and school commission."
        },
        {
            q: "Do you handle shipping logistics?",
            a: "Yes. Our platform integrates with trusted logistics partners to handle direct-to-parent doorstep delivery or bulk campus drops, depending on the school's preference."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden">
            <Navbar />

            {/* HEADER */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                        <Zap size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Transparent Pricing</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
                        Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">No Surprises.</span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                        Whether you are an institution upgrading your supply chain or a manufacturer expanding your reach, our models are built for shared success.
                    </p>
                </div>
            </header>

            {/* PRICING CARDS */}
            <section className="py-24 relative z-20 -mt-10 lg:-mt-24">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative rounded-[2.5rem] bg-white border ${plan.popular ? 'border-indigo-600 shadow-2xl shadow-indigo-600/20 md:-translate-y-4' : 'border-slate-200 shadow-xl'} overflow-hidden p-8 lg:p-10 flex flex-col group hover:border-${plan.color}-400 transition-all duration-300`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
                                )}

                                <div className="mb-8">
                                    {plan.popular && (
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4 border border-indigo-100">
                                            Most Popular
                                        </span>
                                    )}
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{plan.desc}</p>
                                </div>

                                <div className="mb-8 flex items-end gap-2">
                                    {plan.price === 'Free' ? (
                                        <span className="text-5xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                                    ) : (
                                        <>
                                            <span className="text-5xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                                            <span className="text-lg text-slate-500 font-bold pb-1 bg-slate-100 px-3 py-1 rounded-lg">/{plan.period}</span>
                                        </>
                                    )}
                                </div>

                                <Link
                                    to={plan.name.includes('School') ? '/register-school' : '/register'}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mb-10 ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                                >
                                    {plan.buttonText} <ArrowRight size={18} />
                                </Link>

                                <div className="flex-1 space-y-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">What's Included</p>
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 size={20} className={`shrink-0 text-${plan.color === 'indigo' ? 'indigo' : 'slate'}-500`} />
                                            <span className="text-slate-700 font-medium text-sm">{feature}</span>
                                        </div>
                                    ))}

                                    {plan.notIncluded.length > 0 && (
                                        <>
                                            <div className="h-px bg-slate-100 my-6" />
                                            {plan.notIncluded.map((feature, i) => (
                                                <div key={i} className="flex items-start gap-3 opacity-50 grayscale">
                                                    <XCircle size={20} className="shrink-0 text-slate-400" />
                                                    <span className="text-slate-500 font-medium text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-20 border-y border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-6">
                        <Building2 size={32} className="text-indigo-400 mx-auto mb-4" />
                        <h4 className="text-3xl font-black text-slate-900 mb-2">Zero</h4>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Setup Cost for Schools</p>
                    </div>
                    <div className="p-6">
                        <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-4" />
                        <h4 className="text-3xl font-black text-slate-900 mb-2">100%</h4>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Secure Settlements</p>
                    </div>
                    <div className="p-6">
                        <TrendingUp size={32} className="text-amber-400 mx-auto mb-4" />
                        <h4 className="text-3xl font-black text-slate-900 mb-2">Automatic</h4>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Commission Tracking</p>
                    </div>
                </div>
            </section>

            {/* FAQS */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <HelpCircle size={24} className="text-slate-400" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-shadow">
                                <h4 className="text-lg font-bold text-slate-900 mb-3">{faq.q}</h4>
                                <p className="text-slate-600 leading-relaxed font-medium">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Pricing;
