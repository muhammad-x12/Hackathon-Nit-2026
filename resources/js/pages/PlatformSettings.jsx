import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const PlatformSettings = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [settings, setSettings] = useState({
        platform_service_charge: '0',
        whatsapp_number: '',
        platform_email: 'contact@myschoolbranding.in',
        platform_phone: '+91-XXXXXXXXXX',
        referral_enabled: '1',
        referral_discount_type: 'percentage',
        referral_discount_value: '10',
        referral_discount_max: '500',
        social_facebook: '',
        social_instagram: '',
        social_linkedin: '',
        social_youtube: '',
        cod_enabled: '1',
        cod_min_order: '0',
        cod_max_order: '100000',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data) {
                    setSettings(prev => ({ ...prev, ...res.data }));
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccess(false);

        try {
            const settingsPayload = Object.entries(settings)
                .filter(([key]) => key !== 'delivery_charges')
                .map(([key, value]) => ({
                    key,
                    value: String(value),
                }));

            await api.post('/admin/settings', { settings: settingsPayload });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Update failed', error);
            setErrorMsg(error.response?.data?.message || 'Failed to update platform settings.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-64 flex items-center justify-center">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Platform Settings</h1>
                <p className="text-slate-600 mt-2">Manage platform configuration and policies</p>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    <span>Settings saved successfully</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Financial Settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Financial Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Platform Service Charge (₹)</label>
                            <input
                                name="platform_service_charge"
                                type="number"
                                step="0.01"
                                value={settings.platform_service_charge}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">Added to base price per unit</p>
                        </div>
                    </div>
                </div>

                {/* Communication Settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Communication Settings</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Support Number</label>
                                <input
                                    name="whatsapp_number"
                                    type="text"
                                    placeholder="919876543210"
                                    value={settings.whatsapp_number}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">Format: country code + number (e.g., 919876543210)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <input
                                    name="platform_email"
                                    type="email"
                                    value={settings.platform_email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                            <input
                                name="platform_phone"
                                type="text"
                                value={settings.platform_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Social Media Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Facebook URL</label>
                                    <input
                                        name="social_facebook"
                                        type="url"
                                        placeholder="https://facebook.com/..."
                                        value={settings.social_facebook}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Instagram URL</label>
                                    <input
                                        name="social_instagram"
                                        type="url"
                                        placeholder="https://instagram.com/..."
                                        value={settings.social_instagram}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
                                    <input
                                        name="social_linkedin"
                                        type="url"
                                        placeholder="https://linkedin.com/..."
                                        value={settings.social_linkedin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">YouTube URL</label>
                                    <input
                                        name="social_youtube"
                                        type="url"
                                        placeholder="https://youtube.com/..."
                                        value={settings.social_youtube}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Payment & COD Settings</h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.cod_enabled === '1'}
                                onChange={() => setSettings(p => ({ ...p, cod_enabled: p.cod_enabled === '1' ? '0' : '1' }))}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">COD {settings.cod_enabled === '1' ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">COD Minimum Order Value (₹)</label>
                            <input
                                name="cod_min_order"
                                type="number"
                                step="0.01"
                                value={settings.cod_min_order}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500 mt-1">COD will be hidden if order total is less than this.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">COD Maximum Order Value (₹)</label>
                            <input
                                name="cod_max_order"
                                type="number"
                                step="0.01"
                                value={settings.cod_max_order}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500 mt-1">COD will be hidden if order total exceeds this.</p>
                        </div>
                    </div>
                </div>

                {/* Logistics & Shiprocket Settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Logistics Settings
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 mb-6">
                            <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-bold">Shiprocket Global Account</p>
                                <p className="mt-1 opacity-90">Entering global credentials here allows the platform to calculate real-time shipping for all products if the supplier hasn't set their own specific account.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Shiprocket Login Email</label>
                                <input
                                    name="shiprocket_email"
                                    type="email"
                                    placeholder="email@example.com"
                                    value={settings.shiprocket_email || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Shiprocket Password</label>
                                <input
                                    name="shiprocket_password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={settings.shiprocket_password || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Characters are masked for security</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral Settings */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Referral Program</h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.referral_enabled === '1'}
                                onChange={() => setSettings(p => ({ ...p, referral_enabled: p.referral_enabled === '1' ? '0' : '1' }))}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">{settings.referral_enabled === '1' ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Reward Type</label>
                            <select
                                name="referral_discount_type"
                                value={settings.referral_discount_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Incentive Value</label>
                            <input
                                name="referral_discount_value"
                                type="number"
                                step="0.01"
                                value={settings.referral_discount_value}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Max Threshold (₹)</label>
                            <input
                                name="referral_discount_max"
                                type="number"
                                step="0.01"
                                value={settings.referral_discount_max}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PlatformSettings;
