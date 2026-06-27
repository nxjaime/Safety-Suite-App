import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Driver, RiskEvent } from '../../types';

interface DriverSafetyTabProps {
    driver: Driver;
}

const DriverSafetyTab: React.FC<DriverSafetyTabProps> = ({ driver }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {driver.riskEvents && driver.riskEvents.length > 0 && driver.riskEvents.map((event: RiskEvent) => (
                                <div key={event.id} className="flex items-start p-4 bg-red-50 rounded-md border border-red-100">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800">{event.type} (+{event.points})</h4>
                                        <p className="text-sm text-red-600 mt-1">{event.date ? new Date(event.date).toLocaleDateString() : 'Date not recorded'} • {event.notes || 'No notes recorded'}</p>
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
                                    +{driver.riskEvents ? driver.riskEvents.reduce((s, e) => s + e.points, 0) : 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">External Telematics Events</h3>
                <p className="text-sm text-gray-500">
                    Motive integration is not enabled for this product. Safety activity is based on in-app risk events, inspections, coaching, and training records.
                </p>
            </div>
        </div>
    );
};

export default DriverSafetyTab;
