import React, { useState, useEffect } from 'react';
import { Truck, AlertTriangle, Wrench } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';

const Equipment: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'Vehicles' | 'Trailers' | 'Miscellaneous'>('Vehicles');
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [newAsset, setNewAsset] = useState({
        id: '',
        type: '',
        make: '',
        model: '',
        year: ''
    });

    const [vehicles, setVehicles] = useState([
        { id: 'TRK-101', type: 'Tractor', make: 'Freightliner', model: 'Cascadia', year: 2022, status: 'Active', nextService: '2023-11-15', category: 'Vehicles' },
        { id: 'TRK-102', type: 'Tractor', make: 'Volvo', model: 'VNL 860', year: 2021, status: 'Maintenance', nextService: '2023-10-20', category: 'Vehicles' },
        { id: 'TRL-501', type: 'Trailer', make: 'Wabash', model: 'Duraplate', year: 2020, status: 'Active', nextService: '2023-12-01', category: 'Trailers' },
        { id: 'TRK-103', type: 'Tractor', make: 'Peterbilt', model: '579', year: 2023, status: 'Active', nextService: '2024-01-10', category: 'Vehicles' },
        { id: 'TRL-502', type: 'Trailer', make: 'Great Dane', model: 'Champion', year: 2019, status: 'Inspection Due', nextService: '2023-10-15', category: 'Trailers' },
        { id: 'TAB-001', type: 'Tablet', make: 'Samsung', model: 'Tab A8', year: 2023, status: 'Active', nextService: 'N/A', category: 'Miscellaneous' },
        { id: 'CAM-001', type: 'Dash Cam', make: 'Samsara', model: 'CM32', year: 2023, status: 'Active', nextService: 'N/A', category: 'Miscellaneous' },
    ]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredVehicles = vehicles.filter(v => v.category === activeTab);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const types = await settingsService.getOptionsByCategory('vehicle_type');
                if (types && types.length > 0) {
                    setVehicleTypes(types.map(t => t.value));
                } else {
                    // Fallback defaults
                    setVehicleTypes(['Tractor', 'Trailer', 'Box Truck', 'Company Vehicle', 'Forklift']);
                }
            } catch (err) {
                console.error('Failed to load vehicle types', err);
                setVehicleTypes(['Tractor', 'Trailer', 'Box Truck', 'Company Vehicle', 'Forklift']);
            }
        };
        loadSettings();
    }, []);

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        const baseAsset = { ...newAsset, year: parseInt(newAsset.year), category: activeTab };

        if (editingId) {
            setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...baseAsset, category: v.category } : v));
            setEditingId(null);
            toast.success('Asset updated successfully');
        } else {
            setVehicles([...vehicles, { ...baseAsset, status: 'Active', nextService: 'Pending' }]);
            toast.success('Asset added successfully');
        }
        setIsModalOpen(false);
        setNewAsset({ id: '', type: '', make: '', model: '', year: '' });
    };

    const handleEdit = (vehicle: any) => {
        setNewAsset({
            id: vehicle.id,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.model || '',
            year: vehicle.year.toString()
        });
        setEditingId(vehicle.id);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setNewAsset({ id: '', type: '', make: '', model: '', year: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Equipment Management</h2>
                <button
                    onClick={openAddModal}
                    className="mt-6 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <Truck className="w-4 h-4 mr-2" />
                    Add {activeTab}
                </button>
            </div>

            <div className="flex space-x-4 border-b border-gray-200">
                {['Vehicles', 'Trailers', 'Miscellaneous'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={clsx(
                            'py-2 px-4 border-b-2 font-medium text-sm transition-colors',
                            activeTab === tab
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                        <Truck className="w-6 h-6 text-green-800" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total {activeTab}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{filteredVehicles.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full mr-4 border border-yellow-200">
                        <Wrench className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">In Maintenance</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {vehicles.filter(v => v.status === 'Maintenance').length}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Overdue Inspection</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {vehicles.filter(v => v.status === 'Inspection Due').length}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Vehicle List</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make/Model/Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{vehicle.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.nextService}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        vehicle.status === 'Active' ? "bg-green-100 text-green-800" :
                                            vehicle.status === 'Maintenance' ? "bg-yellow-100 text-yellow-800" :
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Asset" : "Add New Asset"}
            >
                <form onSubmit={handleAddAsset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="TRK-001"
                                value={newAsset.id}
                                onChange={(e) => setNewAsset({ ...newAsset, id: e.target.value })}
                                disabled={!!editingId}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Freightliner"
                                value={newAsset.make}
                                onChange={(e) => setNewAsset({ ...newAsset, make: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Cascadia"
                                value={newAsset.model}
                                onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input
                            type="number"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="2024"
                            value={newAsset.year}
                            onChange={(e) => setNewAsset({ ...newAsset, year: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
