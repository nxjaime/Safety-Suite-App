import React from 'react';
import { CalendarClock, Wrench } from 'lucide-react';
import { isTemplateDue } from '../services/maintenanceService';

export const maintenanceIntervals = ['Days', 'Miles', 'Hours'] as const;

const Maintenance: React.FC = () => {
    const templates = [
        { id: 'pm-1', name: 'Quarterly Service', intervalDays: 90, intervalMiles: undefined, intervalHours: undefined, lastServiceDate: '2025-11-15' },
        { id: 'pm-2', name: 'Engine Inspection', intervalDays: undefined, intervalMiles: 15000, intervalHours: undefined, lastServiceMiles: 120000 },
        { id: 'pm-3', name: 'Forklift Hours Check', intervalDays: undefined, intervalMiles: undefined, intervalHours: 250, lastServiceHours: 900 },
    ];

    const dueTemplates = templates.filter((template) =>
        isTemplateDue({
            lastServiceDate: template.lastServiceDate,
            currentDate: '2026-02-22',
            intervalDays: template.intervalDays,
            lastServiceMiles: template.lastServiceMiles,
            currentMiles: 135000,
            intervalMiles: template.intervalMiles,
            lastServiceHours: template.lastServiceHours,
            currentHours: 1200,
            intervalHours: template.intervalHours,
        })
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Maintenance</h2>
                    <p className="text-slate-500">Preventive maintenance templates and upcoming work.</p>
                </div>
                <button className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200">
                    <CalendarClock className="w-4 h-4 inline mr-2" />
                    New Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Active Templates</p>
                    <h3 className="text-2xl font-bold text-slate-900">{templates.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Due This Week</p>
                    <h3 className="text-2xl font-bold text-slate-900">{dueTemplates.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Intervals Supported</p>
                    <h3 className="text-2xl font-bold text-slate-900">{maintenanceIntervals.length}</h3>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Preventive Maintenance Templates</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Template</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Service</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => {
                            const triggerLabel = template.intervalDays
                                ? `Every ${template.intervalDays} days`
                                : template.intervalMiles
                                    ? `Every ${template.intervalMiles.toLocaleString()} miles`
                                    : `Every ${template.intervalHours} hours`;

                            return (
                                <tr key={template.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{template.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{triggerLabel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {template.lastServiceDate || template.lastServiceMiles || template.lastServiceHours}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            <Wrench className="w-3 h-3 mr-1" />
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Work Orders Due</h3>
                {dueTemplates.length === 0 ? (
                    <p className="text-sm text-slate-500">No preventive maintenance is due right now.</p>
                ) : (
                    <ul className="space-y-2 text-sm text-slate-700">
                        {dueTemplates.map((template) => (
                            <li key={template.id} className="flex items-center justify-between border border-slate-100 rounded-md px-3 py-2">
                                <span>{template.name}</span>
                                <span className="text-slate-500">Generate work order</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Maintenance;
