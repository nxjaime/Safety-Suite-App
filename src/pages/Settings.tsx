import React, { useState, useEffect } from 'react';
import { Plus, User, Database, Trash2, Truck, Building, RefreshCw, Settings2, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import Modal from '../components/UI/Modal';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { orgManagementService, type OrgUser } from '../services/orgManagementService';
import { settingsService } from '../services/settingsService';
import type { SystemOption } from '../services/settingsService';
import { carrierService, type CarrierSettings } from '../services/carrierService';
import type { ProfileRole } from '../services/authorizationService';
import { canAccessPlatformAdmin, getRoleCapabilities } from '../services/authorizationService';

const ROLE_LABELS: Record<string, string> = {
    platform_admin: 'Platform Admin',
    full: 'Full Access',
    safety: 'Safety Manager',
    coaching: 'Coaching Manager',
    maintenance: 'Maintenance Manager',
    readonly: 'Read Only',
};

const ASSIGNABLE_ROLES: ProfileRole[] = [
    'full',
    'safety',
    'coaching',
    'maintenance',
    'readonly',
];

const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const Settings: React.FC = () => {
    const { role } = useAuth();
    const isAdmin = canAccessPlatformAdmin(role) || getRoleCapabilities(role).canManageOrgSettings;
    const [activeTab, setActiveTab] = useState<'users' | 'system' | 'carrier'>('users');

    // User Management State — from Supabase via orgManagementService
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roleChangeTarget, setRoleChangeTarget] = useState<OrgUser | null>(null);
    const [selectedNewRole, setSelectedNewRole] = useState<ProfileRole>('readonly');

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

    // Load users from Supabase
    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await orgManagementService.listUsers(role);
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    // Fetch Options
    useEffect(() => {
        if (activeTab === 'users' && isAdmin) {
            loadUsers();
        }
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
    const handleRoleChange = async () => {
        if (!roleChangeTarget) return;
        try {
            await orgManagementService.updateUserRole(role, roleChangeTarget.id, selectedNewRole, roleChangeTarget.email);
            toast.success(`Role updated to ${ROLE_LABELS[selectedNewRole]}`);
            setRoleChangeTarget(null);
            loadUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update role');
        }
    };

    const handleToggleStatus = async (user: OrgUser) => {
        try {
            if (user.status === 'active') {
                await orgManagementService.deactivateUser(role, user.id, user.email);
                toast.success(`${user.fullName || user.email} deactivated`);
            } else {
                await orgManagementService.reactivateUser(role, user.id, user.email);
                toast.success(`${user.fullName || user.email} reactivated`);
            }
            loadUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update user status');
        }
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
                    <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage application users, system data, and carrier configuration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center",
                            activeTab === 'users'
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in organization</p>
                        <button
                            onClick={loadUsers}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Sign-in</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usersLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">Loading users...</td>
                                    </tr>
                                )}
                                {!usersLoading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">No users found.</td>
                                    </tr>
                                )}
                                {!usersLoading && users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                                    {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{user.fullName || 'Unnamed'}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2.5 py-0.5 inline-flex items-center text-xs font-semibold rounded-full",
                                                user.status === 'active' ? "bg-green-100 text-green-800" :
                                                user.status === 'invited' ? "bg-blue-100 text-blue-800" :
                                                "bg-slate-100 text-slate-600"
                                            )}>
                                                {user.status === 'active' && <UserCheck className="mr-1 h-3 w-3" />}
                                                {user.status === 'deactivated' && <UserMinus className="mr-1 h-3 w-3" />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(user.lastSignIn)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isAdmin && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setRoleChangeTarget(user);
                                                            setSelectedNewRole(user.role as ProfileRole);
                                                        }}
                                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                        title="Change role"
                                                    >
                                                        <Settings2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={clsx(
                                                            'rounded-lg border px-3 py-1.5 text-xs font-medium',
                                                            user.status === 'active'
                                                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
                                                        )}
                                                        title={user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                                    >
                                                        {user.status === 'active' ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>
                                            )}
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
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-slate-700">Select Data Type:</span>
                            <select
                                className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Label</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">Loading...</td>
                                    </tr>
                                )}
                                {!loading && systemOptions.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {item.label}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
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
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">
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
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center mb-6">
                            <div className="p-3 bg-green-100 rounded-full mr-4">
                                <Building className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Carrier Information</h3>
                                <p className="text-sm text-slate-500">Enter your USDOT and MC numbers to enable carrier health monitoring</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCarrierSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter company name"
                                        value={carrierSettings.companyName || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, companyName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">USDOT Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g. 1234567"
                                        value={carrierSettings.dotNumber || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, dotNumber: e.target.value })}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Your 7-digit FMCSA USDOT number</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">MC Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g. MC-123456"
                                        value={carrierSettings.mcNumber || ''}
                                        onChange={(e) => setCarrierSettings({ ...carrierSettings, mcNumber: e.target.value })}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Motor carrier operating authority number</p>
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

            {/* Role Change Modal */}
            <Modal
                isOpen={!!roleChangeTarget}
                onClose={() => setRoleChangeTarget(null)}
                title="Change User Role"
            >
                {roleChangeTarget && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Updating role for <span className="font-semibold">{roleChangeTarget.fullName || roleChangeTarget.email}</span>
                        </p>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">New Role</label>
                            <select
                                value={selectedNewRole}
                                onChange={(e) => setSelectedNewRole(e.target.value as ProfileRole)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {ASSIGNABLE_ROLES.map((r) => (
                                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRoleChangeTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleRoleChange} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Update Role</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add System Data Modal */}
            <Modal
                isOpen={isDataModalOpen}
                onClose={() => setIsDataModalOpen(false)}
                title={`Add New Option`}
            >
                <form onSubmit={handleAddSystemData} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name / Label</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter option name..."
                            value={newDataItem.label}
                            onChange={(e) => setNewDataItem({ ...newDataItem, label: e.target.value })}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Adding to category: <span className="font-semibold">{systemDataType.replace('_', ' ')}</span>
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsDataModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
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
