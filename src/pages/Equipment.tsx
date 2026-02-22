import React, { useState, useEffect } from 'react';
import { Truck, AlertTriangle, Wrench, ClipboardList, FileText, CalendarClock } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settingsService';

export const equipmentProfileTabs = ['Overview', 'Inspections', 'Maintenance', 'Work Orders'] as const;

export const OWN_LEASE_OPTIONS = ['Own', 'Lease', 'Rent'] as const;
export const ELD_LOGGING_OPTIONS = ['Enabled', 'Disabled', 'Exempt'] as const;
export const VEHICLE_TYPE_OPTIONS = ['Sales Vehicle', 'Truck', 'Trailer'] as const;
export const US_STATE_OPTIONS = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
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
    'NOTES'
] as const;

type EquipmentCategory = 'Trucks' | 'Trailers' | 'Forklifts' | 'Pallet Jacks' | 'Sales Vehicles';
type OwnLeaseOption = (typeof OWN_LEASE_OPTIONS)[number];
type EldLoggingOption = (typeof ELD_LOGGING_OPTIONS)[number];
type VehicleTypeOption = (typeof VEHICLE_TYPE_OPTIONS)[number];
type StateOption = (typeof US_STATE_OPTIONS)[number];

type EquipmentRow = {
    id: string;
    type: string;
    make: string;
    model: string;
    year: number;
    status: string;
    nextService: string;
    category: EquipmentCategory;
    ownLease: OwnLeaseOption;
    usageMiles: number;
    usageHours: number;
    attachments: string[];
    forkliftAttachments: string[];
    removedFromFleet?: string;
    addedToFleet?: string;
    divNumber?: string;
    division?: string;
    corp?: string;
    owner?: string;
    city?: string;
    state?: StateOption | '';
    vehicleNumber?: string;
    vin?: string;
    insClass?: string;
    glAcct?: string;
    grossWeight?: number | null;
    geotab?: string;
    tollTransponder?: string;
    driver?: string;
    repCode?: string;
    driverCheckNumber?: string;
    mthLeaseCharge?: number | null;
    mileageCharge?: number | null;
    followUp?: string;
    leaseExpirYear?: number | null;
    vehicleValue?: number | null;
    licensePlate?: string;
    notes?: string;
    monthsInService?: number | null;
    asOfDate?: string;
    avgMilesPerMonth?: number | null;
    estimatedOdometer6mo?: number | null;
    mgr?: string;
    eldLogging?: EldLoggingOption | '';
    email?: string;
    phone?: string;
    imei?: string;
    eldNotes?: string;
    vehicleType?: VehicleTypeOption | '';
};

type EquipmentFormState = {
    id: string;
    type: string;
    make: string;
    model: string;
    year: string;
    ownLease: OwnLeaseOption;
    status: string;
    usageMiles: string;
    usageHours: string;
    attachments: string;
    forkliftAttachments: string[];
    removedFromFleet: string;
    addedToFleet: string;
    divNumber: string;
    division: string;
    corp: string;
    owner: string;
    city: string;
    state: StateOption | '';
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

const parseNumber = (value: string) => {
    if (!value || value.trim() === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
};

const parseIntNumber = (value: string) => {
    if (!value || value.trim() === '') return null;
    const num = parseInt(value, 10);
    return Number.isNaN(num) ? null : num;
};

export const buildEquipmentRow = (
    form: EquipmentFormState,
    category: EquipmentCategory,
    nextService: string
): EquipmentRow => ({
    id: form.id.trim(),
    type: form.type.trim(),
    make: form.make.trim(),
    model: form.model.trim(),
    year: parseInt(form.year, 10),
    status: form.status,
    nextService,
    category,
    ownLease: form.ownLease,
    usageMiles: form.usageMiles ? parseInt(form.usageMiles, 10) : 0,
    usageHours: form.usageHours ? parseInt(form.usageHours, 10) : 0,
    attachments: form.attachments
        ? form.attachments.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    forkliftAttachments: form.forkliftAttachments,
    removedFromFleet: form.removedFromFleet || '',
    addedToFleet: form.addedToFleet || '',
    divNumber: form.divNumber.trim() || '',
    division: form.division.trim() || '',
    corp: form.corp.trim() || '',
    owner: form.owner.trim() || '',
    city: form.city.trim() || '',
    state: form.state || '',
    vehicleNumber: form.vehicleNumber.trim() || '',
    vin: form.vin.trim() || '',
    insClass: form.insClass.trim() || '',
    glAcct: form.glAcct.trim() || '',
    grossWeight: parseIntNumber(form.grossWeight),
    geotab: form.geotab.trim() || '',
    tollTransponder: form.tollTransponder.trim() || '',
    driver: form.driver.trim() || '',
    repCode: form.repCode.trim() || '',
    driverCheckNumber: form.driverCheckNumber.trim() || '',
    mthLeaseCharge: parseNumber(form.mthLeaseCharge),
    mileageCharge: parseNumber(form.mileageCharge),
    followUp: form.followUp || '',
    leaseExpirYear: parseIntNumber(form.leaseExpirYear),
    vehicleValue: parseNumber(form.vehicleValue),
    licensePlate: form.licensePlate.trim() || '',
    notes: form.notes.trim() || '',
    monthsInService: parseIntNumber(form.monthsInService),
    asOfDate: form.asOfDate || '',
    avgMilesPerMonth: parseIntNumber(form.avgMilesPerMonth),
    estimatedOdometer6mo: parseIntNumber(form.estimatedOdometer6mo),
    mgr: form.mgr.trim() || '',
    eldLogging: form.eldLogging || '',
    email: form.email.trim() || '',
    phone: form.phone.trim() || '',
    imei: form.imei.trim() || '',
    eldNotes: form.eldNotes.trim() || '',
    vehicleType: form.vehicleType || ''
});

const Equipment: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<EquipmentCategory>('Trucks');
    const [profileTab, setProfileTab] = useState<(typeof equipmentProfileTabs)[number]>('Overview');
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [newAsset, setNewAsset] = useState<EquipmentFormState>({
        id: '',
        type: '',
        make: '',
        model: '',
        year: '',
        ownLease: 'Own',
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
        vehicleType: ''
    });

    const [vehicles, setVehicles] = useState<EquipmentRow[]>([
        { id: 'TRK-101', type: 'Truck', make: 'Freightliner', model: 'Cascadia', year: 2022, status: 'active', nextService: '2023-11-15', category: 'Trucks', ownLease: 'Own', usageMiles: 182340, usageHours: 3200, attachments: ['Camera', 'Tablet'], forkliftAttachments: [] },
        { id: 'TRK-102', type: 'Truck', make: 'Volvo', model: 'VNL 860', year: 2021, status: 'maintenance', nextService: '2023-10-20', category: 'Trucks', ownLease: 'Lease', usageMiles: 140010, usageHours: 2600, attachments: ['Camera'], forkliftAttachments: [] },
        { id: 'TRL-501', type: 'Trailer', make: 'Wabash', model: 'Duraplate', year: 2020, status: 'active', nextService: '2023-12-01', category: 'Trailers', ownLease: 'Rent', usageMiles: 84500, usageHours: 0, attachments: [], forkliftAttachments: [] },
        { id: 'TRL-502', type: 'Trailer', make: 'Great Dane', model: 'Champion', year: 2019, status: 'out_of_service', nextService: '2023-10-15', category: 'Trailers', ownLease: 'Own', usageMiles: 121300, usageHours: 0, attachments: [], forkliftAttachments: [] },
        { id: 'FRK-201', type: 'Forklift', make: 'Toyota', model: '8FGCU25', year: 2022, status: 'active', nextService: '2023-11-01', category: 'Forklifts', ownLease: 'Lease', usageMiles: 0, usageHours: 1120, attachments: [], forkliftAttachments: ['Forks', 'Box Clamp'] },
        { id: 'PAL-701', type: 'Pallet Jack', make: 'Crown', model: 'PTH50', year: 2021, status: 'active', nextService: '2023-12-08', category: 'Pallet Jacks', ownLease: 'Own', usageMiles: 0, usageHours: 320, attachments: [], forkliftAttachments: [] },
        { id: 'SAL-401', type: 'Sales Vehicle', make: 'Ford', model: 'Transit', year: 2023, status: 'active', nextService: '2024-01-10', category: 'Sales Vehicles', ownLease: 'Own', usageMiles: 18400, usageHours: 0, attachments: ['Camera'], forkliftAttachments: [] },
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
                    setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
                }
            } catch (err) {
                console.error('Failed to load vehicle types', err);
                setVehicleTypes(['Truck', 'Trailer', 'Forklift', 'Pallet Jack', 'Sales Vehicle']);
            }
        };
        loadSettings();
    }, []);

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        const baseAsset = buildEquipmentRow(newAsset, activeTab, editingId ? (vehicles.find(v => v.id === editingId)?.nextService || 'Pending') : 'Pending');

        if (editingId) {
            setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...baseAsset, category: v.category, nextService: v.nextService } : v));
            setEditingId(null);
            toast.success('Asset updated successfully');
        } else {
            setVehicles([...vehicles, baseAsset]);
            toast.success('Asset added successfully');
        }
        setIsModalOpen(false);
        setNewAsset({
            id: '',
            type: '',
            make: '',
            model: '',
            year: '',
            ownLease: 'Own',
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
            vehicleType: ''
        });
    };

    const handleEdit = (vehicle: any) => {
        setNewAsset({
            id: vehicle.id,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.model || '',
            year: vehicle.year.toString(),
            ownLease: vehicle.ownLease || 'Own',
            status: vehicle.status || 'active',
            usageMiles: vehicle.usageMiles?.toString() || '',
            usageHours: vehicle.usageHours?.toString() || '',
            attachments: vehicle.attachments?.join(', ') || '',
            forkliftAttachments: vehicle.forkliftAttachments || [],
            removedFromFleet: vehicle.removedFromFleet || '',
            addedToFleet: vehicle.addedToFleet || '',
            divNumber: vehicle.divNumber || '',
            division: vehicle.division || '',
            corp: vehicle.corp || '',
            owner: vehicle.owner || '',
            city: vehicle.city || '',
            state: vehicle.state || '',
            vehicleNumber: vehicle.vehicleNumber || '',
            vin: vehicle.vin || '',
            insClass: vehicle.insClass || '',
            glAcct: vehicle.glAcct || '',
            grossWeight: vehicle.grossWeight?.toString() || '',
            geotab: vehicle.geotab || '',
            tollTransponder: vehicle.tollTransponder || '',
            driver: vehicle.driver || '',
            repCode: vehicle.repCode || '',
            driverCheckNumber: vehicle.driverCheckNumber || '',
            mthLeaseCharge: vehicle.mthLeaseCharge?.toString() || '',
            mileageCharge: vehicle.mileageCharge?.toString() || '',
            followUp: vehicle.followUp || '',
            leaseExpirYear: vehicle.leaseExpirYear?.toString() || '',
            vehicleValue: vehicle.vehicleValue?.toString() || '',
            licensePlate: vehicle.licensePlate || '',
            notes: vehicle.notes || '',
            monthsInService: vehicle.monthsInService?.toString() || '',
            asOfDate: vehicle.asOfDate || '',
            avgMilesPerMonth: vehicle.avgMilesPerMonth?.toString() || '',
            estimatedOdometer6mo: vehicle.estimatedOdometer6mo?.toString() || '',
            mgr: vehicle.mgr || '',
            eldLogging: vehicle.eldLogging || '',
            email: vehicle.email || '',
            phone: vehicle.phone || '',
            imei: vehicle.imei || '',
            eldNotes: vehicle.eldNotes || '',
            vehicleType: vehicle.vehicleType || ''
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
            ownLease: 'Own',
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
            vehicleType: ''
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Open Work Orders</h3>
                            <p className="text-sm text-slate-500">Track repairs and service requests.</p>
                        </div>
                        <button className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50">
                            <ClipboardList className="w-4 h-4 inline mr-2" />
                            Create Work Order
                        </button>
                    </div>
                    <div className="text-sm text-slate-500">No active work orders for this equipment.</div>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Own / Lease / Rent</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAsset.ownLease}
                                onChange={(e) => setNewAsset({ ...newAsset, ownLease: e.target.value as OwnLeaseOption })}
                            >
                                {OWN_LEASE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
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

                    <div className="border-t border-slate-200 pt-4 space-y-4">
                        <div className="text-sm font-semibold text-slate-800">Vehicle & Leasing</div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identity</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle #</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.vehicleNumber}
                                        onChange={(e) => setNewAsset({ ...newAsset, vehicleNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">VIN</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.vin}
                                        onChange={(e) => setNewAsset({ ...newAsset, vin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">License Plate #</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.licensePlate}
                                        onChange={(e) => setNewAsset({ ...newAsset, licensePlate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.state}
                                        onChange={(e) => setNewAsset({ ...newAsset, state: e.target.value as StateOption })}
                                    >
                                        <option value="">Select</option>
                                        {US_STATE_OPTIONS.map((state) => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.city}
                                        onChange={(e) => setNewAsset({ ...newAsset, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.vehicleType}
                                        onChange={(e) => setNewAsset({ ...newAsset, vehicleType: e.target.value as VehicleTypeOption })}
                                    >
                                        <option value="">Select</option>
                                        {VEHICLE_TYPE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ownership & Leasing</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.owner}
                                        onChange={(e) => setNewAsset({ ...newAsset, owner: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mth Lease Charge</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.mthLeaseCharge}
                                        onChange={(e) => setNewAsset({ ...newAsset, mthLeaseCharge: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mileage Charge</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.mileageCharge}
                                        onChange={(e) => setNewAsset({ ...newAsset, mileageCharge: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lease Expir. Year</label>
                                    <input
                                        type="number"
                                        min="1900"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.leaseExpirYear}
                                        onChange={(e) => setNewAsset({ ...newAsset, leaseExpirYear: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Added to Fleet</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.addedToFleet}
                                        onChange={(e) => setNewAsset({ ...newAsset, addedToFleet: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Removed from Fleet</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.removedFromFleet}
                                        onChange={(e) => setNewAsset({ ...newAsset, removedFromFleet: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Follow Up</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.followUp}
                                        onChange={(e) => setNewAsset({ ...newAsset, followUp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gross Weight</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.grossWeight}
                                        onChange={(e) => setNewAsset({ ...newAsset, grossWeight: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Geotab</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.geotab}
                                        onChange={(e) => setNewAsset({ ...newAsset, geotab: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Toll Transponder</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.tollTransponder}
                                        onChange={(e) => setNewAsset({ ...newAsset, tollTransponder: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ELD Logging</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.eldLogging}
                                        onChange={(e) => setNewAsset({ ...newAsset, eldLogging: e.target.value as EldLoggingOption })}
                                    >
                                        <option value="">Select</option>
                                        {ELD_LOGGING_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">IMEI #</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.imei}
                                        onChange={(e) => setNewAsset({ ...newAsset, imei: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ELD Notes</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.eldNotes}
                                        onChange={(e) => setNewAsset({ ...newAsset, eldNotes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Driver</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.driver}
                                        onChange={(e) => setNewAsset({ ...newAsset, driver: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rep Code</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.repCode}
                                        onChange={(e) => setNewAsset({ ...newAsset, repCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Driver Check #</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.driverCheckNumber}
                                        onChange={(e) => setNewAsset({ ...newAsset, driverCheckNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">MGR</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.mgr}
                                        onChange={(e) => setNewAsset({ ...newAsset, mgr: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.email}
                                        onChange={(e) => setNewAsset({ ...newAsset, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ph #</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.phone}
                                        onChange={(e) => setNewAsset({ ...newAsset, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metrics</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Value</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.vehicleValue}
                                        onChange={(e) => setNewAsset({ ...newAsset, vehicleValue: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Months In Service</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.monthsInService}
                                        onChange={(e) => setNewAsset({ ...newAsset, monthsInService: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">2/1/2026</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.asOfDate}
                                        onChange={(e) => setNewAsset({ ...newAsset, asOfDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Avg Miles Per Month</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.avgMilesPerMonth}
                                        onChange={(e) => setNewAsset({ ...newAsset, avgMilesPerMonth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Odometer 6 months</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.estimatedOdometer6mo}
                                        onChange={(e) => setNewAsset({ ...newAsset, estimatedOdometer6mo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accounting</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Div #</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.divNumber}
                                        onChange={(e) => setNewAsset({ ...newAsset, divNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Div</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.division}
                                        onChange={(e) => setNewAsset({ ...newAsset, division: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Corp</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.corp}
                                        onChange={(e) => setNewAsset({ ...newAsset, corp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">GL Acct</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.glAcct}
                                        onChange={(e) => setNewAsset({ ...newAsset, glAcct: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ins. Class</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newAsset.insClass}
                                        onChange={(e) => setNewAsset({ ...newAsset, insClass: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">NOTES</label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={newAsset.notes}
                                    onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                                />
                            </div>
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
