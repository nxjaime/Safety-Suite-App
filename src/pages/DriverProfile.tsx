import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, ChevronDown, ChevronRight, UserPlus, AlertTriangle, FileText, Trash2, Upload, Mail } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/UI/Modal';
// import { storage } from '../utils/storage';
import { driverService } from '../services/driverService';
import { emailService } from '../services/emailService';
import { generateCheckIns } from '../utils/riskLogic';
import type { Driver } from '../types';
import toast from 'react-hot-toast';

const DriverProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [driver, setDriver] = useState<Driver | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Coaching Plan Modal State
    const [isCoachingModalOpen, setIsCoachingModalOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({
        type: '',
        duration: 4,
        startDate: new Date().toISOString().split('T')[0]
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDriverData, setEditDriverData] = useState({
        name: '',
        status: '',
        phone: '',
        email: '',
        address: '',
        licenseNumber: '',
        terminal: '',
        employeeId: '',
        driverManager: '' // Added Driver Manager field
    });


    // View state for expanding plans
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

    const [newNote, setNewNote] = useState('');

    // Risk Event Modal State
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [newRiskEvent, setNewRiskEvent] = useState<{
        date: string;
        type: string;
        notes: string;
        file: File | null;
    }>({
        date: new Date().toISOString().split('T')[0],
        type: '',
        notes: '',
        file: null
    });

    // Document Modal State
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [driverDocuments, setDriverDocuments] = useState<any[]>([]);
    const [newDocument, setNewDocument] = useState<{
        name: string;
        type: string;
        notes: string;
        expiryDate: string;
        file: File | null;
    }>({
        name: '',
        type: 'General',
        notes: '',
        expiryDate: '',
        file: null
    });

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'documents'>('overview');

    useEffect(() => {
        if (driver) {
            setEditDriverData({
                name: driver.name || '',
                status: driver.status || 'Active',
                phone: driver.phone || '',
                email: driver.email || '',
                address: driver.address || '',
                licenseNumber: driver.licenseNumber || '',
                terminal: driver.terminal || '',
                employeeId: driver.employeeId || '',
                driverManager: driver.driverManager || ''
            });
        }
    }, [driver]);

    useEffect(() => {
        const fetchDriver = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch driver first (critical)
                const driverData = await driverService.getDriverById(id);

                if (driverData) {
                    setDriver(driverData);
                }

                // Fetch documents separately (non-critical - can fail silently)
                try {
                    const docs = await driverService.getDriverDocuments(id);
                    setDriverDocuments(docs);
                } catch (docError) {
                    console.warn("Failed to fetch driver documents", docError);
                    setDriverDocuments([]);
                }
            } catch (error) {
                console.error("Failed to fetch driver data", error);
                toast.error("Failed to load driver profile");
            } finally {
                setLoading(false);
            }
        };

        fetchDriver();
    }, [id, location.search]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!driver) return;
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                await driverService.updateDriver(driver.id, { image: base64String });
                setDriver(prev => prev ? ({ ...prev, image: base64String }) : undefined);
                toast.success('Profile picture updated');
            } catch (error) {
                console.error('Failed to update image', error);
                toast.error('Failed to update picture');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driver) return;

        try {
            const updated = await driverService.updateDriver(driver.id, editDriverData);
            setDriver(updated || undefined);
            setIsEditModalOpen(false);
            toast.success('Driver profile updated');
        } catch (error) {
            console.error('Failed to update driver', error);
            toast.error('Failed to update profile');
        }
    };

    const handleCreateCoachingPlan = () => {
        setIsCoachingModalOpen(true);
    };

    const handleCreateCoachingPlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Ensure event default is prevented if called from form submit
        if (!driver) return;

        const checkIns = generateCheckIns(newPlan.startDate, newPlan.duration);

        const planData = {
            startDate: newPlan.startDate,
            durationWeeks: newPlan.duration,
            type: newPlan.type,
            status: 'Active',
            weeklyCheckIns: checkIns,
            // notes: newPlan.notes // If notes are part of the plan create structure
        };

        try {
            await driverService.addCoachingPlan(driver.id, driver.name, planData);

            // Refresh driver to get new plan with ID
            const updatedDriver = await driverService.getDriverById(driver.id);
            setDriver(updatedDriver || undefined);

            toast.success(`Coaching Plan for ${newPlan.type} created!`);
            setIsCoachingModalOpen(false);
            setNewPlan({ type: '', duration: 4, startDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error(error);
            toast.error('Failed to create coaching plan');
        }
    };

    // State for deletion animation
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

    const handleUpdateCheckIn = async (planId: string, week: number, field: string, value: any) => {
        if (!driver) return;

        // Find the plan to update locally first to get current checkins
        const planToUpdate = driver.coachingPlans?.find((p: any) => p.id === planId);
        if (!planToUpdate) return;

        const updatedCheckIns = planToUpdate.weeklyCheckIns.map((checkIn: any) => {
            if (checkIn.week === week) {
                const updatedCheckIn = { ...checkIn };
                if (field === 'notes') updatedCheckIn.notes = value;
                if (field === 'assignedTo') updatedCheckIn.assignedTo = value;
                if (field === 'status') {
                    updatedCheckIn.status = value ? 'Complete' : 'Pending';
                    updatedCheckIn.completedDate = value ? new Date().toLocaleDateString() : undefined;
                }
                return updatedCheckIn;
            }
            return checkIn;
        });

        const allComplete = updatedCheckIns.every((c: any) => c.status === 'Complete');
        const newStatus = allComplete ? 'Completed' : planToUpdate.status;

        // Optimistic Update
        const previousPlans = driver.coachingPlans;
        const updatedPlans = (driver.coachingPlans || []).map((p: any) =>
            p.id === planId ? { ...p, weeklyCheckIns: updatedCheckIns, status: newStatus } : p
        );
        setDriver({ ...driver, coachingPlans: updatedPlans });

        try {
            await driverService.updateCoachingPlan(planId, {
                weeklyCheckIns: updatedCheckIns, // Service maps this to weekly_check_ins
                status: newStatus
            });
            toast.success('Check-in updated');
        } catch (error) {
            console.error("Check-in update failed:", error);
            toast.error('Failed to update check-in');
            // Revert on error
            setDriver({ ...driver, coachingPlans: previousPlans });
        }
    };

    const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this coaching plan?')) return;

        setDeletingPlanId(planId);

        // Wait for animation
        setTimeout(async () => {
            try {
                await driverService.deleteCoachingPlan(planId);
                toast.success('Coaching plan deleted');
                if (driver) {
                    setDriver(prev => prev ? {
                        ...prev,
                        coachingPlans: prev.coachingPlans?.filter(p => p.id !== planId)
                    } : undefined);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete plan');
                setDeletingPlanId(null); // Reset if failed so it reappears
            }
        }, 500); // 500ms duration matching CSS transition
    };

    const handleAddNote = async () => {
        if (!driver || !newNote.trim()) return;

        const noteEntry = {
            id: Date.now().toString(),
            text: newNote,
            date: new Date().toISOString(),
            author: 'Current User' // Placeholder for now
        };

        const updatedNotes = [noteEntry, ...(driver.notes || [])];

        try {
            // Assuming JSONB notes column on driver
            await driverService.updateDriver(driver.id, { notes: updatedNotes });
            setDriver({ ...driver, notes: updatedNotes });
            setNewNote('');
            toast.success('Note added successfully');
        } catch (error) {
            toast.error('Failed to save note');
        }
    };

    // Document Handlers
    const handleUploadDocument = async () => {
        if (!driver || !newDocument.name) {
            toast.error('Please provide a document name');
            return;
        }

        try {
            const doc = await driverService.uploadDocument(driver.id, {
                name: newDocument.name,
                type: newDocument.type as any,
                notes: newDocument.notes,
                expiryDate: newDocument.expiryDate,
                url: newDocument.file ? newDocument.file.name : '' // Mock URL for now
            });

            setDriverDocuments([doc, ...driverDocuments]);
            setIsDocumentModalOpen(false);
            setNewDocument({ name: '', type: 'General', notes: '', expiryDate: '', file: null });
            toast.success('Document uploaded successfully');
        } catch (error) {
            console.error('Failed to upload document', error);
            toast.error('Failed to upload document');
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await driverService.deleteDocument(docId);
            setDriverDocuments(driverDocuments.filter(d => d.id !== docId));
            toast.success('Document deleted');
        } catch (error) {
            console.error('Failed to delete document', error);
            toast.error('Failed to delete document');
        }
    };

    const riskData = [{ month: 'Jan', score: 45 }, { month: 'Feb', score: 52 }, { month: 'Mar', score: 48 }, { month: 'Apr', score: 60 }, { month: 'May', score: 55 }, { month: 'Jun', score: driver?.riskScore || 20 }];

    const handleLogRiskEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driver) return;

        // Calculate points based on type
        let points = 0;
        switch (newRiskEvent.type) {
            case 'Speeding': points = 10; break;
            case 'Hard Braking': points = 5; break;
            case 'HOS Violation': points = 15; break;
            case 'Accident': points = 20; break;
            case 'Citation': points = 10; break;
            default: points = 5;
        }

        const event = {
            date: newRiskEvent.date,
            type: newRiskEvent.type,
            points,
            notes: newRiskEvent.file
                ? `${newRiskEvent.notes} [Attached: ${newRiskEvent.file.name}]`
                : newRiskEvent.notes
        };

        try {
            await driverService.addRiskEvent(driver.id, event);

            // Recalculate score locally and update DB
            // Or just refresh driver if DB trigger handles it (assuming no trigger for now)
            // Need to update score manually
            const newScore = (driver.riskScore || 0) + points;
            await driverService.updateDriverScore(driver.id, newScore);

            const updatedDriver = await driverService.getDriverById(driver.id);
            setDriver(updatedDriver || undefined);

            toast.success(`Risk event logged: ${newRiskEvent.type} `);
            setIsRiskModalOpen(false);
            setNewRiskEvent({ date: new Date().toISOString().split('T')[0], type: '', notes: '', file: null });
        } catch (error) {
            console.error(error);
            toast.error('Failed to log risk event');
        }
    };

    const handleSendEmailNotification = async () => {
        if (!driver || !driver.email) {
            toast.error('No email address on file for this driver');
            return;
        }

        // Check for active coaching plans
        const activeCoaching = driver.coachingPlans?.filter((p: any) => p.status === 'Active') || [];

        if (activeCoaching.length === 0) {
            toast.error('No active coaching plans to notify about');
            return;
        }

        try {
            // Send coaching reminder email
            const plan = activeCoaching[0];
            const nextCheckIn = plan.weeklyCheckIns?.find((c: any) => c.status !== 'Complete');

            const success = await emailService.sendCoachingReminder({
                driverName: driver.name,
                driverEmail: driver.email,
                coachingType: plan.type,
                checkInDate: nextCheckIn?.date || 'Upcoming',
                week: nextCheckIn?.week || 1
            });

            if (success) {
                toast.success(`Email notification sent to ${driver.email}`);
            } else {
                toast.error('Failed to send email notification');
            }
        } catch (error) {
            console.error('Email send error:', error);
            toast.error('Failed to send email notification');
        }
    };

    if (loading) return <div className="p-6 flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
    if (!driver) return (
        <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Driver Not Found</h2>
            <p className="text-gray-600 mb-4">The driver you requested does not exist or has been removed.</p>
            <button
                onClick={() => navigate('/drivers')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
                Back to Drivers
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('fileInput')?.click()}>
                            <img src={driver.image} alt={driver.name} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover group-hover:opacity-75 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-1 rounded">Change</span>
                            </div>
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{driver.name}</h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>{driver.terminal}</span>
                                <span>•</span>
                                <span>{driver.status}</span>
                                <span>•</span>
                                <span>ID: {driver.employeeId}</span>
                                {driver.driverManager && (
                                    <>
                                        <span>•</span>
                                        <span>Mgr: {driver.driverManager}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Edit Profile
                        </button>
                        <button
                            onClick={() => setIsDocumentModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center justify-center"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Add Document
                        </button>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center space-x-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-w-[150px] text-center">
                            <div className={`text-3xl font-bold ${driver.riskScore > 80 ? 'text-red-600' : 'text-green-600'}`}>
                                {driver.riskScore}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Safety Score</div>
                        </div>

                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Years of Service</div>
                            <div className="text-2xl font-semibold text-gray-900">{driver.yearsOfService}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex space-x-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('safety')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'safety' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Safety & Compliance
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Documents
                    </button>
                </div>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={handleCreateCoachingPlan}
                                className="py-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center text-green-800 font-medium hover:bg-green-100"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Coaching Plan
                            </button>
                            <button
                                onClick={() => setIsRiskModalOpen(true)}
                                className="py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center text-red-800 font-medium hover:bg-red-100"
                            >
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Log Risk Event
                            </button>
                            <button
                                onClick={handleSendEmailNotification}
                                disabled={!driver.email}
                                className="py-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center text-purple-800 font-medium hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={driver.email ? 'Send email notification' : 'No email on file'}
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Send Email
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className="py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-blue-800 font-medium hover:bg-blue-100"
                            >
                                <FileText className="w-5 h-5 mr-2" />
                                All Files
                            </button>
                        </div>

                        {/* Coaching Plans Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Active Coaching Plans</h3>
                            </div>

                            <div className="space-y-4">
                                {(driver.coachingPlans || []).map((plan: any) => (
                                    <div
                                        key={plan.id}
                                        className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-500 ease-in-out ${deletingPlanId === plan.id ? 'opacity-0 transform scale-95 max-h-0 margin-0' : 'opacity-100 max-h-[500px]'
                                            }`}
                                    >
                                        <div
                                            className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                            onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                                        >
                                            <div className="flex items-center space-x-4">
                                                {expandedPlanId === plan.id ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{plan.type} Plan</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Started: {new Date(plan.startDate).toLocaleDateString()} • {plan.durationWeeks} Weeks
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {plan.status}
                                                </span>
                                                <button
                                                    onClick={(e) => handleDeletePlan(plan.id, e)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    title="Delete Plan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedPlanId === plan.id && (
                                            <div className="p-4 border-t border-gray-200 bg-white">
                                                <h5 className="text-sm font-medium text-gray-700 mb-3 block">Weekly Check-ins</h5>
                                                <div className="space-y-3">
                                                    {plan.weeklyCheckIns?.map((checkIn: any) => (
                                                        <div key={checkIn.week} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100">
                                                            <div className="flex items-center space-x-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checkIn.status === 'Complete'}
                                                                    onChange={(e) => handleUpdateCheckIn(plan.id, checkIn.week, 'status', e.target.checked)}
                                                                    className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                                                />
                                                                <span className={checkIn.status === 'Complete' ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                                                    Week {checkIn.week} Check-in
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add note..."
                                                                    value={checkIn.notes || ''}
                                                                    onChange={(e) => handleUpdateCheckIn(plan.id, checkIn.week, 'notes', e.target.value)}
                                                                    className="text-xs border-gray-200 rounded py-1 px-2 w-48 focus:ring-green-500 focus:border-green-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!driver.coachingPlans || driver.coachingPlans.length === 0) && (
                                    <div className="text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded-lg">
                                        No active coaching plans.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Coaching & Notes</h3>

                            <div className="mb-4">
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
                                    placeholder="Add a new note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Note
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {(driver.notes || []).map((note: any) => (
                                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-900">{note.author}</span>
                                            <span className="text-xs text-gray-500">{new Date(note.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{note.text}</p>
                                    </div>
                                ))}
                                {(!driver.notes || driver.notes.length === 0) && (
                                    <p className="text-center text-gray-500 py-8">No notes added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Risk Score Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Score Trend</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={riskData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety Tab Content */}
            {activeTab === 'safety' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {driver.riskEvents && driver.riskEvents.length > 0 && driver.riskEvents.map((event: any) => (
                                    <div key={event.id} className="flex items-start p-4 bg-red-50 rounded-md border border-red-100">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">{event.type} (+{event.points})</h4>
                                            <p className="text-sm text-red-600 mt-1">{new Date(event.date).toLocaleDateString()} • {event.notes}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!driver.riskEvents || driver.riskEvents.length === 0) && (
                                    <div className="text-sm text-gray-500 italic">No recent risk activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Factors</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className="text-sm text-gray-600">Base Score</span>
                                    <div className="font-bold text-gray-900">20</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <span className="text-sm text-gray-600">Risk Events Impact</span>
                                    <div className="font-bold text-red-600">
                                        +{driver.riskEvents ? driver.riskEvents.reduce((s: number, e: any) => s + e.points, 0) : 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents Tab Content */}
            {activeTab === 'documents' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Driver Documents</h3>
                            <button
                                onClick={() => setIsDocumentModalOpen(true)}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {driverDocuments.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {doc.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(doc.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {driverDocuments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                No documents uploaded.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={isCoachingModalOpen}
                onClose={() => setIsCoachingModalOpen(false)}
                title={`Create Coaching Plan for ${driver.name}`}
            >
                <form onSubmit={handleCreateCoachingPlanSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coaching Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newPlan.type}
                            onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                            required
                        >
                            <option value="">Select Behavior</option>
                            <option value="Speeding">Speeding</option>
                            <option value="Harsh Braking">Harsh Braking</option>
                            <option value="Distracted Driving">Distracted Driving</option>
                            <option value="HOS Violation">HOS Violation</option>
                            <option value="Pre-Trip Inspection">Pre-Trip Inspection</option>
                            <option value="General Safety">General Safety</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Weeks)</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newPlan.duration}
                            onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                        >
                            <option value={2}>2 Weeks</option>
                            <option value={4}>4 Weeks</option>
                            <option value={6}>6 Weeks</option>
                            <option value={8}>8 Weeks</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newPlan.startDate}
                            onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsCoachingModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Create Plan
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isRiskModalOpen}
                onClose={() => setIsRiskModalOpen(false)}
                title={`Log Risk Event for ${driver.name}`}
            >
                <form onSubmit={handleLogRiskEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newRiskEvent.date}
                            onChange={(e) => setNewRiskEvent({ ...newRiskEvent, date: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newRiskEvent.type}
                                onChange={(e) => setNewRiskEvent({ ...newRiskEvent, type: e.target.value })}
                            >
                                <option value="">Select Type</option>
                                <option value="Speeding">Speeding (+10)</option>
                                <option value="Hard Braking">Hard Braking (+5)</option>
                                <option value="HOS Violation">HOS Violation (+15)</option>
                                <option value="Accident">Accident (+20)</option>
                                <option value="Citation">Citation (+10)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points Impact</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-gray-500"
                                value={
                                    newRiskEvent.type === 'Speeding' ? 10 :
                                        newRiskEvent.type === 'Hard Braking' ? 5 :
                                            newRiskEvent.type === 'HOS Violation' ? 15 :
                                                newRiskEvent.type === 'Accident' ? 20 :
                                                    newRiskEvent.type === 'Citation' ? 10 : 0
                                }
                                readOnly
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={3}
                            placeholder="Enter event details..."
                            value={newRiskEvent.notes}
                            onChange={(e) => setNewRiskEvent({ ...newRiskEvent, notes: e.target.value })}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Document</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="risk-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                        <span>Upload a file</span>
                                        <input
                                            id="risk-file-upload"
                                            name="risk-file-upload"
                                            type="file"
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setNewRiskEvent({ ...newRiskEvent, file: e.target.files[0] });
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {newRiskEvent.file ? newRiskEvent.file.name : 'PNG, JPG, PDF up to 10MB'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsRiskModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Log Event
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                title="Upload Driver Document"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Medical Certificate"
                            value={newDocument.name}
                            onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newDocument.type}
                            onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                        >
                            <option value="License">License</option>
                            <option value="Medical">Medical</option>
                            <option value="Certification">Certification</option>
                            <option value="Training">Training</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newDocument.expiryDate}
                            onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                        <input
                            type="file"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onChange={(e) => e.target.files && setNewDocument({ ...newDocument, file: e.target.files[0] })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setIsDocumentModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUploadDocument}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Upload
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Driver Profile"
            >
                <form onSubmit={handleUpdateDriver} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.name}
                                onChange={(e) => setEditDriverData({ ...editDriverData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.employeeId}
                                onChange={(e) => setEditDriverData({ ...editDriverData, employeeId: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Manager</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. John Doe"
                            value={editDriverData.driverManager}
                            onChange={(e) => setEditDriverData({ ...editDriverData, driverManager: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.status}
                                onChange={(e) => setEditDriverData({ ...editDriverData, status: e.target.value })}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.phone}
                                onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.email}
                                onChange={(e) => setEditDriverData({ ...editDriverData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.address}
                            onChange={(e) => setEditDriverData({ ...editDriverData, address: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.licenseNumber}
                                onChange={(e) => setEditDriverData({ ...editDriverData, licenseNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={editDriverData.terminal}
                                onChange={(e) => setEditDriverData({ ...editDriverData, terminal: e.target.value })}
                            >
                                <option value="North East">North East</option>
                                <option value="South West">South West</option>
                                <option value="Central">Central</option>
                                <option value="West Coast">West Coast</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DriverProfile;
