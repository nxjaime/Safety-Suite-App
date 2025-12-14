
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import Modal from '../components/UI/Modal';

interface Violation {
    id: string;
    category: string;
    description: string;
    severityWeight: number;
    timeWeight: number; // 3 for <6mo, 2 for 6-12mo, 1 for 12-24mo
}

const initialViolations: Violation[] = [
    { id: '1', category: 'Unsafe Driving', description: 'Speeding 6-10 MPH', severityWeight: 4, timeWeight: 2 },
    { id: '2', category: 'HOS Compliance', description: 'False Report of Logs', severityWeight: 7, timeWeight: 2 },
    { id: '3', category: 'Vehicle Maint.', description: 'Tire - Flat/Audible Leak', severityWeight: 8, timeWeight: 3 },
];

const CSAPredictor: React.FC = () => {
    const [violations, setViolations] = useState<Violation[]>(initialViolations);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Violation Input State
    const [newViolation, setNewViolation] = useState({
        category: 'Unsafe Driving',
        description: '',
        severityWeight: 1,
        timeWeight: 3
    });

    const calculateCategoryScore = (category: string, violationList: Violation[]) => {
        const catViolations = violationList.filter(v => v.category === category);
        const totalPoints = catViolations.reduce((acc, v) => acc + (v.severityWeight * v.timeWeight), 0);
        // Simplified normalization for demo (Total Measure / 50 * 100)
        // In reality, this requires number of relevant inspections and power units.
        return Math.min(100, Math.round((totalPoints / 100) * 100)); // Capped at 100 for percentile-like display
    };

    const categories = ['Unsafe Driving', 'HOS Compliance', 'Vehicle Maint.', 'Drugs/Alcohol', 'Driver Fitness'];

    const chartData = categories.map(cat => ({
        name: cat,
        Current: calculateCategoryScore(cat, violations.slice(0, 3)), // Simulate "Before"
        Projected: calculateCategoryScore(cat, violations) // "After" with all violations
    }));

    const handleAddViolation = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Adding violation:", newViolation);
        const violationToAdd = { ...newViolation, id: Date.now().toString() };
        setViolations(prev => [...prev, violationToAdd]);
        setIsModalOpen(false);
        setNewViolation({ category: 'Unsafe Driving', description: '', severityWeight: 1, timeWeight: 3 });
    };

    const removeViolation = (id: string) => {
        setViolations(violations.filter(v => v.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">CSA Score Predictor</h2>
                    <p className="text-gray-500 text-sm mt-1">Simulate the impact of new violations on your CSA BASIC scores.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Mock Violation
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Projected Impact</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="Current" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Current Score" />
                                <Bar dataKey="Projected" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Projected Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-center space-x-6">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                            <span className="text-sm text-gray-600">Current Score</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-400 rounded mr-2"></div>
                            <span className="text-sm text-gray-600 flex items-center">
                                Projected Score
                                <TrendingUp className="w-3 h-3 ml-1 text-orange-400" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Violation List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Violation Scenario</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Draft Mode</span>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[400px]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time Weight</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {violations.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{v.category}</div>
                                            <div className="text-xs text-gray-500">{v.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                                                {v.severityWeight}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            x{v.timeWeight}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                                            {v.severityWeight * v.timeWeight}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removeViolation(v.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600">
                                <strong>Note:</strong> This predictor uses simplified CSA methodology. Official scores (SMS) depend on your fleet size (Power Units) and total inspections over a 24-month rolling period.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Violation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Mock Violation"
            >
                <form onSubmit={handleAddViolation} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BASIC Category</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newViolation.category}
                            onChange={(e) => setNewViolation({ ...newViolation, category: e.target.value })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g. Speeding 15+ MPH"
                            value={newViolation.description}
                            onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity (1-10)</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newViolation.severityWeight}
                                onChange={(e) => setNewViolation({ ...newViolation, severityWeight: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Weight</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newViolation.timeWeight}
                                onChange={(e) => setNewViolation({ ...newViolation, timeWeight: parseInt(e.target.value) })}
                            >
                                <option value="3">High (0-6 mo) - x3</option>
                                <option value="2">Medium (6-12 mo) - x2</option>
                                <option value="1">Low (12-24 mo) - x1</option>
                            </select>
                        </div>
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
                            Add & Calculate
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CSAPredictor;
