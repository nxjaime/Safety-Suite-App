import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Driver } from '../../types';

interface DriverSafetyTabProps {
    driver: Driver;
    motiveEvents: any[];
    loadingMotiveEvents: boolean;
}

const DriverSafetyTab: React.FC<DriverSafetyTabProps> = ({ driver, motiveEvents, loadingMotiveEvents }) => {
    return (
        <div className="space-y-6">
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

            {/* Motive Events Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Motive Safety Events (Last 30 Days)</h3>
                {loadingMotiveEvents ? (
                    <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="space-y-3">
                        {motiveEvents.length > 0 ? motiveEvents.map((event: any) => (
                            <div key={event.id} className="p-3 bg-blue-50 rounded-md border border-blue-100 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-blue-900">{event.event_type}</div>
                                    <div className="text-xs text-blue-700">{new Date(event.event_start_time).toLocaleString()}</div>
                                </div>
                                <span className="px-2 py-1 text-xs bg-white rounded border border-blue-200 text-blue-800">
                                    {event.severity || 'Event'}
                                </span>
                            </div>
                        )) : (
                            <div className="text-sm text-gray-500 italic">No Motive events found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverSafetyTab;
