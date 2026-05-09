import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Truck, Save, Loader2, CheckCircle2, AlertCircle,
    Check, X
} from 'lucide-react';

const ShippingSettings = () => {
    const [providers, setProviders] = useState([]);
    const [myConfigs, setMyConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [providersRes, configsRes] = await Promise.all([
                api.get('/shipping/providers'),
                api.get('/shipping/my-configs')
            ]);
            setProviders(providersRes.data);
            setMyConfigs(configsRes.data);
        } catch (error) {
            console.error('Failed to fetch shipping data', error);
            setErrorMsg('Failed to load shipping configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (providerId, credentials, isEnabled) => {
        setSaving(providerId);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.post('/shipping/my-configs', {
                shipping_provider_id: providerId,
                credentials,
                is_enabled: isEnabled
            });
            setSuccessMsg('Configuration saved successfully');
            fetchData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Save failed', error);
            setErrorMsg(error.response?.data?.message || 'Failed to update configuration.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Shipping Providers</h1>
                <p className="text-slate-600 mt-2">Configure and manage shipping integrations</p>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                </div>
            )}

            <div className="space-y-6">
                {providers.map(provider => {
                    const config = myConfigs.find(c => c.shipping_provider_id === provider.id);
                    return (
                        <ProviderItem
                            key={provider.id}
                            provider={provider}
                            config={config}
                            onSave={handleSave}
                            saving={saving === provider.id}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const ProviderItem = ({ provider, config, onSave, saving }) => {
    const [credentials, setCredentials] = useState(config?.credentials || {});
    const [isEnabled, setIsEnabled] = useState(config?.is_enabled ?? false);

    const handleFieldChange = (key, value) => {
        setCredentials(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${isEnabled ? 'bg-green-50' : 'bg-slate-50'}`}>
                        <Truck size={24} className={isEnabled ? 'text-green-600' : 'text-slate-400'} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{provider.name}</h3>
                        <p className="text-sm text-slate-500">{isEnabled ? 'Active' : 'Inactive'}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isEnabled
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {isEnabled ? <Check size={16} /> : <X size={16} />}
                    {isEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(provider.config_keys || []).map(key => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                {key.replace(/_/g, ' ')}
                            </label>
                            <input
                                type={key.includes('password') || key.includes('secret') || key.includes('key') ? 'password' : 'text'}
                                value={credentials[key] || ''}
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        onClick={() => onSave(provider.id, credentials, isEnabled)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShippingSettings;
