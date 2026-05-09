import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Building2, Package, TrendingUp, ShieldCheck } from 'lucide-react';

export const missionContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <p>
            At <strong className="text-slate-900">My School Branding</strong>, our mission is to revolutionize the educational supply chain by empowering institutions and connecting them directly with reliable manufacturers.
        </p>
        <p>
            For decades, schools have struggled with managing uniform logistics, inventory overheads, and fragmented supplier relations. Parents have faced long queues, inconsistent quality, and limited transparency. We knew there had to be a better way.
        </p>
        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl my-8 text-indigo-900 font-medium text-xl leading-snug">
            "We believe that schools should focus on education, not inventory management. By digitizing their campus stores, we give them back their time and resources."
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Our Core Pillars</h3>
        <ul className="space-y-4">
            <li className="flex gap-4 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div>
                    <strong className="text-slate-900 block mb-1">Zero Inventory for Schools</strong>
                    We eliminate the need for schools to purchase and store uniforms in bulk, entirely removing their financial risk.
                </div>
            </li>
            <li className="flex gap-4 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div>
                    <strong className="text-slate-900 block mb-1">Empowering Manufacturers</strong>
                    We provide high-quality suppliers with direct access to a network of verified schools, cutting out the middlemen.
                </div>
            </li>
            <li className="flex gap-4 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div>
                    <strong className="text-slate-900 block mb-1">Seamless Parent Experience</strong>
                    Parents can order premium uniforms directly to their doorsteps with complete tracking and transparency.
                </div>
            </li>
        </ul>
        <p className="mt-8">
            Join us as we build the first true digital wholesale-to-school ecosystem in India.
        </p>
    </div>
);

export const careersContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <p>
            We are always looking for passionate, driven individuals who want to make an impact at the intersection of B2B commerce and education technology.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="border border-slate-200 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Engineering</h4>
                <p className="text-base mb-4">Help us build scalable, high-performance systems for thousands of schools.</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">View Openings <ArrowRight size={14} /></span>
            </div>
            <div className="border border-slate-200 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-xl mb-2">School Success</h4>
                <p className="text-base mb-4">Partner with administrators to ensure their custom portals excel.</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">View Openings <ArrowRight size={14} /></span>
            </div>
            <div className="border border-slate-200 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Supplier Relations</h4>
                <p className="text-base mb-4">Onboard and manage top-tier manufacturers across India.</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">View Openings <ArrowRight size={14} /></span>
            </div>
            <div className="border border-slate-200 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Logistics</h4>
                <p className="text-base mb-4">Optimize the last-mile delivery experience for millions of parents.</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">View Openings <ArrowRight size={14} /></span>
            </div>
        </div>
        <p>
            Don't see a role that fits? Send your resume to <strong className="text-indigo-600">careers@myschoolbranding.in</strong> and let's talk.
        </p>
    </div>
);

export const pressContent = (
    <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
        <p>
            For media inquiries, press kits, and interview requests, please contact our PR team at <strong className="text-indigo-600">press@myschoolbranding.in</strong>.
        </p>

        <div className="space-y-6">
            <div className="border-l-4 border-indigo-600 pl-6 py-2">
                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">March 2026</span>
                <h3 className="text-2xl font-bold text-slate-900 my-2">My School Branding surpasses 500 partner schools across India</h3>
                <p className="text-base">The B2B platform announces record growth in Q1, solidifying its position as the market leader in institutional supply chain digitization.</p>
                <button className="text-indigo-600 font-bold text-sm mt-3 hover:underline">Read Press Release</button>
            </div>
            <div className="border-l-4 border-indigo-600 pl-6 py-2">
                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">November 2025</span>
                <h3 className="text-2xl font-bold text-slate-900 my-2">New Supplier Integration Engine Launched</h3>
                <p className="text-base">Manufacturers can now sync their ERP systems directly with the My School Branding marketplace for real-time inventory updates.</p>
                <button className="text-indigo-600 font-bold text-sm mt-3 hover:underline">Read Press Release</button>
            </div>
        </div>
    </div>
);

export const createStoreContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-indigo-600" />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-4">Digitize Your Campus Store Today</h3>
        <p className="mb-8">
            Setting up your digital uniform and book store takes less than 24 hours. There are no setup fees, no hosting charges, and no hidden costs.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 text-left">
            <h4 className="font-bold text-slate-900 mb-4">What you will need:</h4>
            <ul className="space-y-3">
                <li className="flex gap-3"><CheckCircle2 className="text-indigo-600" size={20} /> Official School Registration Document / Trust Deed</li>
                <li className="flex gap-3"><CheckCircle2 className="text-indigo-600" size={20} /> High-resolution School Logo</li>
                <li className="flex gap-3"><CheckCircle2 className="text-indigo-600" size={20} /> Bank Account Details for commission settlements</li>
                <li className="flex gap-3"><CheckCircle2 className="text-indigo-600" size={20} /> Authorized Signatory ID Proof</li>
            </ul>
        </div>
        <Link to="/register-school" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:bg-indigo-700 transition">
            Begin Registration <ArrowRight size={20} />
        </Link>
    </div>
);

export const wholesaleMarketplaceContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <p>
            Welcome to India's first B2B Wholesale Marketplace exclusively designed for verified educational institutions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Package size={28} /></div>
                <h4 className="font-bold text-slate-900 text-xl mb-3">Curated Suppliers</h4>
                <p className="text-base">Access a network of pre-vetted, high-quality manufacturers offering specialized institutional gear, from uniforms to laboratory equipment.</p>
            </div>
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp size={28} /></div>
                <h4 className="font-bold text-slate-900 text-xl mb-3">Direct Connect</h4>
                <p className="text-base">Review supplier catalogs, negotiate custom designs, and finalize agreements directly through your dashboard with full transparency.</p>
            </div>
        </div>
        <p>
            Once a supplier builds your catalog, you can instantly publish it to your customized school storefront for parent purchasing. <strong>Zero inventory required.</strong>
        </p>
    </div>
);

export const commissionModelContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">A Zero-Cost Revenue Engine for Schools</h3>
        <p>
            We believe schools should benefit from organizing their supply chain, which is why we've built an automated commission settlement system directly into our platform.
        </p>

        <div className="bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden my-8">
            <div className="bg-indigo-50 p-6 border-b border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-xl flex items-center gap-2">
                    <ShieldCheck size={24} /> How it Works
                </h4>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                        <strong className="text-slate-900 block">Supplier Sets Base Price</strong>
                        <p className="text-base">The manufacturer sets the base B2B price for the uniform or item (e.g., ₹500).</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                        <strong className="text-slate-900 block">School Adds Markup</strong>
                        <p className="text-base">The school administrator adds an institutional markup or commission (e.g., 10%, making the retail price ₹550).</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                        <strong className="text-slate-900 block">Parent Purchases</strong>
                        <p className="text-base">The parent pays the final retail price through the school's custom portal.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                        <strong className="text-indigo-600 block">Automated split Settlement</strong>
                        <p className="text-base">Within 3 business days of delivery, ₹500 is automatically routed to the supplier, and the ₹50 commission is routed to the school's designated bank account. No manual invoicing required.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const faqsContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Can parents track their orders?</h4>
                <p>Yes. Every parent order generates a unique tracking link integrated with our delivery partners (Delhivery, BlueDart, etc.), updated in real-time.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Who handles customer support for parents?</h4>
                <p>My School Branding handles tier-1 customer support regarding sizing, returns, and delivery tracking, alleviating the burden from the school administration.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
                <h4 className="font-bold text-slate-900 text-xl mb-2">Are there bulk ordering discounts for schools?</h4>
                <p>Yes. While our primary model is direct-to-parent, schools can bypass the portal and issue wholesale B2B Purchase Orders directly to suppliers for bulk inventory at negotiated rates.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
                <h4 className="font-bold text-slate-900 text-xl mb-2">How long does supplier onboarding take?</h4>
                <p>Supplier verification usually takes 2-3 business days. Once approved, you can immediately begin building digital catalogs for schools.</p>
            </div>
        </div>
    </div>
);

export const shippingContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Shipping & Delivery Policy</h3>
        <p><strong>1. Delivery Timelines</strong><br />
            Standard ready-to-ship items are dispatched within 24-48 hours and delivered within 3-7 business days depending on the pin code. Custom stitched items (e.g., custom sizes requested by parents) may take up to 14 business days.</p>

        <p><strong>2. Shipping Charges</strong><br />
            Shipping charges are calculated at checkout based on the delivery location and total weight of the order. Some schools/suppliers may offer free shipping thresholds.</p>

        <p><strong>3. Tracking Methods</strong><br />
            Valid tracking information will be provided via email and SMS once an order is dispatched from the supplier's warehouse.</p>

        <p><strong>4. Failed Deliveries</strong><br />
            Our logistics partners will attempt delivery 3 times. If un-deliverable, the package will be returned to origin, and a refund (minus two-way shipping costs) will be issued.</p>
    </div>
);

export const refundContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Return & Refund Policy</h3>
        <p><strong>1. Return Window</strong><br />
            Items can be returned within 7 days of delivery only in cases of manufacturing defects or incorrect sizes dispatched. The tags must remain intact, and the item must be unused.</p>

        <p><strong>2. Non-returnable Items</strong><br />
            Customized names printed on uniforms, washed/used items, and undergarments are strictly non-returnable.</p>

        <p><strong>3. Process</strong><br />
            Initiate a return request via the "My Orders" panel. A reverse pickup will be scheduled. Upon receiving and inspecting the item at the warehouse, a replacement or refund will be authorized.</p>

        <p><strong>4. Refund Timelines</strong><br />
            Approved refunds are processed back to the original payment method within 5-7 business days.</p>
    </div>
);

export const privacyContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Privacy Policy</h3>
        <p>At My School Branding, we take data privacy incredibly seriously, especially given our interactions with educational institutions.</p>
        <p><strong>Data Collection:</strong> We only collect data necessary for transaction processing and fulfillment (Name, Shipping Address, Phone Number, Email, Student Grade/Section).</p>
        <p><strong>Data Protection:</strong> All data is encrypted in transit and at rest. We do not sell, rent, or lease any school or parent data to third-party marketing firms under any circumstances.</p>
        <p><strong>Payment Security:</strong> We do not store credit card or UPI details on our servers. All transactions are securely processed via PCI-DSS compliant payment gateways like Razorpay.</p>
    </div>
);

export const termsContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Terms and Conditions</h3>
        <p>By using the My School Branding platform (including admin, supplier, and school portals), you agree to our comprehensive Terms of Service.</p>
        <p><strong>For Schools:</strong> Schools are responsible for verifying the quality and pricing of items in their catalog before publishing to parents. The platform acts as a technology facilitator.</p>
        <p><strong>For Suppliers:</strong> Suppliers are legally bound to fulfill orders generated on the platform within the stated SLA. Repeated SLA breaches will result in account suspension.</p>
        <p><strong>Platform Role:</strong> My School Branding provides the digital infrastructure and payment settlement engine connecting Schools, Suppliers, and Parents, taking a standard technology service fee per transaction.</p>
    </div>
);

export const gstContent = (
    <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">GST & Taxation Information</h3>
        <p><strong>B2B Billing:</strong> Wholesale transactions between Suppliers and Schools (if applicable) require valid GSTINs. The platform issues automated compliant tax invoices.</p>
        <p><strong>B2C Retail:</strong> Products sold to parents will include the applicable GST rates for clothing/books as defined by the Government of India. The GST is captured and remitted by the respective registered Supplier making the sale.</p>
        <p><strong>Platform Fees:</strong> My School Branding invoices schools/suppliers monthly for technology/service fees, which attract an 18% GST.</p>
    </div>
);
