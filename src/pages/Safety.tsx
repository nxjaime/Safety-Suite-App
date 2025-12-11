import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, AlertTriangle, Plus, Calendar, User, Download } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { driverService } from '../services/driverService';

const Safety: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({ riskScore: 32, incidentCount: 12, coachingCount: 8 });
    const [loading, setLoading] = useState(true);
    const [newCoaching, setNewCoaching] = useState({
        driverName: '',
        date: '',
        type: '',
        notes: ''
    });



    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const stats = await driverService.fetchSafetyStats();
            setStats(stats);
        } catch (error) {
            toast.error('Failed to load safety data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCoaching = async (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate points based on type
        let points = 0;
        switch (newCoaching.type) {
            case 'Speeding': points = 10; break;
            case 'Hard Braking': points = 5; break;
            case 'HOS Violation': points = 15; break;
            case 'Accident': points = 20; break;
            case 'Citation': points = 10; break;
            default: points = 5;
        }

        try {
            // We need driver ID. Since we don't load all drivers anymore, 
            // for now, we should probably change this UI to search for a driver or 
            // if this is a "Top Level" action, maybe purely search-based.
            // But the current UI has a simple select dropdown which assumes we have the list.
            // Let's quickly search for the driver by name to get ID.
            const { data: drivers } = await driverService.fetchDriversPaginated(1, 1, { search: newCoaching.driverName });

            if (!drivers || drivers.length === 0) {
                toast.error('Driver not found');
                return;
            }
            const driver = drivers[0];

            await driverService.addRiskEvent(driver.id, {
                date: newCoaching.date,
                type: newCoaching.type,
                points,
                notes: newCoaching.notes
            });

            // Optimistic update or refetch
            // For now, simple refetch to ensure consistency
            await loadData();

            toast.success('Risk event logged to Supabase');
            setIsModalOpen(false);
            setNewCoaching({ driverName: '', date: '', type: '', notes: '' });

        } catch (error) {
            toast.error('Failed to log event');
            console.error(error);
        }
    };

    const data = [
        { name: 'Speeding', count: 45 },
        { name: 'Hard Brake', count: 32 },
        { name: 'HOS Violation', count: 18 },
        { name: 'Distraction', count: 12 },
        { name: 'Seatbelt', count: 8 },
    ];

    const riskData = [
        { name: 'Low Risk', value: 65, color: '#10B981' },
        { name: 'Medium Risk', value: 25, color: '#F59E0B' },
        { name: 'High Risk', value: 10, color: '#EF4444' },
    ];

    const handleExportReport = async () => {
        const drivers = await driverService.fetchDrivers();
        const headers = ['Driver Name', 'Risk Score', 'Status', 'Total Incidents', 'Active Coaching Plans'];

        const rows = drivers.map(d => [
            d.name,
            d.riskScore.toString(),
            d.status,
            ((d.accidents?.length || 0) + (d.citations?.length || 0) + (d.riskEvents?.length || 0)).toString(),
            (d.coachingPlans?.filter((p: any) => p.status === 'Active').length || 0).toString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `safety_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Safety Report exported successfully");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Safety & Risk Overview</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Log Event
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-white text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-50 flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/drivers" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fleet Risk Score</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.riskScore}</h3>
                        </div>
                        <div className="ml-auto flex items-center text-sm text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span>-2.5%</span>
                        </div>
                    </div>
                </Link>

                <Link to="/safeview" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                            <AlertTriangle className="w-6 h-6 text-green-800" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Incidents</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.incidentCount}</h3>
                        </div>
                        <div className="ml-auto text-sm text-gray-500">
                            This Month
                        </div>
                    </div>
                </Link>

                <Link to="/tasks" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-100 rounded-full mr-4 border border-blue-200">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Coaching</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.coachingCount}</h3>
                        </div>
                        <div className="ml-auto text-sm text-gray-500">
                            Drivers
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top Incident Types</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Fleet Risk Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center space-x-6 mt-4">
                            {riskData.map((entry, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-sm text-gray-600">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Log Risk Event"
            >
                <form onSubmit={handleAddCoaching} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newCoaching.driverName}
                                onChange={(e) => setNewCoaching({ ...newCoaching, driverName: e.target.value })}
                            >
                                <option value="">Select Driver (Type exact name for now)</option>
                                {/* We removed driverList state, so we can't map options easily without fetching all. 
                                    Ideally this should be an async searchable select.
                                    For now, let's make it a text input or explain limit. 
                                    Or let's just fetch simplified list if list is small? 
                                    "Safety Suite" implies enterprise. 
                                    Let's change to Input for Name till we build AsyncSelect 
                                */}
                            </select>
                            {/* Converting to simple input for performance refactor compatibility */}
                            <input
                                type="text"
                                required
                                placeholder="Driver Name"
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 mt-2"
                                value={newCoaching.driverName}
                                onChange={(e) => setNewCoaching({ ...newCoaching, driverName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newCoaching.date}
                                onChange={(e) => setNewCoaching({ ...newCoaching, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newCoaching.type}
                                onChange={(e) => setNewCoaching({ ...newCoaching, type: e.target.value })}
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
                                    newCoaching.type === 'Speeding' ? 10 :
                                        newCoaching.type === 'Hard Braking' ? 5 :
                                            newCoaching.type === 'HOS Violation' ? 15 :
                                                newCoaching.type === 'Accident' ? 20 :
                                                    newCoaching.type === 'Citation' ? 10 : 0
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
                            value={newCoaching.notes}
                            onChange={(e) => setNewCoaching({ ...newCoaching, notes: e.target.value })}
                        ></textarea>
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
                            Log Event
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Safety;
