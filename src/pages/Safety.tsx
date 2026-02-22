import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, AlertTriangle, Plus, Calendar, User, Download } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { driverService } from '../services/driverService';

const Safety: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        riskScore: 0,
        incidentCount: 0,
        coachingCount: 0,
        riskDistribution: { green: 0, yellow: 0, red: 0 },
        topIncidentTypes: [] as Array<{ name: string; count: number }>,
        scoreTrend: [] as Array<{ asOf: string; score: number }>
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [newCoaching, setNewCoaching] = useState({
        driverId: '',
        driverName: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        notes: ''
    });



    useEffect(() => {
        loadData();
    }, []);

    // Load active drivers when modal opens
    useEffect(() => {
        if (isModalOpen && drivers.length === 0) {
            loadDrivers();
        }
    }, [isModalOpen]);

    const loadDrivers = async () => {
        setLoadingDrivers(true);
        try {
            const { data } = await driverService.fetchDriversPaginated(1, 200, { status: 'Active' });
            setDrivers(data.map(d => ({ id: d.id, name: d.name })));
        } catch (error) {
            console.error('Failed to load drivers', error);
        } finally {
            setLoadingDrivers(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const stats = await driverService.fetchSafetyStats();
            setStats(stats);
        } catch (error) {
            setError('Failed to load safety data');
            toast.error('Failed to load safety data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCoaching = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate driver is selected
        if (!newCoaching.driverId) {
            toast.error('Please select a driver');
            return;
        }

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
            await driverService.addRiskEvent(newCoaching.driverId, {
                date: newCoaching.date,
                type: newCoaching.type,
                points,
                notes: newCoaching.notes
            });

            // Refetch to ensure consistency
            await loadData();

            toast.success(`Risk event logged for ${newCoaching.driverName}`);
            setIsModalOpen(false);
            setNewCoaching({ driverId: '', driverName: '', date: new Date().toISOString().split('T')[0], type: '', notes: '' });

        } catch (error) {
            toast.error('Failed to log event');
            console.error(error);
        }
    };

    const incidentData = stats.topIncidentTypes.length > 0
        ? stats.topIncidentTypes
        : [{ name: 'No incidents', count: 0 }];

    const riskData = [
        { name: 'Low Risk', value: stats.riskDistribution.green, color: '#10B981' },
        { name: 'Medium Risk', value: stats.riskDistribution.yellow, color: '#F59E0B' },
        { name: 'High Risk', value: stats.riskDistribution.red, color: '#EF4444' },
    ];

    const riskBand = stats.riskScore >= 80 ? 'red' : stats.riskScore >= 50 ? 'yellow' : 'green';
    const riskBandClass = riskBand === 'red'
        ? 'text-red-700 bg-red-50'
        : riskBand === 'yellow'
            ? 'text-amber-700 bg-amber-50'
            : 'text-green-700 bg-green-50';

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
        <div className="space-y-8" data-testid="safety-page">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Safety Intelligence Center</h2>
                        <p className="mt-1 text-sm text-slate-500">Monitor fleet risk exposure, incident pressure, and coaching demand.</p>
                    </div>
                    <div className="flex space-x-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Log Event
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                </div>
                </div>
            </section>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Link to="/drivers" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Fleet Risk Score</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.riskScore}</h3>
                        </div>
                        <div className={`ml-auto flex items-center text-xs px-2 py-1 rounded-full ${riskBandClass}`}>
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span>{riskBand.toUpperCase()}</span>
                        </div>
                    </div>
                </Link>

                <Link to="/drivers?filter=incidents" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-orange-100 rounded-full mr-4 border border-orange-200">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Incidents</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.incidentCount}</h3>
                        </div>
                        <div className="ml-auto text-sm text-slate-500">
                            This Month
                        </div>
                    </div>
                </Link>

                <Link to="/tasks" className="block transform transition-transform hover:scale-[1.02]">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-100 rounded-full mr-4 border border-blue-200">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Coaching</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.coachingCount}</h3>
                        </div>
                        <div className="ml-auto text-sm text-slate-500">
                            Drivers
                        </div>
                    </div>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Risk Score Trend (Recent)</h3>
                    <span className="text-xs text-slate-500">Last 12 points</span>
                </div>
                <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={stats.scoreTrend.map((point) => ({
                                ...point,
                                shortDate: new Date(point.asOf).toLocaleDateString()
                            }))}
                        >
                            <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2} dot={false} />
                            <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Top Incident Types</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={incidentData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Fleet Risk Distribution</h3>
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
                                    <span className="text-sm text-slate-600">{entry.name}</span>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Driver <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
                            <select
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                value={newCoaching.driverId}
                                onChange={(e) => {
                                    const selectedDriver = drivers.find(d => d.id === e.target.value);
                                    setNewCoaching({
                                        ...newCoaching,
                                        driverId: e.target.value,
                                        driverName: selectedDriver?.name || ''
                                    });
                                }}
                            >
                                <option value="">
                                    {loadingDrivers ? 'Loading drivers...' : 'Select an active driver'}
                                </option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {drivers.length === 0 && !loadingDrivers && (
                            <p className="text-xs text-slate-500 mt-1">No active drivers found in the roster.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newCoaching.date}
                                onChange={(e) => setNewCoaching({ ...newCoaching, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                            <input
                                type="number"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
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
