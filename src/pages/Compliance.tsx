import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, User, Calendar, Trash2, AlertTriangle, Truck, ClipboardList } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { inspectionService, shouldCreateWorkOrderFromInspection } from '../services/inspectionService';
import type { Inspection, ViolationItem } from '../services/inspectionService';
import { driverService } from '../services/driverService';
import type { Driver } from '../types';
import { workOrderService } from '../services/workOrderService';
import toast from 'react-hot-toast';

function CreateWorkOrderFromInspectionButton({ inspection, onCreated }: { inspection: Inspection; onCreated?: () => void }) {
    const [loading, setLoading] = useState(false);
    const handleCreate = async () => {
        setLoading(true);
        try {
            await workOrderService.createWorkOrder({
                title: `Inspection ${inspection.report_number || inspection.id} remediation`,
                description: `Defect remediation for inspection ${inspection.report_number || ''}. Vehicle: ${inspection.vehicle_name || 'Unknown'}, Driver: ${inspection.driver_name || 'Unknown'}.`,
                status: 'Draft',
                priority: inspection.out_of_service ? 'High' : 'Medium',
                inspectionId: inspection.id,
            });
            toast.success('Work order created');
            onCreated?.();
        } catch (e) {
            console.error('Create WO from inspection', e);
            toast.error('Failed to create work order');
        } finally {
            setLoading(false);
        }
    };
    return (
        <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="text-emerald-600 hover:text-emerald-900 inline-flex items-center disabled:opacity-50"
        >
            <ClipboardList className="w-4 h-4 mr-1" /> Create WO
        </button>
    );
}

const Compliance: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDQFile, setNewDQFile] = useState({
        driverName: '',
        documentType: '',
        expirationDate: ''
    });

    const [view, setView] = useState<'overview' | 'hos' | 'dq' | 'cdl' | 'audit' | 'inspections'>('overview');

    // Inspections State
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loadingInspections, setLoadingInspections] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]); // New state for drivers

    // Form State
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'admin' | 'carrier' | 'vehicle' | 'violations'>('admin');

    // Initial Form State
    const initialInspectionState: Partial<Inspection> = {
        date: new Date().toISOString().split('T')[0],
        report_number: '',

        // Admin
        time_started: '',
        time_ended: '',
        location: '',
        inspection_level: 'Level I',
        officer_name: '',
        badge_number: '',

        // Carrier
        carrier_name: 'Safety First Logistics', // Default
        usdot_number: '3844435', // Default
        carrier_address: '',

        // Driver
        driver_id: '',
        driver_name: '',
        driver_license_number: '',
        driver_license_state: '',
        medical_cert_status: 'Valid',

        // Vehicle
        vehicle_type: 'Tractor-Trailer',
        // unit_number removed, using vehicle_name
        vehicle_name: '', // alias for unit_number
        plate_number: '',
        plate_state: '',
        vin: '',
        odometer: '',
        cargo_info: '',

        // Violations
        violations_data: [],
        out_of_service: false
    };

    const [newInspection, setNewInspection] = useState<Partial<Inspection>>(initialInspectionState);
    const [currentViolation, setCurrentViolation] = useState<ViolationItem>({ code: '', description: '', type: 'Vehicle', oos: false });

    // Load inspections on mount (for overdue count on overview) and when entering inspections view (for drivers)
    useEffect(() => {
        loadInspections();
    }, []);
    useEffect(() => {
        if (view === 'inspections') {
            loadDrivers();
        }
    }, [view]);

    const loadDrivers = async () => {
        try {
            const data = await driverService.fetchDrivers();
            setDrivers(data);
        } catch (error) {
            console.error('Failed to load drivers', error);
        }
    };

    const loadInspections = async () => {
        setLoadingInspections(true);
        try {
            const data = await inspectionService.getInspections();
            // Transform data if needed to match UI expectations, currently direct mapping mostly
            // We need to parse description back to driver/vehicle if we stored it there
            const mappedData: Inspection[] = data.map((item: any) => {
                // Parse description "Driver: Name, Vehicle: Unit"
                const desc = item.description || '';
                const driverMatch = desc.match(/Driver: (.*?),/);
                const vehicleMatch = desc.match(/Vehicle: (.*)/);

                // Calculate violations count if not present
                const vCount = item.violations_data ? item.violations_data.length : parseInt(item.violation_code || '0');

                return {
                    ...item,
                    id: item.id,
                    driver_name: item.driver_name || (driverMatch ? driverMatch[1] : 'Unknown'),
                    vehicle_name: item.vehicle_name || (vehicleMatch ? vehicleMatch[1] : 'Unknown'),
                    violations_count: vCount,
                    status: 'Uploaded'
                };
            });
            setInspections(mappedData);
        } catch (error) {
            console.error('Failed to load inspections', error);
        } finally {
            setLoadingInspections(false);
        }
    };

    const handleAddViolation = () => {
        if (!currentViolation.description) return;
        setNewInspection(prev => ({
            ...prev,
            violations_data: [...(prev.violations_data || []), currentViolation]
        }));
        setCurrentViolation({ code: '', description: '', type: 'Vehicle', oos: false });
    };

    const removeViolation = (idx: number) => {
        setNewInspection(prev => ({
            ...prev,
            violations_data: (prev.violations_data || []).filter((_, i) => i !== idx)
        }));
    };

    const handleDriverSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDriverId = e.target.value;
        const driver = drivers.find(d => d.id === selectedDriverId);

        if (driver) {
            setNewInspection(prev => ({
                ...prev,
                driver_id: driver.id,
                driver_name: driver.name,
                driver_license_number: driver.licenseNumber || '',
                // driver_license_state: driver.licenseState || '', // Not currently in Driver type
            }));
        } else {
            // Handle "manual" or empty case if needed, or just clear
            setNewInspection(prev => ({
                ...prev,
                driver_id: '',
                driver_name: '',
                driver_license_number: '',
            }));
        }
    };

    const handleAddInspection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const inspectionPayload = {
                ...newInspection,
                vehicle_name: newInspection.vehicle_name, // Ensure basic UI field is populated
                violations_count: (newInspection.violations_data || []).length
            };
            await inspectionService.createInspection(inspectionPayload);

            const shouldCreate = shouldCreateWorkOrderFromInspection(
                inspectionPayload.out_of_service,
                inspectionPayload.violations_data || []
            );

            if (shouldCreate) {
                // include org context and potentially link to vehicle if available
                await workOrderService.createWorkOrder({
                    title: `Inspection OOS: ${inspectionPayload.vehicle_name || 'Vehicle'}`,
                    description: 'Auto-generated from inspection out-of-service status.',
                    status: 'Draft',
                    priority: 'High',
                    equipmentId: inspectionPayload.vehicle_id || undefined,
                    // organizationId will be filled by service fallback if not provided
                } as any);
            }
            await loadInspections();
            setIsInspectionModalOpen(false);
            setNewInspection(initialInspectionState);
            setActiveTab('admin');
        } catch (error) {
            console.error('Failed to create inspection', error);
            alert('Failed to save inspection.');
        }
    };

    const handleAddDQFile = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, update state
        console.log('New DQ File:', newDQFile);
        setIsModalOpen(false);
        setNewDQFile({ driverName: '', documentType: '', expirationDate: '' });
    };

    const expirations = [
        { id: 1, driver: 'Sarah Jenkins', type: 'CDL', date: '2025-10-15', status: 'Good' },
        { id: 2, driver: 'Mike Ross', type: 'Medical Card', date: '2024-02-20', status: 'Critical' },
        { id: 3, driver: 'David Kim', type: 'MVR', date: '2024-03-01', status: 'Warning' },
        { id: 4, driver: 'Elena Rodriguez', type: 'Hazmat Endorsement', date: '2025-06-10', status: 'Good' },
        { id: 5, driver: 'Sarah Jenkins', type: 'Annual Review', date: '2024-11-15', status: 'Good' },
    ];

    const hosViolations = [
        { id: 1, driver: 'Mike Ross', violation: '11 Hour Rule', date: '2024-01-15', status: 'Open' },
        { id: 2, driver: 'David Kim', violation: '14 Hour Rule', date: '2023-12-20', status: 'Resolved' },
        { id: 3, driver: 'Elena Rodriguez', violation: '30 Minute Break', date: '2024-01-05', status: 'Open' },
    ];

    const missingDQFiles = [
        { id: 1, driver: 'Mike Ross', file: 'Medical Card', status: 'Expired' },
        { id: 2, driver: 'David Kim', file: 'MVR', status: 'Missing' },
    ];

    const auditItems = [
        { id: 1, item: 'Driver Files', status: 'Compliant', score: '100%' },
        { id: 2, item: 'Vehicle Maintenance', status: 'Compliant', score: '95%' },
        { id: 3, item: 'HOS Logs', status: 'Warning', score: '88%' },
    ];

    const today = new Date().toISOString().split('T')[0];
    const overdueRemediationsCount = inspections.filter(
        (i) => i.remediation_status !== 'Closed' && i.remediation_due_date && i.remediation_due_date < today
    ).length;

    const renderOverview = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div
                    onClick={() => setView('hos')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">HOS Violations</h3>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">12</p>
                    <p className="text-xs text-red-600 mt-1">+2 from last week</p>
                </div>
                <div
                    onClick={() => setView('inspections')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">DOT Inspections</h3>
                        <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{inspections.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Total on file</p>
                </div>
                <div
                    onClick={() => setView('inspections')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Overdue Remediations</h3>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{overdueRemediationsCount}</p>
                    <p className="text-xs text-amber-600 mt-1">Past SLA due date</p>
                </div>
                <div
                    onClick={() => setView('dq')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Missing DQ Files</h3>
                        <FileText className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">5</p>
                    <p className="text-xs text-yellow-600 mt-1">Action required</p>
                </div>
                <div
                    onClick={() => setView('cdl')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Expiring CDLs</h3>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">3</p>
                    <p className="text-xs text-slate-500 mt-1">Next 30 days</p>
                </div>
                <div
                    onClick={() => setView('audit')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Audit Ready</h3>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">98%</p>
                    <p className="text-xs text-green-600 mt-1">Compliance Score</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Upcoming Expirations</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiration Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expirations.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.driver}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                        item.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900">Renew</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    const renderDetailView = (title: string, columns: string[], data: any[], renderRow: (item: any) => React.ReactNode) => (
        <div className="space-y-6">
            <button
                onClick={() => setView('overview')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center"
            >
                ← Back to Overview
            </button>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map(renderRow)}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon className="w-4 h-4 mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Compliance Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add DQ File
                </button>
            </div>

            {view === 'overview' && renderOverview()}

            {view === 'hos' && renderDetailView(
                'HOS Violations',
                ['Driver', 'Violation', 'Date', 'Status'],
                hosViolations,
                (item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.violation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'dq' && renderDetailView(
                'Missing DQ Files',
                ['Driver', 'Missing File', 'Status'],
                missingDQFiles,
                (item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.file}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'cdl' && renderDetailView(
                'Expiring CDLs',
                ['Driver', 'Document Type', 'Expiration Date', 'Status'],
                expirations.filter(e => e.type === 'CDL'),
                (item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'inspections' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setView('overview')}
                            className="text-sm text-slate-500 hover:text-slate-700 flex items-center"
                        >
                            ← Back to Overview
                        </button>
                        <button
                            onClick={() => setIsInspectionModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Inspection
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">DOT Inspections</h3>
                        </div>
                        {loadingInspections ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                Loading inspections...
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Report #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Driver</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Violations</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Remediation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SLA Due</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inspections.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-4 text-center text-slate-500 text-sm">
                                                No inspections found. Upload one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        inspections.map((item) => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const slaDue = item.remediation_due_date;
                                            const isOverdue = slaDue && item.remediation_status !== 'Closed' && slaDue < today;
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.date}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.report_number}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.driver_name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.vehicle_name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(item.violations_count || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {item.violations_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.remediation_status === 'Closed'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : item.remediation_status === 'In Progress'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {item.remediation_status || 'Open'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {slaDue ? (
                                                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                                                                {slaDue}{isOverdue ? ' (Overdue)' : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        {(item.remediation_status === 'Open' || item.remediation_status === 'In Progress') && (
                                                            <CreateWorkOrderFromInspectionButton inspection={item} onCreated={loadInspections} />
                                                        )}
                                                        <button className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                                                            <FileText className="w-4 h-4 mr-1" /> PDF
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Add Inspection Modal */}
                    <Modal
                        isOpen={isInspectionModalOpen}
                        onClose={() => setIsInspectionModalOpen(false)}
                        title="New Driver Vehicle Examination Report (DVER)"
                        className="max-w-4xl" // Wider modal
                    >
                        <form onSubmit={handleAddInspection} className="space-y-6">
                            {/* Tabs */}
                            <div className="flex space-x-2 border-b border-slate-200 pb-2">
                                <TabButton id="admin" label="Administrative" icon={FileText} />
                                <TabButton id="carrier" label="Carrier & Driver" icon={User} />
                                <TabButton id="vehicle" label="Vehicle" icon={Truck} />
                                <TabButton id="violations" label="Violations" icon={AlertTriangle} />
                            </div>

                            <div className="min-h-[300px]">
                                {/* Admin Tab */}
                                {activeTab === 'admin' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Date</label>
                                            <input type="date" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.date} onChange={e => setNewInspection({ ...newInspection, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Report #</label>
                                            <input type="text" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.report_number} onChange={e => setNewInspection({ ...newInspection, report_number: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Time Started</label>
                                            <input type="time" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.time_started} onChange={e => setNewInspection({ ...newInspection, time_started: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Time Ended</label>
                                            <input type="time" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.time_ended} onChange={e => setNewInspection({ ...newInspection, time_ended: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700">Location</label>
                                            <input type="text" placeholder="City, State (e.g. Dallas, TX)" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.location} onChange={e => setNewInspection({ ...newInspection, location: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Inspection Level</label>
                                            <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.inspection_level} onChange={e => setNewInspection({ ...newInspection, inspection_level: e.target.value })}>
                                                <option>Level I</option>
                                                <option>Level II</option>
                                                <option>Level III</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Officer Name / Badge</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.officer_name} onChange={e => setNewInspection({ ...newInspection, officer_name: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {/* Carrier & Driver Tab */}
                                {activeTab === 'carrier' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <h4 className="font-medium text-slate-900 border-b pb-1 mb-3">Carrier Information</h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Carrier Name</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.carrier_name} onChange={e => setNewInspection({ ...newInspection, carrier_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">USDOT #</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.usdot_number} onChange={e => setNewInspection({ ...newInspection, usdot_number: e.target.value })} />
                                        </div>

                                        <div className="col-span-2 mt-4">
                                            <h4 className="font-medium text-slate-900 border-b pb-1 mb-3">Driver Information</h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Driver Name</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={drivers.find(d => d.name === newInspection.driver_name)?.id || ''}
                                                onChange={handleDriverSelect}
                                            >
                                                <option value="">Select Driver</option>
                                                {drivers.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">License #</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.driver_license_number} onChange={e => setNewInspection({ ...newInspection, driver_license_number: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">State</label>
                                            <input type="text" maxLength={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.driver_license_state} onChange={e => setNewInspection({ ...newInspection, driver_license_state: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Med Cert Status</label>
                                            <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.medical_cert_status} onChange={e => setNewInspection({ ...newInspection, medical_cert_status: e.target.value })}>
                                                <option>Valid</option>
                                                <option>Expired</option>
                                                <option>Not Required</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Vehicle Tab */}
                                {activeTab === 'vehicle' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Unit Number</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.vehicle_name}
                                                onChange={e => setNewInspection({ ...newInspection, vehicle_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Type</label>
                                            <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.vehicle_type} onChange={e => setNewInspection({ ...newInspection, vehicle_type: e.target.value })}>
                                                <option>Tractor-Trailer</option>
                                                <option>Straight Truck</option>
                                                <option>Bus</option>
                                                <option>Passenger Car</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Plate Number</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.plate_number} onChange={e => setNewInspection({ ...newInspection, plate_number: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Plate State</label>
                                            <input type="text" maxLength={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.plate_state} onChange={e => setNewInspection({ ...newInspection, plate_state: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">VIN</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.vin} onChange={e => setNewInspection({ ...newInspection, vin: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Odometer</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                value={newInspection.odometer} onChange={e => setNewInspection({ ...newInspection, odometer: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700">Cargo Information</label>
                                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                placeholder="Commodity, BOL #"
                                                value={newInspection.cargo_info} onChange={e => setNewInspection({ ...newInspection, cargo_info: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-2">
                                            <div>
                                                <p className="text-sm font-medium text-red-700">Out of Service</p>
                                                <p className="text-xs text-red-600">Auto-creates a work order when checked.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                                                checked={!!newInspection.out_of_service}
                                                onChange={(e) => setNewInspection({ ...newInspection, out_of_service: e.target.checked })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Violations Tab */}
                                {activeTab === 'violations' && (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                                            <h4 className="text-sm font-medium text-slate-900 mb-2">Add Violation</h4>
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-3">
                                                    <input type="text" placeholder="Code (e.g. 395.8)" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                        value={currentViolation.code} onChange={e => setCurrentViolation({ ...currentViolation, code: e.target.value })} />
                                                </div>
                                                <div className="col-span-5">
                                                    <input type="text" placeholder="Description" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                        value={currentViolation.description} onChange={e => setCurrentViolation({ ...currentViolation, description: e.target.value })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                        value={currentViolation.type} onChange={e => setCurrentViolation({ ...currentViolation, type: e.target.value as any })}>
                                                        <option>Vehicle</option>
                                                        <option>Driver</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2 flex items-center space-x-2">
                                                    <label className="flex items-center space-x-1 text-sm text-slate-700">
                                                        <input type="checkbox" className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                                            checked={currentViolation.oos} onChange={e => setCurrentViolation({ ...currentViolation, oos: e.target.checked })} />
                                                        <span className="text-xs font-bold text-red-600">OOS</span>
                                                    </label>
                                                    <button type="button" onClick={handleAddViolation} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {(newInspection.violations_data || []).length === 0 && (
                                                <p className="text-center text-slate-500 text-sm py-4">No violations recorded.</p>
                                            )}
                                            {newInspection.violations_data?.map((v, idx) => (
                                                <div key={idx} className={`flex items-center justify-between p-3 rounded-md border ${v.oos ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center space-x-3">
                                                        {v.oos && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                        <span className="font-mono text-sm font-bold text-slate-700">{v.code}</span>
                                                        <span className="text-sm text-slate-600">{v.description}</span>
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{v.type}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeViolation(idx)} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsInspectionModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Save Report
                                </button>
                            </div>
                        </form>
                    </Modal>
                </div>
            )}

            {view === 'audit' && renderDetailView(
                'Audit Readiness',
                ['Item', 'Status', 'Score'],
                auditItems,
                (item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{item.item}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {item.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.score}</td>
                    </tr>
                )
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add DQ File"
            >
                <form onSubmit={handleAddDQFile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Driver Name"
                                value={newDQFile.driverName}
                                onChange={(e) => setNewDQFile({ ...newDQFile, driverName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newDQFile.documentType}
                            onChange={(e) => setNewDQFile({ ...newDQFile, documentType: e.target.value })}
                        >
                            <option value="">Select Type</option>
                            <option value="CDL">CDL</option>
                            <option value="Medical Card">Medical Card</option>
                            <option value="MVR">MVR</option>
                            <option value="Annual Review">Annual Review</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newDQFile.expirationDate}
                                onChange={(e) => setNewDQFile({ ...newDQFile, expirationDate: e.target.value })}
                            />
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
                            Add File
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Compliance;
