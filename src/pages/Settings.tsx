import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, User, Mail, Shield, Lock, Database, Trash2 } from 'lucide-react';
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

interface SystemDataItem {
    id: string;
    name: string;
    description: string;
    category: string;
}

const initialUsers: AppUser[] = [
    { id: '1', name: 'Sarah Connor', email: 'sarah.connor@safetyhub.com', role: 'Admin', status: 'Active', lastLogin: '2023-10-24 09:15 AM' },
    { id: '2', name: 'John Smith', email: 'john.smith@safetyhub.com', role: 'Manager', status: 'Active', lastLogin: '2023-10-23 04:30 PM' },
    { id: '3', name: 'Emily Chen', email: 'emily.chen@safetyhub.com', role: 'Viewer', status: 'Inactive', lastLogin: '2023-09-15 11:00 AM' },
];

const initialVehicleTypes: SystemDataItem[] = [
    { id: '1', name: 'Tractor', description: 'Class 8 Heavy Duty Tractor', category: 'Vehicle' },
    { id: '2', name: 'Trailer', description: '53ft Dry Van Trailer', category: 'Vehicle' },
    { id: '3', name: 'Box Truck', description: '26ft Box Truck', category: 'Vehicle' },
];

const initialTrainingModules: SystemDataItem[] = [
    { id: '1', name: 'Defensive Driving', description: 'Core safety principles for all drivers', category: 'Training' },
    { id: '2', name: 'HOS Compliance', description: 'Hours of Service regulations and logging', category: 'Training' },
    { id: '3', name: 'Pre-Trip Inspection', description: 'Proper vehicle inspection procedures', category: 'Training' },
];

const initialEventTypes: SystemDataItem[] = [
    { id: '1', name: 'Accident', description: 'Vehicle collision or incident', category: 'Event' },
    { id: '2', name: 'Citation', description: 'Traffic violation or warning', category: 'Event' },
    { id: '3', name: 'Observation', description: 'Behavioral observation by safety manager', category: 'Event' },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');

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
    const [systemDataType, setSystemDataType] = useState<'vehicle' | 'training' | 'event'>('vehicle');
    const [vehicleTypes, setVehicleTypes] = useState<SystemDataItem[]>(initialVehicleTypes);
    const [trainingModules, setTrainingModules] = useState<SystemDataItem[]>(initialTrainingModules);
    const [eventTypes, setEventTypes] = useState<SystemDataItem[]>(initialEventTypes);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [newDataItem, setNewDataItem] = useState({ name: '', description: '' });

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
        alert(`User ${user.name} added successfully!`);
    };

    // System Data Handlers
    const getCurrentDataList = () => {
        switch (systemDataType) {
            case 'vehicle': return vehicleTypes;
            case 'training': return trainingModules;
            case 'event': return eventTypes;
            default: return [];
        }
    };

    const handleAddSystemData = (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: SystemDataItem = {
            id: Date.now().toString(),
            name: newDataItem.name,
            description: newDataItem.description,
            category: systemDataType === 'vehicle' ? 'Vehicle' : systemDataType === 'training' ? 'Training' : 'Event'
        };

        if (systemDataType === 'vehicle') setVehicleTypes([...vehicleTypes, newItem]);
        else if (systemDataType === 'training') setTrainingModules([...trainingModules, newItem]);
        else setEventTypes([...eventTypes, newItem]);

        setIsDataModalOpen(false);
        setNewDataItem({ name: '', description: '' });
    };

    const handleDeleteSystemData = (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            if (systemDataType === 'vehicle') setVehicleTypes(vehicleTypes.filter(i => i.id !== id));
            else if (systemDataType === 'training') setTrainingModules(trainingModules.filter(i => i.id !== id));
            else setEventTypes(eventTypes.filter(i => i.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage application users and system data configuration</p>
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
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div className="relative max-w-md w-full">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                                />
                            </div>
                        </div>

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
                                <option value="vehicle">Vehicle Types</option>
                                <option value="training">Training Modules</option>
                                <option value="event">Event Types</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setIsDataModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add {systemDataType === 'vehicle' ? 'Vehicle Type' : systemDataType === 'training' ? 'Module' : 'Event Type'}
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentDataList().map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {item.category}
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
                                {getCurrentDataList().length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No data available. Add a new item to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                title={`Add New ${systemDataType === 'vehicle' ? 'Vehicle Type' : systemDataType === 'training' ? 'Training Module' : 'Event Type'}`}
            >
                <form onSubmit={handleAddSystemData} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        {systemDataType === 'vehicle' ? (
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newDataItem.name}
                                onChange={(e) => setNewDataItem({ ...newDataItem, name: e.target.value })}
                            >
                                <option value="">Select a vehicle type...</option>
                                <option value="Tractor">Tractor</option>
                                <option value="Trailer">Trailer</option>
                                <option value="Box Truck">Box Truck</option>
                                <option value="Straight Truck">Straight Truck</option>
                                <option value="Van">Van</option>
                                <option value="Flatbed">Flatbed</option>
                                <option value="Refrigerated">Refrigerated</option>
                                <option value="Tanker">Tanker</option>
                                <option value="Dump Truck">Dump Truck</option>
                                <option value="Other">Other</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder={systemDataType === 'training' ? 'e.g., Hazmat Safety' : 'e.g., Near Miss'}
                                value={newDataItem.name}
                                onChange={(e) => setNewDataItem({ ...newDataItem, name: e.target.value })}
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={3}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter a brief description..."
                            value={newDataItem.description}
                            onChange={(e) => setNewDataItem({ ...newDataItem, description: e.target.value })}
                        />
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
                            Add Item
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
