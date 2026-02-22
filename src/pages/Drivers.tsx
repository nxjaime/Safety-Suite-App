import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, Plus, User, Upload, MapPin, Phone, FileText, Calendar, Download, Trash2, Edit, Eye } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { driverService } from '../services/driverService';
import type { Driver } from '../types';
import { DriverImportModal } from '../components/drivers/DriverImportModal';
import { motiveService } from '../services/motiveService';
import { getBand } from '../services/riskService';

const Drivers: React.FC = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTerminal, setFilterTerminal] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBand, setFilterBand] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
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
        licenseState: '',
        licenseRestrictions: '',
        licenseEndorsements: '',
        licenseExpirationDate: '',
        medicalCardIssueDate: '',
        medicalCardExpirationDate: '',
        cpapRequired: false,
        hireDate: new Date().toISOString().split('T')[0],
        image: null as File | null | string
    });

    const actionMenuRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDrivers();
    }, [currentPage, searchTerm, filterTerminal, filterStatus]);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const { data, count } = await driverService.fetchDriversPaginated(currentPage, pageSize, {
                search: searchTerm,
                terminal: filterTerminal,
                status: filterStatus
            });
            setDrivers(data);
            setTotalCount(count);
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
            licenseState: '',
            licenseRestrictions: '',
            licenseEndorsements: '',
            licenseExpirationDate: '',
            medicalCardIssueDate: '',
            medicalCardExpirationDate: '',
            cpapRequired: false,
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
                driverCode: driver.employeeId || '',
                terminal: driver.terminal || '',
                driverManager: driver.driverManager || '',
                licenseNumber: driver.licenseNumber || '',
                licenseState: driver.licenseState || '',
                licenseRestrictions: driver.licenseRestrictions || '',
                licenseEndorsements: driver.licenseEndorsements || '',
                licenseExpirationDate: driver.licenseExpirationDate || '',
                medicalCardIssueDate: driver.medicalCardIssueDate || '',
                medicalCardExpirationDate: driver.medicalCardExpirationDate || '',
                cpapRequired: driver.cpapRequired || false,
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
            license_state: formData.licenseState,
            license_restrictions: formData.licenseRestrictions,
            license_endorsements: formData.licenseEndorsements,
            license_expiration_date: formData.licenseExpirationDate,
            medical_card_issue_date: formData.medicalCardIssueDate,
            medical_card_expiration_date: formData.medicalCardExpirationDate,
            cpap_required: formData.cpapRequired,
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

    const handleExportCSV = async () => {
        try {
            const { data } = await driverService.fetchDriversPaginated(1, 10000, {
                search: searchTerm,
                terminal: filterTerminal,
                status: filterStatus
            });

            if (data.length === 0) {
                toast.error("No drivers to export");
                return;
            }

            const headers = ['Name', 'Employee ID', 'Terminal', 'Risk Score', 'Status', 'Plan Status', 'Phone', 'Email'];
            const rows = data.map(d => [
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
        } catch (e) {
            toast.error("Failed to export");
        }
    };

    const handleSyncMotive = async () => {
        try {
            toast.loading('Syncing with Motive...', { id: 'sync-motive' });

            // 1. Fetch drivers from Motive
            const { drivers: motiveDrivers } = await motiveService.getDrivers(1, 100);

            // 2. Fetch scores for the last 30 days
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            let scoreMap = new Map();
            try {
                const { users: scores } = await motiveService.getScores(startDate, endDate);
                if (scores) {
                    scores.forEach((s: any) => {
                        if (s.driver && s.driver.id) {
                            scoreMap.set(s.driver.id, s.safety_score);
                        }
                    });
                }
            } catch (scoreErr) {
                console.warn('Failed to fetch scores during sync', scoreErr);
            }

            // 3. Map to local Driver format
            const mappedDrivers = motiveDrivers.map((md: any) => ({
                motive_id: md.id.toString(),
                name: `${md.first_name} ${md.last_name}`,
                email: md.email,
                phone: md.phone,
                employeeId: md.username,
                status: md.status === 'active' ? 'Active' : 'Inactive',
                terminal: 'Detroit',
                riskScore: scoreMap.get(md.id) !== undefined ? scoreMap.get(md.id) : 20
            }));

            // 3. Upsert into Supabase
            await driverService.upsertDrivers(mappedDrivers);

            // 4. Reload
            await loadDrivers();
            toast.success('Synced successfully!', { id: 'sync-motive' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to sync with Motive', { id: 'sync-motive' });
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Drivers</h2>
                <div className="flex space-x-3">
                    <select
                        value={filterBand}
                        onChange={(e) => setFilterBand(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    >
                        <option value="all">All Bands</option>
                        <option value="green">Green (0-49)</option>
                        <option value="yellow">Yellow (50-79)</option>
                        <option value="red">Red (80-100)</option>
                    </select>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            "flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors",
                            showFilters ? "bg-green-100 text-green-800 border-green-200" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center px-4 py-2 border border-slate-300 bg-white rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </button>
                    <button
                        onClick={handleSyncMotive}
                        className="flex items-center px-4 py-2 border border-slate-300 bg-white rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Sync Motive
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 border border-slate-300 bg-white rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Terminal</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            className="text-sm text-slate-500 hover:text-green-600 underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Terminal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">Loading drivers...</p>
                                </td>
                            </tr>
                        ) : drivers.length > 0 ? (
                            drivers
                                .filter((driver) => {
                                    const score = driver.riskScore ?? 60;
                                    const band = getBand(score);
                                    if (filterBand === 'all') return true;
                                    return band === filterBand;
                                })
                                .map((driver) => (
                                <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={driver.image} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-green-600 hover:underline">
                                                    <Link to={`/drivers/${driver.id}`}>{driver.name}</Link>
                                                </div>
                                                <div className="text-sm text-slate-500">ID: {driver.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {driver.terminal}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {(() => {
                                                const score = driver.riskScore ?? 60;
                                                const band = getBand(score);
                                                const bandClass = band === 'red' ? 'bg-red-100 text-red-700' : band === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
                                                return (
                                                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${bandClass}`}>
                                                        {score}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {driver.riskScore > 80 ? 'Plan Assigned' : 'No Plan Assigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            driver.status === 'Active' ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
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
                                            className="text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {/* Actions Dropdown */}
                                        {openActionMenuId === driver.id && (
                                            <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-slate-200">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => navigate(`/drivers/${driver.id}`)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Profile
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(driver)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit Driver
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDriver(driver.id, driver.name)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
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
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <User className="h-12 w-12 text-slate-300 mb-2" />
                                        <p className="text-lg font-medium text-slate-900">No drivers found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {drivers.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                                <span className="font-medium">{totalCount}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-gray-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {/* Simple Page Numbers - can be robust if needed but keeping simple 1..N or current */}
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-gray-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            <DriverImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    toast.success('Drivers imported successfully');
                    loadDrivers();
                }}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDriverId ? "Edit Driver" : "Add New Driver"}
            >
                <form onSubmit={handleSaveDriver} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="123 Main St, City, State"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SSN</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="XXX-XX-XXXX"
                                    value={formData.ssn}
                                    onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    required
                                    className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Driver Code</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="DRV-001"
                                value={formData.driverCode}
                                onChange={(e) => setFormData({ ...formData, driverCode: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Terminal</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Driver Manager</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Manager Name"
                            value={formData.driverManager}
                            onChange={(e) => setFormData({ ...formData, driverManager: e.target.value })}
                        />
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="DL-12345678"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">License State</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="TX"
                                value={formData.licenseState}
                                onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Restrictions</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="None"
                                value={formData.licenseRestrictions}
                                onChange={(e) => setFormData({ ...formData, licenseRestrictions: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Endorsements</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="None"
                                value={formData.licenseEndorsements}
                                onChange={(e) => setFormData({ ...formData, licenseEndorsements: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Expiration Date</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={formData.licenseExpirationDate}
                            onChange={(e) => setFormData({ ...formData, licenseExpirationDate: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Medical Card Issue Date</label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.medicalCardIssueDate}
                                onChange={(e) => setFormData({ ...formData, medicalCardIssueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Medical Card Expiration</label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.medicalCardExpirationDate}
                                onChange={(e) => setFormData({ ...formData, medicalCardExpirationDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="cpapRequired"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                            checked={formData.cpapRequired}
                            onChange={(e) => setFormData({ ...formData, cpapRequired: e.target.checked })}
                        />
                        <label htmlFor="cpapRequired" className="text-sm font-medium text-slate-700">CPAP Required</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hire Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.hireDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Driver Photo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                <div className="flex text-sm text-slate-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        {typeof formData.image === 'object' && formData.image && (
                            <p className="mt-2 text-sm text-slate-500">Selected: {(formData.image as File).name}</p>
                        )}
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
                            {editingDriverId ? "Update Driver" : "Add Driver"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Drivers;
