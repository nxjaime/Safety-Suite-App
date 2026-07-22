import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertTriangle, Wrench, ClipboardList, FileText, CalendarClock, CheckCircle, Archive, XCircle, History, Plus } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';
import { equipmentService } from '../services/equipmentService';
import { maintenanceService } from '../services/maintenanceService';
import { workOrderService } from '../services/workOrderService';
import { useAuth } from '../contexts/AuthContext';
import type { Equipment, EquipmentStatus, OwnershipType, MaintenanceTemplate, EldLoggingOption, OwnLeaseOption, VehicleTypeOption } from '../types';
import { equipmentProfileTabs, type EquipmentProfileTab } from './equipmentConstants';
import { getLoadErrorMessage } from '../utils/loadErrorMessage';

type CategoryTab = 'Trucks' | 'Trailers' | 'Forklifts' | 'Pallet Jacks' | 'Sales Vehicles';

export const OWN_LEASE_OPTIONS = ['Own', 'Lease', 'Rent'] as const;
export const ELD_LOGGING_OPTIONS = ['Enabled', 'Disabled', 'Exempt'] as const;
export const VEHICLE_TYPE_OPTIONS = ['Sales Vehicle', 'Truck', 'Trailer'] as const;
export const US_STATE_OPTIONS = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

export const VEHICLE_LEASING_FIELD_LABELS = [
    'Vehicle #',
    'VIN',
    'License Plate #',
    'State',
    'City',
    'Vehicle Type',
    'Owner',
    'Mth Lease Charge',
    'Mileage Charge',
    'Lease Expir. Year',
    'Added to Fleet',
    'Removed from Fleet',
    'Follow Up',
    'Gross Weight',
    'Geotab',
    'Toll Transponder',
    'ELD Logging',
    'IMEI #',
    'ELD Notes',
    'Driver',
    'Rep Code',
    'Driver Check #',
    'MGR',
    'Email',
    'Ph #',
    'Vehicle Value',
    'Months In Service',
    '2/1/2026',
    'Avg Miles Per Month',
    'Estimated Odometer 6 months',
    'Div #',
    'Div',
    'Corp',
    'GL Acct',
    'Ins. Class',
    'NOTES',
] as const;

type LinkedInspection = {
    id: string;
    date: string;
    inspection_level?: string;
    report_number?: string;
    out_of_service?: boolean;
    defect_count?: number;
    remediation_status?: string;
};

type LinkedTemplate = MaintenanceTemplate;

type LinkedWorkOrder = {
    id: string;
    title: string;
    status: string;
    total_cost?: number;
    totalCost?: number;
    assignedTo?: string;
    assigned_to?: string;
    completedAt?: string;
    completed_at?: string;
    closeoutNotes?: string;
    closeout_notes?: string;
};

type LinkedDocument = {
    id: string;
    name: string;
    category: string;
    uploaded_at: string;
};

const CATEGORY_TYPE_MAP: Record<CategoryTab, string> = {
    'Trucks': 'Truck',
    'Trailers': 'Trailer',
    'Forklifts': 'Forklift',
    'Pallet Jacks': 'Pallet Jack',
    'Sales Vehicles': 'Sales Vehicle',
};

const CATEGORY_TYPE_FILTERS: Record<CategoryTab, string[]> = {
    'Trucks': ['Truck', 'Tractor', 'Box Truck'],
    'Trailers': ['Trailer'],
    'Forklifts': ['Forklift'],
    'Pallet Jacks': ['Pallet Jack'],
    'Sales Vehicles': ['Sales Vehicle', 'Company Vehicle'],
};

const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    out_of_service: 'bg-red-100 text-red-800',
    inactive: 'bg-slate-100 text-slate-600',
    archived: 'bg-slate-200 text-slate-500',
    retired: 'bg-gray-200 text-gray-500',
};

type EquipmentFormState = {
    assetTag: string;
    type: string;
    make: string;
    model: string;
    year: string;
    ownershipType: OwnershipType;
    status: EquipmentStatus;
    usageMiles: string;
    usageHours: string;
    attachments: string;
    forkliftAttachments: string[];
    removedFromFleet: string;
    addedToFleet: string;
    divNumber: string;
    division: string;
    corp: string;
    ownLease: OwnLeaseOption | '';
    owner: string;
    city: string;
    state: string;
    vehicleNumber: string;
    vin: string;
    insClass: string;
    glAcct: string;
    grossWeight: string;
    geotab: string;
    tollTransponder: string;
    driver: string;
    repCode: string;
    driverCheckNumber: string;
    mthLeaseCharge: string;
    mileageCharge: string;
    followUp: string;
    leaseExpirYear: string;
    vehicleValue: string;
    licensePlate: string;
    notes: string;
    monthsInService: string;
    asOfDate: string;
    avgMilesPerMonth: string;
    estimatedOdometer6mo: string;
    mgr: string;
    eldLogging: EldLoggingOption | '';
    email: string;
    phone: string;
    imei: string;
    eldNotes: string;
    vehicleType: VehicleTypeOption | '';
};

const EMPTY_FORM: EquipmentFormState = {
    assetTag: '',
    type: '',
    make: '',
    model: '',
    year: '',
    ownershipType: 'owned',
    status: 'active',
    usageMiles: '',
    usageHours: '',
    attachments: '',
    forkliftAttachments: [],
    removedFromFleet: '',
    addedToFleet: '',
    divNumber: '',
    division: '',
    corp: '',
    ownLease: '',
    owner: '',
    city: '',
    state: '',
    vehicleNumber: '',
    vin: '',
    insClass: '',
    glAcct: '',
    grossWeight: '',
    geotab: '',
    tollTransponder: '',
    driver: '',
    repCode: '',
    driverCheckNumber: '',
    mthLeaseCharge: '',
    mileageCharge: '',
    followUp: '',
    leaseExpirYear: '',
    vehicleValue: '',
    licensePlate: '',
    notes: '',
    monthsInService: '',
    asOfDate: '',
    avgMilesPerMonth: '',
    estimatedOdometer6mo: '',
    mgr: '',
    eldLogging: '',
    email: '',
    phone: '',
    imei: '',
    eldNotes: '',
    vehicleType: '',
};

const parseDecimalField = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseIntegerField = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
};

export const buildEquipmentPayload = (formData: EquipmentFormState, fallbackType: string): Partial<Equipment> => ({
    assetTag: formData.assetTag,
    type: formData.type || fallbackType,
    make: formData.make,
    model: formData.model,
    year: formData.year ? Number.parseInt(formData.year, 10) : undefined,
    ownershipType: formData.ownershipType,
    status: formData.status,
    usageMiles: formData.usageMiles ? Number.parseInt(formData.usageMiles, 10) : 0,
    usageHours: formData.usageHours ? Number.parseInt(formData.usageHours, 10) : 0,
    attachments: formData.attachments
        ? formData.attachments.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    forkliftAttachments: formData.forkliftAttachments,
    removedFromFleet: formData.removedFromFleet,
    addedToFleet: formData.addedToFleet,
    divNumber: formData.divNumber.trim(),
    division: formData.division.trim(),
    corp: formData.corp.trim(),
    ownLease: formData.ownLease || undefined,
    owner: formData.owner.trim(),
    city: formData.city.trim(),
    state: formData.state,
    vehicleNumber: formData.vehicleNumber.trim(),
    vin: formData.vin.trim(),
    insClass: formData.insClass.trim(),
    glAcct: formData.glAcct.trim(),
    grossWeight: parseIntegerField(formData.grossWeight),
    geotab: formData.geotab.trim(),
    tollTransponder: formData.tollTransponder.trim(),
    driver: formData.driver.trim(),
    repCode: formData.repCode.trim(),
    driverCheckNumber: formData.driverCheckNumber.trim(),
    mthLeaseCharge: parseDecimalField(formData.mthLeaseCharge),
    mileageCharge: parseDecimalField(formData.mileageCharge),
    followUp: formData.followUp,
    leaseExpirYear: parseIntegerField(formData.leaseExpirYear),
    vehicleValue: parseDecimalField(formData.vehicleValue),
    licensePlate: formData.licensePlate.trim(),
    notes: formData.notes.trim(),
    monthsInService: parseIntegerField(formData.monthsInService),
    asOfDate: formData.asOfDate,
    avgMilesPerMonth: parseIntegerField(formData.avgMilesPerMonth),
    estimatedOdometer6mo: parseIntegerField(formData.estimatedOdometer6mo),
    mgr: formData.mgr.trim(),
    eldLogging: formData.eldLogging || undefined,
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    imei: formData.imei.trim(),
    eldNotes: formData.eldNotes.trim(),
    vehicleType: formData.vehicleType || undefined,
});

const Equipment: React.FC = () => {
    const navigate = useNavigate();
    const { role, capabilities } = useAuth();
    const canMutate = capabilities.canManageFleet;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<CategoryTab>('Trucks');
    const [profileTab, setProfileTab] = useState<EquipmentProfileTab>('Overview');
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

    const [vehicles, setVehicles] = useState<Equipment[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [equipmentPageSize] = useState(10);
    const [linkedInspections, setLinkedInspections] = useState<LinkedInspection[]>([]);
    const [linkedPMTemplates, setLinkedPMTemplates] = useState<LinkedTemplate[]>([]);
    const [linkedWorkOrders, setLinkedWorkOrders] = useState<LinkedWorkOrder[]>([]);
    const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
    const [loadingLinked, setLoadingLinked] = useState(false);

    // Work order creation state
    const [woModalOpen, setWoModalOpen] = useState(false);
    const [woFromInspection, setWoFromInspection] = useState<{ id: string; report_number: string; date: string } | null>(null);
    const [woForm, setWoForm] = useState({ title: '', description: '', priority: 'High' as 'High' | 'Medium' | 'Low', dueDate: '' });
    const [woSaving, setWoSaving] = useState(false);

    // Load equipment for the current category tab and status filter
    const loadEquipment = useCallback(async (page = equipmentPage) => {
        setLoadingVehicles(true);
        try {
            const filters: { type?: string | string[]; status?: string } = { type: CATEGORY_TYPE_FILTERS[activeTab] };
            if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
            const { data } = await equipmentService.getEquipmentPaginated(page, equipmentPageSize, filters);
            setVehicles(data);
        } catch (err) {
            console.error('Failed to load equipment', err);
            toast.error(getLoadErrorMessage(err, 'Equipment'));
        } finally {
            setLoadingVehicles(false);
        }
    }, [activeTab, equipmentPage, equipmentPageSize, statusFilter]);

    useEffect(() => {
        setEquipmentPage(1);
    }, [activeTab, statusFilter]);

    useEffect(() => {
        loadEquipment(equipmentPage);
    }, [loadEquipment]);

    // Load vehicle types from settings
    useEffect(() => {
        settingsService.getOptionsByCategory('vehicle_type').then(types => {
            if (types && types.length > 0) {
                setVehicleTypes((types as Array<{ value: string }>).map((t) => t.value));
            } else {
                setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
            }
        }).catch(() => {
            setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
        });
    }, []);

    // Load linked data when a specific asset is selected
    useEffect(() => {
        if (!selectedEquipmentId) {
            setLinkedInspections([]);
            setLinkedPMTemplates([]);
            setLinkedWorkOrders([]);
            setLinkedDocuments([]);
            return;
        }
        if (profileTab === 'Overview') return;

        setLoadingLinked(true);
        const fetches: Promise<unknown>[] = [];

        if (profileTab === 'Inspections') {
            fetches.push(
                equipmentService.getLinkedInspections(selectedEquipmentId)
                    .then(setLinkedInspections)
                    .catch(() => setLinkedInspections([]))
            );
        }
        if (profileTab === 'Maintenance') {
            fetches.push(
                maintenanceService.getTemplates()
                    .then(setLinkedPMTemplates)
                    .catch(() => setLinkedPMTemplates([]))
            );
        }
        if (profileTab === 'Work Orders' || profileTab === 'Service History') {
            fetches.push(
                equipmentService.getLinkedWorkOrders(selectedEquipmentId)
                    .then(setLinkedWorkOrders)
                    .catch(() => setLinkedWorkOrders([]))
            );
        }
        if (profileTab === 'Documents') {
            fetches.push(
                equipmentService.getLinkedDocuments(selectedEquipmentId)
                    .then(setLinkedDocuments)
                    .catch(() => setLinkedDocuments([]))
            );
        }

        Promise.all(fetches).finally(() => setLoadingLinked(false));
    }, [selectedEquipmentId, profileTab]);

    const selectedAsset = vehicles.find(v => v.id === selectedEquipmentId) ?? null;

    const saveAsset = async () => {
        try {
            const payload = buildEquipmentPayload(formData, CATEGORY_TYPE_MAP[activeTab]);

            if (editingId) {
                const updated = await equipmentService.updateEquipment(editingId, payload, role);
                setVehicles(prev => prev.map(v => v.id === editingId ? updated : v));
                toast.success('Asset updated successfully');
            } else {
                const created = await equipmentService.createEquipment(payload, role);
                setVehicles(prev => [...prev, created]);
                toast.success('Asset added successfully');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData(EMPTY_FORM);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save asset');
        }
    };

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveAsset();
    };

    const handleEdit = (asset: Equipment) => {
        setFormData({
            assetTag: asset.assetTag,
            type: asset.type,
            make: asset.make || '',
            model: asset.model || '',
            year: asset.year?.toString() || '',
            ownershipType: asset.ownershipType,
            status: asset.status,
            usageMiles: asset.usageMiles?.toString() || '',
            usageHours: asset.usageHours?.toString() || '',
            attachments: (asset.attachments || []).join(', '),
            forkliftAttachments: asset.forkliftAttachments || [],
            removedFromFleet: asset.removedFromFleet || '',
            addedToFleet: asset.addedToFleet || '',
            divNumber: asset.divNumber || '',
            division: asset.division || '',
            corp: asset.corp || '',
            ownLease: asset.ownLease || '',
            owner: asset.owner || '',
            city: asset.city || '',
            state: asset.state || '',
            vehicleNumber: asset.vehicleNumber || '',
            vin: asset.vin || '',
            insClass: asset.insClass || '',
            glAcct: asset.glAcct || '',
            grossWeight: asset.grossWeight?.toString() || '',
            geotab: asset.geotab || '',
            tollTransponder: asset.tollTransponder || '',
            driver: asset.driver || '',
            repCode: asset.repCode || '',
            driverCheckNumber: asset.driverCheckNumber || '',
            mthLeaseCharge: asset.mthLeaseCharge?.toString() || '',
            mileageCharge: asset.mileageCharge?.toString() || '',
            followUp: asset.followUp || '',
            leaseExpirYear: asset.leaseExpirYear?.toString() || '',
            vehicleValue: asset.vehicleValue?.toString() || '',
            licensePlate: asset.licensePlate || '',
            notes: asset.notes || '',
            monthsInService: asset.monthsInService?.toString() || '',
            asOfDate: asset.asOfDate || '',
            avgMilesPerMonth: asset.avgMilesPerMonth?.toString() || '',
            estimatedOdometer6mo: asset.estimatedOdometer6mo?.toString() || '',
            mgr: asset.mgr || '',
            eldLogging: asset.eldLogging || '',
            email: asset.email || '',
            phone: asset.phone || '',
            imei: asset.imei || '',
            eldNotes: asset.eldNotes || '',
            vehicleType: asset.vehicleType || '',
        });
        setEditingId(asset.id);
        setIsModalOpen(true);
    };

    const handleArchive = async (asset: Equipment) => {
        if (!confirm(`Archive ${asset.assetTag}? This will mark it as archived.`)) return;
        try {
            const updated = await equipmentService.archiveEquipment(asset.id, role);
            setVehicles(prev => prev.map(v => v.id === asset.id ? updated : v));
            toast.success(`${asset.assetTag} archived`);
            // Remove from view if filter doesn't include archived
            if (statusFilter !== 'archived' && statusFilter !== 'all') {
                setVehicles(prev => prev.filter(v => v.id !== asset.id));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to archive asset');
        }
    };

    const handleRetire = async (asset: Equipment) => {
        if (!confirm(`Retire ${asset.assetTag}? This is a terminal status.`)) return;
        try {
            const updated = await equipmentService.retireEquipment(asset.id, role);
            setVehicles(prev => prev.map(v => v.id === asset.id ? updated : v));
            toast.success(`${asset.assetTag} retired`);
            if (statusFilter !== 'retired' && statusFilter !== 'all') {
                setVehicles(prev => prev.filter(v => v.id !== asset.id));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to retire asset');
        }
    };

    const openAddModal = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setIsModalOpen(true);
    };

    const selectAsset = (id: string) => {
        setSelectedEquipmentId(id);
        setProfileTab('Overview');
    };

    const openWoModal = (inspection?: { id: string; report_number: string; date: string }) => {
        const defaultTitle = inspection
            ? `Defect remediation: ${inspection.date} inspection (${inspection.report_number})`
            : selectedAsset ? `Work order — ${selectedAsset.assetTag}` : '';
        setWoFromInspection(inspection ?? null);
        setWoForm({ title: defaultTitle, description: '', priority: 'High', dueDate: '' });
        setWoModalOpen(true);
    };

    const handleCreateWO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipmentId || !woForm.title.trim()) return;
        setWoSaving(true);
        try {
            if (woFromInspection) {
                await workOrderService.createWorkOrderFromInspection(
                    woFromInspection.id,
                    { equipmentId: selectedEquipmentId, title: woForm.title, description: woForm.description, priority: woForm.priority },
                    role
                );
            } else {
                await workOrderService.createWorkOrder({
                    equipmentId: selectedEquipmentId,
                    title: woForm.title,
                    description: woForm.description,
                    priority: woForm.priority,
                    status: 'Draft',
                    dueDate: woForm.dueDate || undefined,
                }, [], role);
            }
            toast.success('Work order created');
            setWoModalOpen(false);
            // Refresh work orders list if on that tab
            if (profileTab === 'Work Orders' || profileTab === 'Service History') {
                const updated = await equipmentService.getLinkedWorkOrders(selectedEquipmentId);
                setLinkedWorkOrders(updated);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create work order');
        } finally {
            setWoSaving(false);
        }
    };

    const activeCount = vehicles.filter(v => v.status === 'active').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
    const oosCount = vehicles.filter(v => v.status === 'out_of_service').length;
    const setFormField = (field: keyof EquipmentFormState, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-8" data-testid="equipment-page">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Equipment Command Center</h2>
                        <p className="mt-1 text-sm text-slate-500">Manage fleet assets, inspection readiness, and service posture across all equipment types.</p>
                    </div>
                    {canMutate && (
                        <button
                            onClick={openAddModal}
                            className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm"
                        >
                            <Truck className="w-4 h-4 mr-2" />
                            Add {activeTab}
                        </button>
                    )}
                </div>
            </section>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {(['Trucks', 'Trailers', 'Forklifts', 'Pallet Jacks', 'Sales Vehicles'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setSelectedEquipmentId(null); }}
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

            {/* Profile tabs */}
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

            {/* OVERVIEW TAB */}
            {profileTab === 'Overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                            <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                                <Truck className="w-6 h-6 text-green-800" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Active {activeTab}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-full mr-4 border border-yellow-200">
                                <Wrench className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">In Maintenance</p>
                                <h3 className="text-2xl font-bold text-slate-900">{maintenanceCount}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                            <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Out of Service</p>
                                <h3 className="text-2xl font-bold text-slate-900">{oosCount}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Asset List</h3>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="text-sm border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="out_of_service">Out of Service</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                        {loadingVehicles ? (
                            <div className="px-6 py-8 text-sm text-slate-500">Loading assets…</div>
                        ) : vehicles.length === 0 ? (
                            <div className="px-6 py-8 text-sm text-slate-500">No assets found. {canMutate && 'Add one to get started.'}</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Make / Model / Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ownership</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vehicles.map((asset) => (
                                        <tr key={asset.id} className={clsx('hover:bg-slate-50', selectedEquipmentId === asset.id && 'bg-emerald-50')}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{asset.assetTag}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{[asset.year, asset.make, asset.model].filter(Boolean).join(' ')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.ownershipType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.nextServiceDate || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', STATUS_BADGE[asset.status] || STATUS_BADGE.inactive)}>
                                                    {asset.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                <button
                                                    onClick={() => selectAsset(asset.id)}
                                                    className="text-sky-700 hover:text-sky-900 font-medium"
                                                >
                                                    View
                                                </button>
                                                {canMutate && asset.status !== 'archived' && asset.status !== 'retired' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(asset)}
                                                            className="text-green-700 hover:text-green-900 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleArchive(asset)}
                                                            className="text-slate-500 hover:text-slate-700 font-medium"
                                                        >
                                                            Archive
                                                        </button>
                                                        <button
                                                            onClick={() => handleRetire(asset)}
                                                            className="text-red-500 hover:text-red-700 font-medium"
                                                        >
                                                            Retire
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {selectedAsset && (
                        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-slate-800">Selected: {selectedAsset.assetTag}</h3>
                                <button onClick={() => setSelectedEquipmentId(null)} className="text-slate-400 hover:text-slate-600">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">
                                {selectedAsset.year} {selectedAsset.make} {selectedAsset.model} · {selectedAsset.ownershipType} · {selectedAsset.usageMiles?.toLocaleString() || 0} mi / {selectedAsset.usageHours?.toLocaleString() || 0} hrs
                            </p>
                            <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                {[
                                    ['Vehicle #', selectedAsset.vehicleNumber],
                                    ['VIN', selectedAsset.vin],
                                    ['Plate', [selectedAsset.licensePlate, selectedAsset.state].filter(Boolean).join(' · ')],
                                    ['Own / Lease', selectedAsset.ownLease],
                                    ['Driver', selectedAsset.driver],
                                    ['ELD Logging', selectedAsset.eldLogging],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                                        <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
                                        <div className="mt-0.5 font-medium text-slate-700">{value || '—'}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 text-sm">
                                {(['Inspections', 'Maintenance', 'Work Orders', 'Documents'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setProfileTab(tab)}
                                        className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium"
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INSPECTIONS TAB */}
            {profileTab === 'Inspections' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Inspection History</h3>
                            <p className="text-sm text-slate-500">
                                {selectedAsset ? `Showing inspections for ${selectedAsset.assetTag}` : 'Select an asset in the Overview tab to view its inspections.'}
                            </p>
                        </div>
                        <button className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Start Inspection
                        </button>
                    </div>
                    {!selectedEquipmentId ? (
                        <p className="text-sm text-slate-500">No asset selected.</p>
                    ) : loadingLinked ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                    ) : linkedInspections.length === 0 ? (
                        <p className="text-sm text-slate-500">No inspections recorded for this asset.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {linkedInspections.map((insp) => {
                                const hasDefects = insp.out_of_service || (insp.defect_count ?? 0) > 0 || insp.remediation_status === 'Open';
                                return (
                                    <li key={insp.id} className="py-3 flex items-center justify-between text-sm gap-3">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-slate-800">{insp.date} — {insp.inspection_level || 'Inspection'}</span>
                                            {insp.report_number && (
                                                <span className="ml-2 text-xs text-slate-400">#{insp.report_number}</span>
                                            )}
                                            {(insp.defect_count ?? 0) > 0 && (
                                                <span className="ml-2 text-xs text-amber-700">
                                                    {insp.defect_count} defect{insp.defect_count !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={clsx('px-2 py-0.5 text-xs rounded-full font-semibold',
                                                insp.out_of_service ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            )}>
                                                {insp.out_of_service ? 'OOS' : 'Passed'}
                                            </span>
                                            {hasDefects && canMutate && (
                                                <button
                                                    onClick={() => openWoModal({ id: insp.id, report_number: insp.report_number || '', date: insp.date })}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 rounded-md hover:bg-amber-100"
                                                    title="Create work order from this inspection's defects"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Create WO
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {/* MAINTENANCE TAB */}
            {profileTab === 'Maintenance' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Maintenance Schedule</h3>
                            <p className="text-sm text-slate-500">
                                {selectedAsset ? `PM templates applicable to ${selectedAsset.assetTag}` : 'Select an asset to view applicable PM schedules.'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/maintenance')}
                            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50"
                        >
                            <CalendarClock className="w-4 h-4 inline mr-2" />
                            Manage PM
                        </button>
                    </div>
                    {!selectedEquipmentId ? (
                        <p className="text-sm text-slate-500">No asset selected.</p>
                    ) : loadingLinked ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                    ) : linkedPMTemplates.length === 0 ? (
                        <p className="text-sm text-slate-500">No PM templates configured. Add templates in the Maintenance module.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {linkedPMTemplates
                                .filter((t) => !t.appliesToType || t.appliesToType === selectedAsset?.type)
                                .map((t) => (
                                    <li key={t.id} className="py-3 flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-800">{t.name}</span>
                                        <span className="text-xs text-slate-500">
                                            {t.intervalDays ? `Every ${t.intervalDays}d` : ''}
                                            {t.intervalMiles ? ` / ${t.intervalMiles.toLocaleString()} mi` : ''}
                                            {t.intervalHours ? ` / ${t.intervalHours} hrs` : ''}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            )}

            {/* WORK ORDERS TAB */}
            {profileTab === 'Work Orders' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Work Orders</h3>
                                <p className="text-sm text-slate-500">
                                    {selectedAsset ? `Work orders for ${selectedAsset.assetTag}` : 'Select an asset to view its work orders.'}
                                </p>
                            </div>
                            {canMutate && selectedEquipmentId && (
                                <button
                                    type="button"
                                    onClick={() => openWoModal()}
                                    className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 inline-flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Work Order
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate('/work-orders')}
                                className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 inline-flex items-center"
                            >
                                <ClipboardList className="w-4 h-4 inline mr-2" />
                                All Work Orders
                            </button>
                        </div>
                        {!selectedEquipmentId ? (
                            <p className="text-sm text-slate-500">No asset selected.</p>
                        ) : loadingLinked ? (
                            <p className="text-sm text-slate-500">Loading…</p>
                        ) : linkedWorkOrders.length === 0 ? (
                            <p className="text-sm text-slate-500">No work orders for this asset.</p>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-slate-600">{linkedWorkOrders.filter((wo) => !['Completed', 'Closed', 'Cancelled'].includes(wo.status)).length} open · {linkedWorkOrders.filter((wo) => wo.status === 'Completed' || wo.status === 'Closed').length} completed</span>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {linkedWorkOrders.map((wo) => (
                                        <li key={wo.id} className="py-2 flex justify-between items-center">
                                            <span className="font-medium text-slate-900 text-sm">{wo.title}</span>
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">{wo.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* DOCUMENTS TAB */}
            {profileTab === 'Documents' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Asset Documents</h3>
                            <p className="text-sm text-slate-500">
                                {selectedAsset ? `Documents attached to ${selectedAsset.assetTag}` : 'Select an asset to view its documents.'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/documents')}
                            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50"
                        >
                            <Archive className="w-4 h-4 inline mr-2" />
                            Manage Documents
                        </button>
                    </div>
                    {!selectedEquipmentId ? (
                        <p className="text-sm text-slate-500">No asset selected.</p>
                    ) : loadingLinked ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                    ) : linkedDocuments.length === 0 ? (
                        <p className="text-sm text-slate-500">No documents attached to this asset. Upload documents via the Documents module and link them to this asset.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {linkedDocuments.map((doc) => (
                                <li key={doc.id} className="py-2 flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-800">{doc.name}</span>
                                    <span className="text-xs text-slate-500">{doc.category} · {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* SERVICE HISTORY TAB */}
            {profileTab === 'Service History' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Service History</h3>
                            <p className="text-sm text-slate-500">
                                {selectedAsset
                                    ? `Completed and closed work orders for ${selectedAsset.assetTag}`
                                    : 'Select an asset in the Overview tab to view its service history.'}
                            </p>
                        </div>
                        <History className="w-5 h-5 text-slate-400" />
                    </div>
                    {!selectedEquipmentId ? (
                        <p className="text-sm text-slate-500">No asset selected.</p>
                    ) : loadingLinked ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                    ) : (() => {
                        const history = linkedWorkOrders.filter((wo) => ['Completed', 'Closed'].includes(wo.status));
                        if (history.length === 0) {
                            return <p className="text-sm text-slate-500">No completed service records for this asset yet.</p>;
                        }
                        const totalCost = history.reduce((sum: number, wo) => sum + (wo.total_cost || wo.totalCost || 0), 0);
                        return (
                            <>
                                <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
                                    <span>{history.length} service record{history.length !== 1 ? 's' : ''}</span>
                                    {totalCost > 0 && (
                                        <span className="font-medium text-slate-800">
                                            Total cost: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>
                                <ol className="relative border-l border-slate-200 space-y-6 pl-6">
                                    {history.map((wo) => {
                                        const completedDate = String(wo.completedAt || wo.completed_at || '');
                                        const cost = Number(wo.total_cost || wo.totalCost || 0);
                                        return (
                                            <li key={wo.id} className="relative">
                                                <span className="absolute -left-[1.45rem] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-white">
                                                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                                                </span>
                                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-800">{wo.title}</p>
                                                        <span className={clsx(
                                                            'flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide',
                                                            wo.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                                        )}>
                                                            {wo.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                                                        {completedDate && (
                                                            <span>Completed {new Date(completedDate).toLocaleDateString()}</span>
                                                        )}
                                                        {wo.assignedTo || wo.assigned_to ? (
                                                            <span>Tech: {wo.assignedTo || wo.assigned_to}</span>
                                                        ) : null}
                                                        {cost > 0 && (
                                                            <span className="font-medium text-slate-700">
                                                                ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(wo.closeoutNotes || wo.closeout_notes) && (
                                                        <p className="mt-1 text-xs text-slate-500 italic">{wo.closeoutNotes || wo.closeout_notes}</p>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* WORK ORDER CREATION MODAL */}
            <Modal
                isOpen={woModalOpen}
                onClose={() => setWoModalOpen(false)}
                title={woFromInspection ? 'Create Work Order from Inspection Defects' : 'Create Work Order'}
            >
                <form onSubmit={handleCreateWO} className="space-y-4">
                    {woFromInspection && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                            Linked to inspection <strong>{woFromInspection.report_number}</strong> ({woFromInspection.date})
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={woForm.title}
                            onChange={(e) => setWoForm({ ...woForm, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            rows={3}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={woForm.description}
                            onChange={(e) => setWoForm({ ...woForm, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={woForm.priority}
                                onChange={(e) => setWoForm({ ...woForm, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={woForm.dueDate}
                                onChange={(e) => setWoForm({ ...woForm, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setWoModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={woSaving}
                            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {woSaving ? 'Creating…' : 'Create Work Order'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ADD / EDIT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
                title={editingId ? 'Edit Asset' : 'Add New Asset'}
            >
                <form onSubmit={handleAddAsset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID / Tag</label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="TRK-001"
                                value={formData.assetTag}
                                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                                disabled={!!editingId}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                                value={formData.ownershipType}
                                onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value as OwnershipType })}
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
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
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
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Cascadia"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usage (Miles)</label>
                            <input
                                type="number"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="125000"
                                value={formData.usageMiles}
                                onChange={(e) => setFormData({ ...formData, usageMiles: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usage (Hours)</label>
                            <input
                                type="number"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="1200"
                                value={formData.usageHours}
                                onChange={(e) => setFormData({ ...formData, usageHours: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Attachments (cameras, tablets)</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Camera, Tablet"
                            value={formData.attachments}
                            onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Forklift Attachments</label>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                            {['Low Mast', 'Forks', 'Box Clamp', 'Extended Forks', 'Boom'].map((option) => (
                                <label key={option} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.forkliftAttachments.includes(option)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...formData.forkliftAttachments, option]
                                                : formData.forkliftAttachments.filter(item => item !== option);
                                            setFormData({ ...formData, forkliftAttachments: next });
                                        }}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                        <div className="text-sm font-semibold text-slate-800">Vehicle & Leasing</div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identity</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    ['Vehicle #', 'vehicleNumber'],
                                    ['VIN', 'vin'],
                                    ['License Plate #', 'licensePlate'],
                                    ['City', 'city'],
                                ].map(([label, field]) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={String(formData[field as keyof EquipmentFormState])}
                                            onChange={(e) => setFormField(field as keyof EquipmentFormState, e.target.value)}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.state}
                                        onChange={(e) => setFormField('state', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {US_STATE_OPTIONS.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormField('vehicleType', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {VEHICLE_TYPE_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ownership & Leasing</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Own / Lease / Rent</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.ownLease}
                                        onChange={(e) => setFormField('ownLease', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {OWN_LEASE_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                {[
                                    ['Owner', 'owner', 'text'],
                                    ['Mth Lease Charge', 'mthLeaseCharge', 'number'],
                                    ['Mileage Charge', 'mileageCharge', 'number'],
                                    ['Lease Expir. Year', 'leaseExpirYear', 'number'],
                                ].map(([label, field, type]) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            min={type === 'number' ? '0' : undefined}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={String(formData[field as keyof EquipmentFormState])}
                                            onChange={(e) => setFormField(field as keyof EquipmentFormState, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    ['Added to Fleet', 'addedToFleet', 'date'],
                                    ['Removed from Fleet', 'removedFromFleet', 'date'],
                                    ['Follow Up', 'followUp', 'date'],
                                    ['Gross Weight', 'grossWeight', 'number'],
                                    ['Geotab', 'geotab', 'text'],
                                    ['Toll Transponder', 'tollTransponder', 'text'],
                                    ['IMEI #', 'imei', 'text'],
                                    ['ELD Notes', 'eldNotes', 'text'],
                                ].map(([label, field, type]) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            min={type === 'number' ? '0' : undefined}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={String(formData[field as keyof EquipmentFormState])}
                                            onChange={(e) => setFormField(field as keyof EquipmentFormState, e.target.value)}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ELD Logging</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.eldLogging}
                                        onChange={(e) => setFormField('eldLogging', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {ELD_LOGGING_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    ['Driver', 'driver', 'text'],
                                    ['Rep Code', 'repCode', 'text'],
                                    ['Driver Check #', 'driverCheckNumber', 'text'],
                                    ['MGR', 'mgr', 'text'],
                                    ['Email', 'email', 'email'],
                                    ['Ph #', 'phone', 'tel'],
                                ].map(([label, field, type]) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={String(formData[field as keyof EquipmentFormState])}
                                            onChange={(e) => setFormField(field as keyof EquipmentFormState, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metrics & Accounting</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    ['Vehicle Value', 'vehicleValue', 'number'],
                                    ['Months In Service', 'monthsInService', 'number'],
                                    ['2/1/2026', 'asOfDate', 'date'],
                                    ['Avg Miles Per Month', 'avgMilesPerMonth', 'number'],
                                    ['Estimated Odometer 6 months', 'estimatedOdometer6mo', 'number'],
                                    ['Div #', 'divNumber', 'text'],
                                    ['Div', 'division', 'text'],
                                    ['Corp', 'corp', 'text'],
                                    ['GL Acct', 'glAcct', 'text'],
                                    ['Ins. Class', 'insClass', 'text'],
                                ].map(([label, field, type]) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            min={type === 'number' ? '0' : undefined}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={String(formData[field as keyof EquipmentFormState])}
                                            onChange={(e) => setFormField(field as keyof EquipmentFormState, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">NOTES</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.notes}
                                onChange={(e) => setFormField('notes', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveAsset}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            {editingId ? 'Save Changes' : 'Add Asset'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Equipment;
