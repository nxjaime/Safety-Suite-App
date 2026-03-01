import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertTriangle, Wrench, ClipboardList, FileText, CalendarClock, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';
import { workOrderService } from '../services/workOrderService';
import type { WorkOrder } from '../types';

export const equipmentProfileTabs = ['Overview', 'Inspections', 'Maintenance', 'Work Orders'] as const;

type EquipmentRow = {
    id: string;
    type: string;
    make: string;
    model: string;
    year: number;
    status: string;
    nextService: string;
    category: 'Trucks' | 'Trailers' | 'Forklifts' | 'Pallet Jacks' | 'Sales Vehicles';
    ownership: string;
    usageMiles: number;
    usageHours: number;
    attachments: string[];
    forkliftAttachments: string[];
};

const Equipment: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'Trucks' | 'Trailers' | 'Forklifts' | 'Pallet Jacks' | 'Sales Vehicles'>('Trucks');
    const [profileTab, setProfileTab] = useState<(typeof equipmentProfileTabs)[number]>('Overview');
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [newAsset, setNewAsset] = useState({
        id: '',
        type: '',
        make: '',
        model: '',
        year: '',
        ownership: 'owned',
        status: 'active',
        usageMiles: '',
        usageHours: '',
        attachments: '',
        forkliftAttachments: [] as string[]
    });

    const [vehicles, setVehicles] = useState<EquipmentRow[]>([
        { id: 'TRK-101', type: 'Truck', make: 'Freightliner', model: 'Cascadia', year: 2022, status: 'active', nextService: '2023-11-15', category: 'Trucks', ownership: 'owned', usageMiles: 182340, usageHours: 3200, attachments: ['Camera', 'Tablet'], forkliftAttachments: [] },
        { id: 'TRK-102', type: 'Truck', make: 'Volvo', model: 'VNL 860', year: 2021, status: 'maintenance', nextService: '2023-10-20', category: 'Trucks', ownership: 'leased', usageMiles: 140010, usageHours: 2600, attachments: ['Camera'], forkliftAttachments: [] },
        { id: 'TRL-501', type: 'Trailer', make: 'Wabash', model: 'Duraplate', year: 2020, status: 'active', nextService: '2023-12-01', category: 'Trailers', ownership: 'rented', usageMiles: 84500, usageHours: 0, attachments: [], forkliftAttachments: [] },
        { id: 'TRL-502', type: 'Trailer', make: 'Great Dane', model: 'Champion', year: 2019, status: 'out_of_service', nextService: '2023-10-15', category: 'Trailers', ownership: 'owned', usageMiles: 121300, usageHours: 0, attachments: [], forkliftAttachments: [] },
        { id: 'FRK-201', type: 'Forklift', make: 'Toyota', model: '8FGCU25', year: 2022, status: 'active', nextService: '2023-11-01', category: 'Forklifts', ownership: 'leased', usageMiles: 0, usageHours: 1120, attachments: [], forkliftAttachments: ['Forks', 'Box Clamp'] },
        { id: 'PAL-701', type: 'Pallet Jack', make: 'Crown', model: 'PTH50', year: 2021, status: 'active', nextService: '2023-12-08', category: 'Pallet Jacks', ownership: 'owned', usageMiles: 0, usageHours: 320, attachments: [], forkliftAttachments: [] },
        { id: 'SAL-401', type: 'Sales Vehicle', make: 'Ford', model: 'Transit', year: 2023, status: 'active', nextService: '2024-01-10', category: 'Sales Vehicles', ownership: 'owned', usageMiles: 18400, usageHours: 0, attachments: ['Camera'], forkliftAttachments: [] },
    ]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

    const filteredVehicles = vehicles.filter(v => v.category === activeTab);
    const openWorkOrders = workOrders.filter(o => !['Completed', 'Closed', 'Cancelled'].includes(o.status));
    const serviceHistory = workOrders.filter(o => o.status === 'Completed' || o.status === 'Closed');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const types = await settingsService.getOptionsByCategory('vehicle_type');
                if (types && types.length > 0) {
                    setVehicleTypes(types.map(t => t.value));
                } else {
                    setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
                }
            } catch (err) {
                console.error('Failed to load vehicle types', err);
                setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (profileTab === 'Work Orders') {
            workOrderService.getWorkOrders().then(setWorkOrders).catch(() => setWorkOrders([]));
        }
    }, [profileTab]);

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        const baseAsset = {
            ...newAsset,
            year: parseInt(newAsset.year),
            category: activeTab,
            usageMiles: newAsset.usageMiles ? parseInt(newAsset.usageMiles) : 0,
            usageHours: newAsset.usageHours ? parseInt(newAsset.usageHours) : 0,
            attachments: newAsset.attachments ? newAsset.attachments.split(',').map((item) => item.trim()).filter(Boolean) : [],
        };

        if (editingId) {
            setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...baseAsset, category: v.category } : v));
            setEditingId(null);
            toast.success('Asset updated successfully');
        } else {
            setVehicles([...vehicles, { ...baseAsset, status: baseAsset.status, nextService: 'Pending' }]);
            toast.success('Asset added successfully');
        }
        setIsModalOpen(false);
        setNewAsset({
            id: '',
            type: '',
            make: '',
            model: '',
            year: '',
            ownership: 'owned',
            status: 'active',
            usageMiles: '',
            usageHours: '',
            attachments: '',
            forkliftAttachments: []
        });
    };

    const handleEdit = (vehicle: any) => {
        setNewAsset({
            id: vehicle.id,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.model || '',
            year: vehicle.year.toString(),
            ownership: vehicle.ownership || 'owned',
            status: vehicle.status || 'active',
            usageMiles: vehicle.usageMiles?.toString() || '',
            usageHours: vehicle.usageHours?.toString() || '',
            attachments: vehicle.attachments?.join(', ') || '',
            forkliftAttachments: vehicle.forkliftAttachments || []
        });
        setEditingId(vehicle.id);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setNewAsset({
            id: '',
            type: '',
            make: '',
            model: '',
            year: '',
            ownership: 'owned',
            status: 'active',
            usageMiles: '',
            usageHours: '',
            attachments: '',
            forkliftAttachments: []
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8" data-testid="equipment-page">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Equipment Command Center</h2>
                        <p className="mt-1 text-sm text-slate-500">Manage fleet assets, inspection readiness, and service posture across all equipment types.</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm"
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        Add {activeTab}
                    </button>
                </div>
            </section>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {(['Trucks', 'Trailers', 'Forklifts', 'Pallet Jacks', 'Sales Vehicles'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={clsx(
                            'py-2 px-4 border-b-2 font-medium text-sm transition-colors',
                            activeTab === tab
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {equipmentProfileTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setProfileTab(tab)}
                        className={clsx(
                            'py-2 px-4 rounded-md text-sm font-medium transition-colors',
                            profileTab === tab
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {profileTab === 'Overview' && (
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                        <Truck className="w-6 h-6 text-green-800" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total {activeTab}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{filteredVehicles.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full mr-4 border border-yellow-200">
                        <Wrench className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">In Maintenance</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {vehicles.filter(v => v.status === 'maintenance').length}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Overdue Inspection</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {vehicles.filter(v => v.status === 'out_of_service').length}
                        </h3>
                    </div>
                </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Vehicle List</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Make/Model/Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ownership</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{vehicle.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{vehicle.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{vehicle.ownership}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{vehicle.nextService}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        vehicle.status === 'active' ? "bg-green-100 text-green-800" :
                                            vehicle.status === 'maintenance' ? "bg-yellow-100 text-yellow-800" :
                                                "bg-red-100 text-red-800"
                                    )}>
                                        {vehicle.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(vehicle)}
                                        className="text-green-700 hover:text-green-900 font-medium"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            )}

            {profileTab === 'Inspections' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Inspection History</h3>
                            <p className="text-sm text-slate-500">Type-specific templates surface here once connected.</p>
                        </div>
                        <button className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Start Inspection
                        </button>
                    </div>
                    <div className="text-sm text-slate-500">No inspections recorded for this equipment yet.</div>
                </div>
            )}

            {profileTab === 'Maintenance' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Maintenance Schedule</h3>
                            <p className="text-sm text-slate-500">Upcoming preventive maintenance by time, miles, or hours.</p>
                        </div>
                        <button className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50">
                            <CalendarClock className="w-4 h-4 inline mr-2" />
                            Schedule Service
                        </button>
                    </div>
                    <div className="text-sm text-slate-500">No maintenance items due.</div>
                </div>
            )}

            {profileTab === 'Work Orders' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Open Work Orders</h3>
                                <p className="text-sm text-slate-500">Track repairs and service requests.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/work-orders')}
                                className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 inline-flex items-center"
                            >
                                <ClipboardList className="w-4 h-4 inline mr-2" />
                                Create Work Order
                            </button>
                        </div>
                        {openWorkOrders.length === 0 ? (
                            <p className="text-sm text-slate-500">No active work orders.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {openWorkOrders.slice(0, 10).map((wo) => (
                                    <li key={wo.id} className="py-2 flex justify-between items-center">
                                        <span className="font-medium text-slate-900">{wo.title}</span>
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{wo.status}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold text-slate-800">Service History</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">Completed maintenance and repairs (roll-up from work orders).</p>
                        {serviceHistory.length === 0 ? (
                            <p className="text-sm text-slate-500">No completed work orders yet.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {serviceHistory.slice(0, 15).map((wo) => (
                                    <li key={wo.id} className="py-2 flex justify-between items-center">
                                        <span className="text-slate-700">{wo.title}</span>
                                        <span className="text-xs text-slate-500">{wo.completedAt ? new Date(wo.completedAt).toLocaleDateString() : wo.status}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Asset" : "Add New Asset"}
            >
                <form onSubmit={handleAddAsset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID</label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="TRK-001"
                                value={newAsset.id}
                                onChange={(e) => setNewAsset({ ...newAsset, id: e.target.value })}
                                disabled={!!editingId}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newAsset.type}
                            onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                        >
                            <option value="">Select Type</option>
                            {vehicleTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ownership</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAsset.ownership}
                                onChange={(e) => setNewAsset({ ...newAsset, ownership: e.target.value })}
                            >
                                <option value="owned">Owned</option>
                                <option value="leased">Leased</option>
                                <option value="rented">Rented</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAsset.status}
                                onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="out_of_service">Out of Service</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Freightliner"
                                value={newAsset.make}
                                onChange={(e) => setNewAsset({ ...newAsset, make: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Cascadia"
                                value={newAsset.model}
                                onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                        <input
                            type="number"
                            required
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="2024"
                            value={newAsset.year}
                            onChange={(e) => setNewAsset({ ...newAsset, year: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usage (Miles)</label>
                            <input
                                type="number"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="125000"
                                value={newAsset.usageMiles}
                                onChange={(e) => setNewAsset({ ...newAsset, usageMiles: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usage (Hours)</label>
                            <input
                                type="number"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="1200"
                                value={newAsset.usageHours}
                                onChange={(e) => setNewAsset({ ...newAsset, usageHours: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Attachments (cameras, tablets)</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Camera, Tablet"
                            value={newAsset.attachments}
                            onChange={(e) => setNewAsset({ ...newAsset, attachments: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Forklift Attachments</label>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                            {['Low Mast', 'Forks', 'Box Clamp', 'Extended Forks', 'Boom'].map((option) => (
                                <label key={option} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={newAsset.forkliftAttachments.includes(option)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setNewAsset({ ...newAsset, forkliftAttachments: [...newAsset.forkliftAttachments, option] });
                                            } else {
                                                setNewAsset({ ...newAsset, forkliftAttachments: newAsset.forkliftAttachments.filter(item => item !== option) });
                                            }
                                        }}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            {editingId ? "Save Changes" : "Add Asset"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Equipment;
