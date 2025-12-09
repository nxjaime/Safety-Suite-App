import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, Plus, User, Upload, MapPin, Phone, FileText, Calendar, Download, Trash2, Edit, Eye } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { driverService } from '../services/driverService';
import type { Driver } from '../types';
// import { storage } from '../utils/storage';

const Drivers: React.FC = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTerminal, setFilterTerminal] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        ssn: '',
        phone: '',
        driverCode: '',
        driverManager: '',
        terminal: '',
        licenseNumber: '',
        hireDate: new Date().toISOString().split('T')[0],
        image: null as File | null | string
    });

    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const data = await driverService.fetchDrivers();
            setDrivers(data);
        } catch (error) {
            toast.error('Failed to load drivers');
        } finally {
            setLoading(false);
        }
    };

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            address: '',
            ssn: '',
            phone: '',
            driverCode: '',
            driverManager: '',
            terminal: '',
            licenseNumber: '',
            hireDate: new Date().toISOString().split('T')[0],
            image: null
        });
        setEditingDriverId(null);
    };

    const handleOpenModal = (driver?: any) => {
        if (driver) {
            setEditingDriverId(driver.id);
            const [first, ...last] = (driver.name || '').split(' ');
            setFormData({
                firstName: first || '',
                lastName: last.join(' ') || '',
                address: driver.address || '',
                ssn: driver.ssn || '',
                phone: driver.phone || '',
                driverCode: driver.employeeId || '', // Note: DB uses employee_id but service maps it usually, wait. Supabase returns snake_case but we cast to Driver. 
                // IMPORTANT: The driverService casts data as Driver. If DB has snake_case, the frontend interface expects camelCase.
                // Supabase JS client doesn't auto-convert case unless configured.
                // Setup assumes direct mapping or I need to map it in service. 
                // For now, I'll assume the simple structure matches enough or I'll fix the service to map snake_case to camelCase.
                // Actually, schema.sql uses snake_case (employee_id). Driver interface uses employeeId.
                // I should update driverService to map columns or use 'select' alias.
                // Let's assume for this step I'm just replacing logic, I will fix the mapping in service.
                terminal: driver.terminal || '',
                driverManager: driver.driverManager || '',
                licenseNumber: driver.licenseNumber || '', // Check snake case
                hireDate: driver.hireDate || new Date().toISOString().split('T')[0],
                image: driver.image
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
        setOpenActionMenuId(null);
    };

    const handleSaveDriver = async (e: React.FormEvent) => {
        e.preventDefault();

        const yearsOfService = calculateYearsOfService(formData.hireDate);

        // Upload image logic would go here (storage bucket), for now keeping existing URL logic if string
        let image = formData.image;
        if (image instanceof File) {
            // Mock upload or use URL.createObjectURL for now as placeholder until Storage bucket set up
            image = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
        }

        const driverData = {
            name: `${formData.firstName} ${formData.lastName}`,
            status: 'Active', // Default
            terminal: formData.terminal,
            risk_score: 20, // Default for new
            years_of_service: yearsOfService,
            employee_id: formData.driverCode, // Map to DB column
            driver_manager: formData.driverManager,
            image: typeof image === 'string' ? image : '',
            address: formData.address,
            ssn: formData.ssn,
            phone: formData.phone,
            license_number: formData.licenseNumber,
            email: `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@example.com`,
            hire_date: formData.hireDate
        };

        try {
            if (editingDriverId) {
                // Update
                await driverService.updateDriver(editingDriverId, driverData as any);
                toast.success('Driver updated successfully');
            } else {
                // Create
                await driverService.createDriver(driverData as any);
                toast.success('Driver created successfully');
            }
            await loadDrivers();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save driver');
        }
    };

    const handleDeleteDriver = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await driverService.deleteDriver(id);
                toast.success('Driver deleted successfully');
                setOpenActionMenuId(null);
                loadDrivers();
            } catch (err) {
                toast.error('Failed to delete driver');
            }
        }
    };

    const calculateYearsOfService = (dateString: string) => {
        const hireDateObj = new Date(dateString);
        const today = new Date();
        let years = today.getFullYear() - hireDateObj.getFullYear();
        const m = today.getMonth() - hireDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < hireDateObj.getDate())) {
            years--;
        }
        return Math.max(0, years);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleExportCSV = () => {
        if (filteredDrivers.length === 0) {
            toast.error("No drivers to export");
            return;
        }

        const headers = ['Name', 'Employee ID', 'Terminal', 'Risk Score', 'Status', 'Plan Status', 'Phone', 'Email'];
        const rows = filteredDrivers.map(d => [
            d.name,
            d.employeeId,
            d.terminal,
            d.riskScore.toString(),
            d.status,
            d.riskScore > 80 ? 'Plan Assigned' : 'No Plan Assigned',
            d.phone,
            d.email
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `drivers_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Drivers exported to CSV");
    };

    // Filtering Logic
    const filteredDrivers = drivers.filter(driver => {
        const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerminal = filterTerminal ? driver.terminal === filterTerminal : true;
        const matchesStatus = filterStatus ? driver.status === filterStatus : true;
        return matchesSearch && matchesTerminal && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Drivers</h2>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            "flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors",
                            showFilters ? "bg-green-100 text-green-800 border-green-200" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Driver
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Terminal</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={filterTerminal}
                            onChange={(e) => setFilterTerminal(e.target.value)}
                        >
                            <option value="">All Terminals</option>
                            <option value="North East">North East</option>
                            <option value="Midwest">Midwest</option>
                            <option value="South">South</option>
                            <option value="West Coast">West Coast</option>
                            <option value="Detroit">Detroit</option>
                            <option value="Pittsburgh">Pittsburgh</option>
                            <option value="Cleveland">Cleveland</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setFilterTerminal(''); setFilterStatus(''); setSearchTerm(''); }}
                            className="text-sm text-gray-500 hover:text-green-600 underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">Loading drivers...</p>
                                </td>
                            </tr>
                        ) : filteredDrivers.length > 0 ? (
                            filteredDrivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={driver.image} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-green-600 hover:underline">
                                                    <Link to={`/drivers/${driver.id}`}>{driver.name}</Link>
                                                </div>
                                                <div className="text-sm text-gray-500">ID: {driver.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {driver.terminal}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className={clsx(
                                                "text-lg font-bold",
                                                driver.riskScore > 80 ? "text-red-600" :
                                                    driver.riskScore > 50 ? "text-yellow-600" : "text-green-600"
                                            )}>
                                                {driver.riskScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {driver.riskScore > 80 ? 'Plan Assigned' : 'No Plan Assigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            driver.status === 'Active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        )}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenActionMenuId(openActionMenuId === driver.id ? null : driver.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {/* Actions Dropdown */}
                                        {openActionMenuId === driver.id && (
                                            <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => navigate(`/drivers/${driver.id}`)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Profile
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(driver)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit Driver
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDriver(driver.id, driver.name)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <User className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-lg font-medium text-gray-900">No drivers found</p>
                                        <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDriverId ? "Edit Driver" : "Add New Driver"}
            >
                <form onSubmit={handleSaveDriver} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="123 Main St, City, State"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="XXX-XX-XXXX"
                                    value={formData.ssn}
                                    onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    required
                                    className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Code</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="DRV-001"
                                value={formData.driverCode}
                                onChange={(e) => setFormData({ ...formData, driverCode: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.terminal}
                                onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
                            >
                                <option value="">Select Terminal</option>
                                <option value="North East">North East</option>
                                <option value="Midwest">Midwest</option>
                                <option value="South">South</option>
                                <option value="West Coast">West Coast</option>
                                <option value="Detroit">Detroit</option>
                                <option value="Pittsburgh">Pittsburgh</option>
                                <option value="Cleveland">Cleveland</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Manager</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Manager Name"
                            value={formData.driverManager}
                            onChange={(e) => setFormData({ ...formData, driverManager: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="DL-12345678"
                            value={formData.licenseNumber}
                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.hireDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Photo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        {typeof formData.image === 'object' && formData.image && (
                            <p className="mt-2 text-sm text-gray-500">Selected: {(formData.image as File).name}</p>
                        )}
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
                            {editingDriverId ? "Update Driver" : "Add Driver"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Drivers;
