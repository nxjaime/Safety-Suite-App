import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfileData {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    avatarUrl: string;
}

const UserProfile: React.FC = () => {
    const [user, setUser] = useState<UserProfileData>({
        name: 'John Doe',
        title: 'Safety Manager',
        email: 'john.doe@safetyhub.com',
        phone: '555-0123',
        location: 'Denver, CO',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('safety_suite_user_profile');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleChange = (field: keyof UserProfileData, value: string) => {
        setUser(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        localStorage.setItem('safety_suite_user_profile', JSON.stringify(user));

        // Dispatch custom event so Header updates immediately
        window.dispatchEvent(new Event('userProfileUpdated'));

        toast.success('Profile updated successfully');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-green-700"></div>
                <div className="px-6 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative group">
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                            />
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
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
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
                                        value={user.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                                <select
                                    value={user.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                >
                                    <option value="Safety Manager">Safety Manager</option>
                                    <option value="Fleet Manager">Fleet Manager</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Dispatcher">Dispatcher</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={user.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                        value={user.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={user.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
                                <input
                                    type="text"
                                    value={user.avatarUrl}
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
