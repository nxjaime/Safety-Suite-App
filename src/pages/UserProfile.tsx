import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { profileService, type ProfileUpdates } from '../services/profileService';

interface FormState {
    fullName: string;
    title: string;
    phone: string;
    location: string;
    avatarUrl: string;
}

const UserProfile: React.FC = () => {
    const { user } = useAuth();
    const [form, setForm] = useState<FormState>({
        fullName: '',
        title: '',
        phone: '',
        location: '',
        avatarUrl: '',
    });
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        profileService.getExtendedProfile().then((profile) => {
            if (cancelled || !profile) return;
            setEmail(profile.email);
            setForm({
                fullName: profile.fullName,
                title: profile.title,
                phone: profile.phone,
                location: profile.location,
                avatarUrl: profile.avatarUrl,
            });
            setLoading(false);
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const handleChange = (field: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates: ProfileUpdates = {
                fullName: form.fullName,
                title: form.title,
                phone: form.phone,
                location: form.location,
                avatarUrl: form.avatarUrl,
            };
            await profileService.updateProfile(updates);
            window.dispatchEvent(new Event('userProfileUpdated'));
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const displayName = form.fullName || user?.email || 'User';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-green-700"></div>
                <div className="px-6 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative group">
                            {form.avatarUrl ? (
                                <img
                                    src={form.avatarUrl}
                                    alt={displayName}
                                    className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-green-100 flex items-center justify-center">
                                    <User className="w-10 h-10 text-green-600" />
                                </div>
                            )}
                            <button
                                onClick={() => document.getElementById('profile-photo-input')?.click()}
                                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600 cursor-pointer"
                                title="Change profile picture"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                id="profile-photo-input"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            handleChange('avatarUrl', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g. Safety Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="555-0123"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="City, State"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
                                <input
                                    type="text"
                                    value={form.avatarUrl}
                                    onChange={(e) => handleChange('avatarUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-slate-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
