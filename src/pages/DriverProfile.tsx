import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, ChevronDown, ChevronRight, UserPlus, AlertTriangle, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/UI/Modal';
// import { storage } from '../utils/storage';
import { driverService } from '../services/driverService';
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
        terminal: ''
    });


    // View state for expanding plans
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

    const [newNote, setNewNote] = useState('');

    // Risk Event Modal State
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [newRiskEvent, setNewRiskEvent] = useState({
        date: new Date().toISOString().split('T')[0],
        type: '',
        notes: ''
    });

    useEffect(() => {
        if (driver) {
            setEditDriverData({
                name: driver.name || '',
                status: driver.status || 'Active',
                phone: driver.phone || '',
                email: driver.email || '',
                address: driver.address || '',
                licenseNumber: driver.licenseNumber || '',
                terminal: driver.terminal || ''
            });
        }
    }, [driver]);

    useEffect(() => {
        const fetchDriver = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const foundDriver = await driverService.getDriverById(id);
                if (foundDriver) {
                    setDriver(foundDriver);
                }
            } catch (error) {
                console.error("Failed to fetch driver", error);
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

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driver) return;

        const checkIns = generateCheckIns(newPlan.startDate, newPlan.duration);

        const planData = {
            startDate: newPlan.startDate,
            durationWeeks: newPlan.duration,
            type: newPlan.type,
            status: 'Active',
            weeklyCheckIns: checkIns
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

        try {
            await driverService.updateCoachingPlan(planId, {
                weeklyCheckIns: updatedCheckIns,
                status: newStatus
            });

            // Optimistic Update or Refresh
            const updatedPlans = (driver.coachingPlans || []).map((p: any) =>
                p.id === planId ? { ...p, weeklyCheckIns: updatedCheckIns, status: newStatus } : p
            );
            setDriver({ ...driver, coachingPlans: updatedPlans });
            toast.success('Check-in updated');
        } catch (error) {
            toast.error('Failed to update check-in');
        }
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

    const handleViewFiles = () => {
        navigate('/documents');
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

    const riskData = [{ month: 'Jan', score: 45 }, { month: 'Feb', score: 52 }, { month: 'Mar', score: 48 }, { month: 'Apr', score: 60 }, { month: 'May', score: 55 }, { month: 'Jun', score: driver.riskScore }];

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
            notes: newRiskEvent.notes
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

            toast.success(`Risk event logged: ${newRiskEvent.type}`);
            setIsRiskModalOpen(false);
            setNewRiskEvent({ date: new Date().toISOString().split('T')[0], type: '', notes: '' });
        } catch (error) {
            console.error(error);
            toast.error('Failed to log risk event');
        }
    };

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
                            </div>
                            <div className="mt-4 flex space-x-3">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                                <button
                                    onClick={handleCreateCoachingPlan}
                                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 text-sm font-medium rounded-md hover:bg-green-200 flex items-center"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Create Coaching Plan
                                </button>
                                <button
                                    onClick={() => setIsRiskModalOpen(true)}
                                    className="px-4 py-2 bg-red-50 text-red-800 border border-red-200 text-sm font-medium rounded-md hover:bg-red-100 flex items-center"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Log Risk Event
                                </button>
                                <button
                                    onClick={handleViewFiles}
                                    className="px-4 py-2 border border-green-200 bg-white text-green-800 text-sm font-medium rounded-md hover:bg-green-50"
                                >
                                    View Files
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center space-x-8">
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Risk Score</div>
                            <div className={`text-4xl font-bold ${driver.riskScore > 80 ? 'text-red-600' : 'text-green-600'}`}>
                                {driver.riskScore}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Dynamic Score</div>
                        </div>
                        <div className="h-12 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Years of Service</div>
                            <div className="text-2xl font-semibold text-gray-900">{driver.yearsOfService}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                                    className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-1" /> Add Note
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {driver.notes && driver.notes.length > 0 ? (
                                driver.notes.map((note: any) => (
                                    <div key={note.id} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-gray-600">{note.author}</span>
                                            <span className="text-xs text-gray-400">{new Date(note.date).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No notes recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Coaching Plans Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Coaching Plans</h3>
                        {driver.coachingPlans && driver.coachingPlans.length > 0 ? (
                            <div className="space-y-4">
                                {driver.coachingPlans.map((plan: any) => (
                                    <div key={plan.id} className="border border-gray-200 rounded-md overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                                            onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {expandedPlanId === plan.id ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">{plan.type} Plan</h4>
                                                    <p className="text-xs text-gray-500">Started: {plan.status === 'Active' ? new Date(plan.startDate).toLocaleDateString() : 'N/A'} • {plan.durationWeeks} Weeks</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {plan.status}
                                            </span>
                                        </div>

                                        {expandedPlanId === plan.id && (
                                            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                                                {plan.weeklyCheckIns && plan.weeklyCheckIns.map((checkIn: any) => (
                                                    <div key={checkIn.week} className="flex flex-col space-y-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-700">Week {checkIn.week} - Due: {checkIn.date}</span>
                                                            <span className="text-xs text-gray-400">Target: {checkIn.completedDate || 'Pending'}</span>
                                                        </div>

                                                        {/* Assigned To Select */}
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <label className="text-xs text-gray-500">Assigned To:</label>
                                                            <select
                                                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                                                                value={checkIn.assignedTo}
                                                                onChange={(e) => handleUpdateCheckIn(plan.id, checkIn.week, 'assignedTo', e.target.value)}
                                                            >
                                                                <option value="Safety Manager">Safety Manager</option>
                                                                <option value="Fleet Manager">Fleet Manager</option>
                                                                <option value="Dispatcher">Dispatcher</option>
                                                                <option value="Admin">Admin</option>
                                                            </select>
                                                        </div>

                                                        <textarea
                                                            className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                                            placeholder="Manager notes..."
                                                            value={checkIn.notes}
                                                            onChange={(e) => handleUpdateCheckIn(plan.id, checkIn.week, 'notes', e.target.value)}
                                                        />
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={checkIn.status === 'Complete'}
                                                                onChange={(e) => handleUpdateCheckIn(plan.id, checkIn.week, 'status', e.target.checked)}
                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                            />
                                                            <span className="text-sm text-gray-600">Mark as Complete</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No active coaching plans.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Safety Score Trend</h3>
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

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {/* Show Risk Events First/Alongside */}
                            {driver.riskEvents && driver.riskEvents.length > 0 && driver.riskEvents.map((event: any) => (
                                <div key={event.id} className="flex items-start p-4 bg-red-50 rounded-md border border-red-100">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800">{event.type} (+{event.points})</h4>
                                        <p className="text-sm text-red-600 mt-1">{new Date(event.date).toLocaleDateString()} • {event.notes}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Fallback Legacy Display if using mock data without riskEvents */}
                            {(!driver.riskEvents || driver.riskEvents.length === 0) && driver.accidents && driver.accidents.length > 0 && (
                                driver.accidents.map((accident: any) => (
                                    <div key={accident.id} className="flex items-start p-4 bg-red-50 rounded-md border border-red-100">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">Accident: {accident.type}</h4>
                                            <p className="text-sm text-red-600 mt-1">
                                                Severity: {accident.severity} • {accident.preventable ? 'Preventable' : 'Non-Preventable'} • {accident.date}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {(!driver.riskEvents || driver.riskEvents.length === 0) && driver.citations && driver.citations.length > 0 && (
                                driver.citations.map((citation: any) => (
                                    <div key={citation.id} className="flex items-start p-4 bg-yellow-50 rounded-md border border-yellow-100">
                                        <FileText className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                                        <div>
                                            <h4 className="text-sm font-medium text-yellow-800">Citation: {citation.details}</h4>
                                            <p className="text-sm text-yellow-600 mt-1">{citation.date}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {(!driver.riskEvents?.length && !driver.accidents?.length && !driver.citations?.length) && (
                                <div className="text-sm text-gray-500 italic">No recent risk activity</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Score Factors simplified for brevity since we're using dynamic score mostly */}
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
                                    +{driver.riskEvents
                                        ? driver.riskEvents.reduce((s: number, e: any) => s + e.points, 0)
                                        : (driver.accidents?.length || 0 * 20 + driver.citations?.length || 0 * 10)}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-md">
                                <span className="text-sm text-gray-600">Coaching Credits</span>
                                <div className="font-bold text-green-600">
                                    -{(driver.coachingPlans?.filter((p: any) => p.status === 'Completed').length || 0) * 5}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-md">
                                <span className="text-sm text-gray-600">Safe Time Discount</span>
                                <div className="font-bold text-green-600">-{driver.yearsOfService * 2}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isCoachingModalOpen}
                onClose={() => setIsCoachingModalOpen(false)}
                title={`Create Coaching Plan for ${driver.name}`}
            >
                <form onSubmit={handleSavePlan} className="space-y-4">
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
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Weeks)</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newPlan.duration}
                            onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                        />
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

            {/* Risk Event Modal */}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
            {/* Edit Driver Modal */}
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
