import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import { Save, Loader2, CheckCircle2, AlertCircle, Upload, FileText, Truck } from 'lucide-react';

const ProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: ''
    });

    const [csvFile, setCsvFile] = useState(null);
    const [csvLoading, setCsvLoading] = useState(false);
    const [csvSuccess, setCsvSuccess] = useState('');
    const [csvError, setCsvError] = useState('');
    
    // Shiprocket Pickup State
    const [pickupLoading, setPickupLoading] = useState(false);
    const [pickupData, setPickupData] = useState({
        pickup_location: '',
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        address_2: '',
        city: '',
        state: '',
        country: 'India',
        pin_code: ''
    });

    const roles = Array.isArray(user?.role) ? user.role : [user?.role];
    const isSchool = roles.includes('school');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccess(false);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
            };

            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password_confirmation;
            }

            const res = await api.post('/auth/profile', payload);

            if (res.data?.user) {
                updateUser({ name: res.data.user.name, email: res.data.user.email });
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
        } catch (error) {
            console.error('Update failed', error);
            setErrorMsg(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) return;
        setCsvLoading(true);
        setCsvSuccess('');
        setCsvError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('file', csvFile);

            const res = await api.post('/school/import-students', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setCsvSuccess(res.data?.message || 'Data imported successfully');
            setCsvFile(null);
            const uploadInput = document.getElementById('csv-upload');
            if (uploadInput) uploadInput.value = '';
        } catch (error) {
            console.error('CSV upload failed', error);
            setCsvError(error.response?.data?.message || error.response?.data?.error || 'Failed to import data.');
        } finally {
            setCsvLoading(false);
        }
    };

    const handlePickupSubmit = async (e) => {
        e.preventDefault();
        setPickupLoading(true);
        setCsvError(''); // Reusing csvError for simplicity or use a new one
        
        try {
            const res = await api.post('/supplier/save-pickup-location', pickupData);
            
            // Success! Update local user session to reflect the nickname
            if (user.supplier) {
                updateUser({
                    supplier: {
                        ...user.supplier,
                        shiprocket_pickup_nickname: pickupData.pickup_location,
                        shiprocket_pickup_snapshot: res.data.pickup_snapshot ?? user.supplier.shiprocket_pickup_snapshot,
                    },
                });
            }
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Pickup save failed', error);
            setErrorMsg(error.response?.data?.error || 'Failed to save pickup location to Shiprocket.');
        } finally {
            setPickupLoading(false);
        }
    };

    const userRoleDisplay = (user?.primaryRole || user?.role || 'User').toString().replace('_', ' ');

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-slate-600 mt-2">Manage your account and security settings</p>
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
                    <span>Profile updated successfully</span>
                </div>
            )}

            <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Account Information</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
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
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {roles.includes('supplier') && (
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Truck className="text-blue-600" size={24} />
                            <h2 className="text-lg font-bold text-slate-900">Shiprocket Pickup Location</h2>
                        </div>
                        
                        {user.supplier?.shiprocket_pickup_nickname ? (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                                <p className="text-sm font-bold text-blue-900">
                                    Location nickname:{' '}
                                    <span className="bg-white px-2 py-0.5 rounded border border-blue-200 ml-1 uppercase tracking-wider">
                                        {user.supplier.shiprocket_pickup_nickname}
                                    </span>
                                </p>
                                {user.supplier.shiprocket_pickup_snapshot && (
                                    <div className="mt-3 pt-3 border-t border-blue-200/70 text-sm text-slate-800 space-y-2">
                                        <p className="font-semibold text-slate-900">Registered pickup details</p>
                                        <p className="leading-relaxed">
                                            {[user.supplier.shiprocket_pickup_snapshot.address, user.supplier.shiprocket_pickup_snapshot.address_2]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                        <p>
                                            {[user.supplier.shiprocket_pickup_snapshot.city, user.supplier.shiprocket_pickup_snapshot.state, user.supplier.shiprocket_pickup_snapshot.pin_code]
                                                .filter(Boolean)
                                                .join(', ')}
                                            {user.supplier.shiprocket_pickup_snapshot.country
                                                ? ` · ${user.supplier.shiprocket_pickup_snapshot.country}`
                                                : ''}
                                        </p>
                                        <p>
                                            <span className="text-slate-600">Contact:</span>{' '}
                                            {user.supplier.shiprocket_pickup_snapshot.name}
                                            {user.supplier.shiprocket_pickup_snapshot.phone
                                                ? ` · ${user.supplier.shiprocket_pickup_snapshot.phone}`
                                                : ''}
                                            {user.supplier.shiprocket_pickup_snapshot.email
                                                ? ` · ${user.supplier.shiprocket_pickup_snapshot.email}`
                                                : ''}
                                        </p>
                                        {user.supplier.shiprocket_pickup_snapshot.saved_at && (
                                            <p className="text-xs text-slate-500">
                                                Saved on{' '}
                                                {new Date(user.supplier.shiprocket_pickup_snapshot.saved_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {!user.supplier.shiprocket_pickup_snapshot && (
                                    <p className="text-xs text-blue-800/80">
                                        Full address details are not stored for this nickname (saved before this update). New
                                        registrations will show the full address here.
                                    </p>
                                )}
                                <p className="text-xs text-blue-700 italic opacity-90">
                                    * This location is already verified in Shiprocket. To change it, please contact platform support.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
                                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold uppercase tracking-wide">Important Verification Warning</p>
                                        <p className="mt-1 opacity-90 leading-relaxed font-medium">Please ensure all details are <span className="text-red-600 font-extrabold underline underline-offset-2">100% accurate</span>. Once registered, this pickup location nickname <span className="font-bold text-slate-900 underline underline-offset-2 decoration-amber-500/50">cannot be changed</span> via this panel. Incorrect information may result in failed pickup requests.</p>
                                    </div>
                                </div>
                                <form onSubmit={handlePickupSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Location Nickname (e.g. Warehouse-1)</label>
                                        <input
                                            type="text"
                                            value={pickupData.pickup_location}
                                            onChange={(e) => setPickupData({ ...pickupData, pickup_location: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-400"
                                            placeholder="Enter unique name for this location"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Contact Name</label>
                                        <input
                                            type="text"
                                            value={pickupData.name}
                                            onChange={(e) => setPickupData({ ...pickupData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="Shipper Name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={pickupData.phone}
                                            onChange={(e) => setPickupData({ ...pickupData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="10-digit number"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={pickupData.email}
                                            onChange={(e) => setPickupData({ ...pickupData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="shipper@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Pickup Address</label>
                                        <textarea
                                            rows="3"
                                            value={pickupData.address}
                                            onChange={(e) => setPickupData({ ...pickupData, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="Full street address, building info..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">City</label>
                                        <input
                                            type="text"
                                            value={pickupData.city}
                                            onChange={(e) => setPickupData({ ...pickupData, city: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Pincode</label>
                                        <input
                                            type="text"
                                            value={pickupData.pin_code}
                                            onChange={(e) => setPickupData({ ...pickupData, pin_code: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">State</label>
                                        <input
                                            type="text"
                                            value={pickupData.state}
                                            onChange={(e) => setPickupData({ ...pickupData, state: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-1.5">Country</label>
                                        <input
                                            type="text"
                                            value={pickupData.country}
                                            onChange={(e) => setPickupData({ ...pickupData, country: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={pickupLoading}
                                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 transition-all disabled:opacity-50"
                                    >
                                        {pickupLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Registering in Shiprocket...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Add Pickup Location
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}

                {isSchool && (
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Import Students (CSV)</h2>
                        <p className="text-sm text-slate-600 mb-6">Upload a CSV file with columns: Name, Email, Password</p>

                        {csvSuccess && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                {csvSuccess}
                            </div>
                        )}

                        {csvError && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {csvError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">Select CSV File</label>
                                <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                    <div className="text-center">
                                        {csvFile ? (
                                            <>
                                                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                                <p className="text-sm font-medium text-slate-900">{csvFile.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="text-sm text-slate-600">Click to select CSV file</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="csv-upload"
                                        accept=".csv"
                                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleCsvUpload}
                                disabled={!csvFile || csvLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {csvLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Import Students
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Account Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Name:</span>
                            <span className="text-sm font-medium text-slate-900">{user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Email:</span>
                            <span className="text-sm font-medium text-slate-900">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Role:</span>
                            <span className="text-sm font-medium text-slate-900">{userRoleDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
