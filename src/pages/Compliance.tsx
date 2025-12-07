import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, User, Calendar } from 'lucide-react';
import Modal from '../components/UI/Modal';

const Compliance: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDQFile, setNewDQFile] = useState({
        driverName: '',
        documentType: '',
        expirationDate: ''
    });

    const [view, setView] = useState<'overview' | 'hos' | 'dq' | 'cdl' | 'audit'>('overview');

    const handleAddDQFile = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, update state
        console.log('New DQ File:', newDQFile);
        setIsModalOpen(false);
        setNewDQFile({ driverName: '', documentType: '', expirationDate: '' });
    };

    const expirations = [
        { id: 1, driver: 'Sarah Jenkins', type: 'CDL', date: '2025-10-15', status: 'Good' },
        { id: 2, driver: 'Mike Ross', type: 'Medical Card', date: '2024-02-20', status: 'Critical' },
        { id: 3, driver: 'David Kim', type: 'MVR', date: '2024-03-01', status: 'Warning' },
        { id: 4, driver: 'Elena Rodriguez', type: 'Hazmat Endorsement', date: '2025-06-10', status: 'Good' },
        { id: 5, driver: 'Sarah Jenkins', type: 'Annual Review', date: '2024-11-15', status: 'Good' },
    ];

    const hosViolations = [
        { id: 1, driver: 'Mike Ross', violation: '11 Hour Rule', date: '2024-01-15', status: 'Open' },
        { id: 2, driver: 'David Kim', violation: '14 Hour Rule', date: '2023-12-20', status: 'Resolved' },
        { id: 3, driver: 'Elena Rodriguez', violation: '30 Minute Break', date: '2024-01-05', status: 'Open' },
    ];

    const missingDQFiles = [
        { id: 1, driver: 'Mike Ross', file: 'Medical Card', status: 'Expired' },
        { id: 2, driver: 'David Kim', file: 'MVR', status: 'Missing' },
    ];

    const auditItems = [
        { id: 1, item: 'Driver Files', status: 'Compliant', score: '100%' },
        { id: 2, item: 'Vehicle Maintenance', status: 'Compliant', score: '95%' },
        { id: 3, item: 'HOS Logs', status: 'Warning', score: '88%' },
    ];

    const renderOverview = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div
                    onClick={() => setView('hos')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">HOS Violations</h3>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-xs text-red-600 mt-1">+2 from last week</p>
                </div>
                <div
                    onClick={() => setView('dq')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Missing DQ Files</h3>
                        <FileText className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                    <p className="text-xs text-yellow-600 mt-1">Action required</p>
                </div>
                <div
                    onClick={() => setView('cdl')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Expiring CDLs</h3>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
                </div>
                <div
                    onClick={() => setView('audit')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Audit Ready</h3>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                    <p className="text-xs text-green-600 mt-1">Compliance Score</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Upcoming Expirations</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expirations.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.driver}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                        item.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-green-600 hover:text-green-900">Renew</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    const renderDetailView = (title: string, columns: string[], data: any[], renderRow: (item: any) => React.ReactNode) => (
        <div className="space-y-6">
            <button
                onClick={() => setView('overview')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
                ← Back to Overview
            </button>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map(renderRow)}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Compliance Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add DQ File
                </button>
            </div>

            {view === 'overview' && renderOverview()}

            {view === 'hos' && renderDetailView(
                'HOS Violations',
                ['Driver', 'Violation', 'Date', 'Status'],
                hosViolations,
                (item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.violation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'dq' && renderDetailView(
                'Missing DQ Files',
                ['Driver', 'Missing File', 'Status'],
                missingDQFiles,
                (item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.file}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'cdl' && renderDetailView(
                'Expiring CDLs',
                ['Driver', 'Document Type', 'Expiration Date', 'Status'],
                expirations.filter(e => e.type === 'CDL'),
                (item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.driver}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {item.status}
                            </span>
                        </td>
                    </tr>
                )
            )}

            {view === 'audit' && renderDetailView(
                'Audit Readiness',
                ['Item', 'Status', 'Score'],
                auditItems,
                (item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.item}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {item.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.score}</td>
                    </tr>
                )
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add DQ File"
            >
                <form onSubmit={handleAddDQFile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Driver Name"
                                value={newDQFile.driverName}
                                onChange={(e) => setNewDQFile({ ...newDQFile, driverName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newDQFile.documentType}
                            onChange={(e) => setNewDQFile({ ...newDQFile, documentType: e.target.value })}
                        >
                            <option value="">Select Type</option>
                            <option value="CDL">CDL</option>
                            <option value="Medical Card">Medical Card</option>
                            <option value="MVR">MVR</option>
                            <option value="Annual Review">Annual Review</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newDQFile.expirationDate}
                                onChange={(e) => setNewDQFile({ ...newDQFile, expirationDate: e.target.value })}
                            />
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
                            Add File
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Compliance;
