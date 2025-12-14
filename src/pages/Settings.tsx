import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, User, Mail, Shield, Lock, Database, Trash2, Truck, Building } from 'lucide-react';
import Modal from '../components/UI/Modal';
import clsx from 'clsx';

interface AppUser {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Viewer';
    status: 'Active' | 'Inactive';
    lastLogin: string;
}

const initialUsers: AppUser[] = [
    { id: '1', name: 'Sarah Connor', email: 'sarah.connor@safetyhub.com', role: 'Admin', status: 'Active', lastLogin: '2023-10-24 09:15 AM' },
    { id: '2', name: 'John Smith', email: 'john.smith@safetyhub.com', role: 'Manager', status: 'Active', lastLogin: '2023-10-23 04:30 PM' },
    { id: '3', name: 'Emily Chen', email: 'emily.chen@safetyhub.com', role: 'Viewer', status: 'Inactive', lastLogin: '2023-09-15 11:00 AM' },
];

import { settingsService } from '../services/settingsService';
import type { SystemOption } from '../services/settingsService';
import { carrierService, type CarrierSettings } from '../services/carrierService';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'system' | 'carrier'>('users');

    // User Management State
    const [users, setUsers] = useState<AppUser[]>(initialUsers);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'Viewer' as 'Admin' | 'Manager' | 'Viewer',
        password: ''
    });

    // System Data State
    const [systemDataType, setSystemDataType] = useState<'vehicle_type' | 'training_module' | 'risk_type'>('vehicle_type');
    const [systemOptions, setSystemOptions] = useState<SystemOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [newDataItem, setNewDataItem] = useState({ label: '', value: '' });

    // Carrier Settings State
    const [carrierSettings, setCarrierSettings] = useState<CarrierSettings>({
        dotNumber: '',
        mcNumber: '',
        companyName: ''
    });
    const [savingCarrier, setSavingCarrier] = useState(false);

    // Fetch Options
    useEffect(() => {
        if (activeTab === 'system') {
            fetchOptions();
        }
        if (activeTab === 'carrier') {
            loadCarrierSettings();
        }
    }, [activeTab, systemDataType]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getOptionsByCategory(systemDataType);
            setSystemOptions(data || []);
        } catch (error) {
            console.error('Failed to fetch system options', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCarrierSettings = async () => {
        try {
            const settings = await carrierService.getCarrierSettings();
            if (settings) {
                setCarrierSettings(settings);
            }
        } catch (error) {
            console.error('Failed to load carrier settings', error);
        }
    };

    // User Handlers
    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const user: AppUser = {
            id: (users.length + 1).toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: 'Active',
            lastLogin: 'Never'
        };
        setUsers([...users, user]);
        setIsUserModalOpen(false);
        setNewUser({ name: '', email: '', role: 'Viewer', password: '' });
        toast.success(`User ${user.name} added successfully!`);
    };

    // System Data Handlers
    const handleAddSystemData = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await settingsService.addOption({
                category: systemDataType,
                label: newDataItem.label,
                value: newDataItem.label,
            });
            await fetchOptions();
            setIsDataModalOpen(false);
            setNewDataItem({ label: '', value: '' });
            toast.success('Item added successfully');
        } catch (error) {
            console.error('Failed to add item', error);
            toast.error('Failed to add item');
        }
    };

    const handleDeleteSystemData = async (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await settingsService.deleteOption(id);
                setSystemOptions(systemOptions.filter(i => i.id !== id));
                toast.success('Item deleted');
            } catch (error) {
                console.error('Failed to delete', error);
                toast.error('Failed to delete item');
            }
        }
    };

    // Carrier Settings Handler
    const handleSaveCarrierSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCarrier(true);
        try {
            await carrierService.saveCarrierSettings({
                id: 'default',
                ...carrierSettings
            });
            toast.success('Carrier settings saved successfully');
        } catch (error: any) {
            console.error('Failed to save carrier settings', error);
            toast.error(error.message || 'Failed to save carrier settings');
        } finally {
            setSavingCarrier(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage application users, system data, and carrier configuration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center",
                            activeTab === 'users'
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <User className="w-4 h-4 mr-2" />
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center",
                            activeTab === 'system'
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <Database className="w-4 h-4 mr-2" />
                        System Data
                    </button>
                    <button
                        onClick={() => setActiveTab('carrier')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center",
                            activeTab === 'carrier'
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        Carrier Settings
                    </button>
                </nav>
            </div>

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                user.role === 'Admin' ? "bg-purple-100 text-purple-800" :
                                                    user.role === 'Manager' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                user.status === 'Active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            )}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.lastLogin}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* System Data Tab */}
            {activeTab === 'system' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Select Data Type:</span>
                            <select
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={systemDataType}
                                onChange={(e) => setSystemDataType(e.target.value as any)}
                            >
                                <option value="vehicle_type">Vehicle Types</option>
                                <option value="training_module">Training Modules</option>
                                <option value="risk_type">Risk Types</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setIsDataModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                    </tr>
                                )}
                                {!loading && systemOptions.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.label}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {item.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteSystemData(item.id)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && systemOptions.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No options found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Carrier Settings Tab */}
            {activeTab === 'carrier' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center mb-6">
                            <div className="p-3 bg-green-100 rounded-full mr-4">
                                <Building className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Carrier Information</h3>
                                <p className="text-sm text-gray-500">Enter your USDOT and MC numbers to enable carrier health monitoring</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCarrierSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter company name"
                                        value={carrierSettings.companyName || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, companyName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">USDOT Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g. 1234567"
                                        value={carrierSettings.dotNumber || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, dotNumber: e.target.value })}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Your 7-digit FMCSA USDOT number</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">MC Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g. MC-123456"
                                        value={carrierSettings.mcNumber || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, mcNumber: e.target.value })}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Motor carrier operating authority number</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">About Carrier Health Monitoring</h4>
                                <p className="text-sm text-blue-700">
                                    Once you save your USDOT number, SafetyHub Connect will automatically fetch your SAFER rating and CSA scores
                                    from FMCSA. This information will be displayed in the Carrier Health section of the sidebar for quick access.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingCarrier}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
                                >
                                    {savingCarrier ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Carrier Settings'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Add New User"
            >
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Jane Doe"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="email"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="jane@company.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                            >
                                <option value="Viewer">Viewer (Read Only)</option>
                                <option value="Manager">Manager (Edit Access)</option>
                                <option value="Admin">Admin (Full Access)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="password"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="••••••••"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsUserModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add System Data Modal */}
            <Modal
                isOpen={isDataModalOpen}
                onClose={() => setIsDataModalOpen(false)}
                title={`Add New Option`}
            >
                <form onSubmit={handleAddSystemData} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name / Label</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter option name..."
                            value={newDataItem.label}
                            onChange={(e) => setNewDataItem({ ...newDataItem, label: e.target.value })}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Adding to category: <span className="font-semibold">{systemDataType.replace('_', ' ')}</span>
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsDataModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Add Option
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
