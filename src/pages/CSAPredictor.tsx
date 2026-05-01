
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp, AlertTriangle, Database } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { inspectionService } from '../services/inspectionService';
import { carrierService, type CarrierHealth } from '../services/carrierService';
import toast from 'react-hot-toast';

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

const csaCategoryFromViolation = (type: 'Driver' | 'Vehicle', description: string): string => {
    if (type === 'Vehicle') return 'Vehicle Maint.';
    const desc = description.toLowerCase();
    if (desc.includes('hos') || desc.includes('log') || desc.includes('hours of service')) return 'HOS Compliance';
    if (desc.includes('license') || desc.includes('medical') || desc.includes('fitness')) return 'Driver Fitness';
    if (desc.includes('drug') || desc.includes('alcohol') || desc.includes('substance')) return 'Drugs/Alcohol';
    return 'Unsafe Driving';
};

const timeWeightFromDate = (dateStr: string): number => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 180) return 3;
    if (days <= 365) return 2;
    if (days <= 730) return 1;
    return 0; // older than 24 months — excluded from BASIC window
};

const buildViolationsFromCarrierHealth = (health: CarrierHealth): Violation[] => {
    const summary = health.inspectionSummary;
    const seedAge = Math.max(1, timeWeightFromDate(health.lastUpdated));
    const csaScores = health.csaScores ?? {};
    const totalInspections = summary?.totalInspections ?? 0;
    const totalCrashes = summary?.crashes.total ?? 0;
    const outOfServiceRate = summary?.outOfServiceRate ?? 0;

    const scoreToSeverity = (fallback: number, score?: number) => {
        if (score === undefined) return fallback;
        return Math.max(1, Math.min(10, Math.round(score / 10)));
    };

    return [
        {
            id: `fmcsa-unsafe-${health.dotNumber}`,
            category: 'Unsafe Driving',
            description: `FMCSA crash indicator seed — ${totalCrashes} crash(es), ${outOfServiceRate.toFixed(1)}% OOS`,
            severityWeight: scoreToSeverity(Math.max(1, Math.round(totalCrashes * 2 + outOfServiceRate / 12)), csaScores.unsafeDriving),
            timeWeight: seedAge,
        },
        {
            id: `fmcsa-hos-${health.dotNumber}`,
            category: 'HOS Compliance',
            description: `FMCSA inspection seed — ${totalInspections} inspection(s) in the latest SAFER snapshot`,
            severityWeight: scoreToSeverity(Math.max(1, Math.round(totalInspections / 3 + outOfServiceRate / 15)), csaScores.hoursOfService),
            timeWeight: seedAge,
        },
        {
            id: `fmcsa-maint-${health.dotNumber}`,
            category: 'Vehicle Maint.',
            description: `FMCSA maintenance seed — ${summary?.crashes.tow ?? 0} tow-away crash(es) / ${outOfServiceRate.toFixed(1)}% OOS`,
            severityWeight: scoreToSeverity(Math.max(1, Math.round(outOfServiceRate / 10 + totalInspections / 4)), csaScores.vehicleMaintenance),
            timeWeight: seedAge,
        },
        {
            id: `fmcsa-drugs-${health.dotNumber}`,
            category: 'Drugs/Alcohol',
            description: `FMCSA composite seed from live carrier snapshot`,
            severityWeight: scoreToSeverity(Math.max(1, Math.round(totalCrashes)), csaScores.controlledSubstances),
            timeWeight: seedAge,
        },
        {
            id: `fmcsa-fitness-${health.dotNumber}`,
            category: 'Driver Fitness',
            description: `FMCSA composite seed from live carrier snapshot`,
            severityWeight: scoreToSeverity(Math.max(1, Math.round((health.drivers ?? 0) + outOfServiceRate / 20)), csaScores.driverFitness),
            timeWeight: seedAge,
        },
    ];
};

const CSAPredictor: React.FC = () => {
    const [violations, setViolations] = useState<Violation[]>(initialViolations);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingInspections, setLoadingInspections] = useState(false);
    const [seededFromReal, setSeededFromReal] = useState(false);
    const [carrierNotice, setCarrierNotice] = useState<string | null>(null);
    const [carrierDotNumber, setCarrierDotNumber] = useState('');
    const [loadingCarrier, setLoadingCarrier] = useState(false);
    const [powerUnits, setPowerUnits] = useState(10);
    const [totalInspections, setTotalInspections] = useState(24);

    const [newViolation, setNewViolation] = useState({
        category: 'Unsafe Driving',
        description: '',
        severityWeight: 1,
        timeWeight: 3
    });

    const calculateCategoryScore = (category: string, violationList: Violation[]) => {
        const catViolations = violationList.filter(v => v.category === category);
        const totalPoints = catViolations.reduce((acc, v) => acc + (v.severityWeight * v.timeWeight), 0);
        // Simplified BASIC normalization: points / (inspections * powerUnits * factor) * 100
        const denominator = Math.max(1, totalInspections * Math.log10(Math.max(1, powerUnits)));
        return Math.min(100, Math.round((totalPoints / denominator) * 10));
    };

    const categories = ['Unsafe Driving', 'HOS Compliance', 'Vehicle Maint.', 'Drugs/Alcohol', 'Driver Fitness'];

    const chartData = categories.map(cat => ({
        name: cat,
        Current: calculateCategoryScore(cat, violations.slice(0, 3)),
        Projected: calculateCategoryScore(cat, violations)
    }));

    const handleAddViolation = (e: React.FormEvent) => {
        e.preventDefault();
        const violationToAdd = { ...newViolation, id: Date.now().toString() };
        setViolations(prev => [...prev, violationToAdd]);
        setIsModalOpen(false);
        setNewViolation({ category: 'Unsafe Driving', description: '', severityWeight: 1, timeWeight: 3 });
    };

    const removeViolation = (id: string) => {
        setViolations(violations.filter(v => v.id !== id));
    };

    const handleLoadFromInspections = async () => {
        setLoadingInspections(true);
        try {
            const inspections = await inspectionService.getInspections();
            const mapped: Violation[] = [];
            for (const inspection of inspections) {
                if (!inspection.violations_data?.length) continue;
                for (const v of inspection.violations_data) {
                    const tw = timeWeightFromDate(inspection.date);
                    if (tw === 0) continue; // outside 24-month window
                    mapped.push({
                        id: `${inspection.id}-${v.code}`,
                        category: csaCategoryFromViolation(v.type, v.description),
                        description: v.description || v.code,
                        severityWeight: v.oos ? 8 : 4,
                        timeWeight: tw,
                    });
                }
            }
            if (mapped.length === 0) {
                toast('No violations found in inspection records for the 24-month window.', { icon: 'ℹ️' });
                return;
            }
            setViolations(mapped);
            setSeededFromReal(true);
            setCarrierNotice('Seeded from inspection records');
            toast.success(`Loaded ${mapped.length} violation(s) from inspection records`);
        } catch (err) {
            console.error('Failed to load inspections', err);
            toast.error('Failed to load inspection data');
        } finally {
            setLoadingInspections(false);
        }
    };

    const handleLoadFromCarrier = async () => {
        if (!carrierDotNumber.trim()) return;
        setLoadingCarrier(true);
        setCarrierNotice(null);
        try {
            const result = await carrierService.lookupCarrierHealth(carrierDotNumber.trim());
            if (!result.health) {
                toast.error(result.message);
                setCarrierNotice(result.message);
                return;
            }

            setViolations(prev => [...prev, ...buildViolationsFromCarrierHealth(result.health as CarrierHealth)]);
            setSeededFromReal(true);
            setCarrierNotice(result.message);
            toast.success('Loaded FMCSA carrier snapshot into CSA predictor');
        } catch (err) {
            console.error('Failed to load carrier snapshot', err);
            toast.error('Failed to load FMCSA carrier snapshot');
        } finally {
            setLoadingCarrier(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">CSA Score Predictor</h2>
                    <p className="text-gray-500 text-sm mt-1">Simulate the impact of violations on your CSA BASIC scores.</p>
                </div>
                <div className="flex items-center gap-2">
                    {seededFromReal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                            <Database className="w-3 h-3" />
                            Seeded from real data
                        </span>
                    )}
                    <button
                        onClick={handleLoadFromInspections}
                        disabled={loadingInspections}
                        className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center shadow-sm disabled:opacity-50"
                    >
                        <Database className="w-4 h-4 mr-2" />
                        {loadingInspections ? 'Loading...' : 'Load from Inspections'}
                    </button>
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="DOT #"
                            className="w-28 border-0 p-0 text-sm focus:outline-none focus:ring-0"
                            value={carrierDotNumber}
                            onChange={e => setCarrierDotNumber(e.target.value)}
                        />
                        <button
                            onClick={handleLoadFromCarrier}
                            disabled={loadingCarrier || !carrierDotNumber.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center disabled:opacity-50"
                        >
                            <Database className="w-4 h-4 mr-1" />
                            {loadingCarrier ? 'Loading...' : 'Load FMCSA'}
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Simulated Violation
                    </button>
                </div>
            </div>

            {carrierNotice && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    {carrierNotice}
                </div>
            )}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Fleet Parameters (for BASIC normalization)</h3>
                <div className="flex flex-wrap gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Power Units</label>
                        <input
                            type="number"
                            min={1}
                            className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={powerUnits}
                            onChange={e => setPowerUnits(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Total Inspections (24-mo)</label>
                        <input
                            type="number"
                            min={1}
                            className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={totalInspections}
                            onChange={e => setTotalInspections(parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${seededFromReal ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                            {seededFromReal ? 'Real Data' : 'Simulation Mode'}
                        </span>
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

            {/* Add Simulated Violation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Simulated Violation"
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
