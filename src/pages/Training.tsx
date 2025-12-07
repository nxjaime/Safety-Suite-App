import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import { driverService } from '../services/driverService';
import type { Driver } from '../types';

const Training: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [newAssignment, setNewAssignment] = useState({
        moduleName: '',
        assignee: '',
        dueDate: ''
    });

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                const data = await driverService.fetchDrivers();
                setDrivers(data);
            } catch (error) {
                console.error("Failed to load drivers", error);
            }
        };
        loadDrivers();
    }, []);

    const handleAssignTraining = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, update state
        console.log('New Assignment:', newAssignment);
        setIsModalOpen(false);
        setNewAssignment({ moduleName: '', assignee: '', dueDate: '' });
    };

    const modules = [
        { id: 1, title: 'Defensive Driving Basics', assignee: 'John Smith', dueDate: 'Oct 25, 2023', status: 'Active', progress: 45 },
        { id: 2, title: 'HOS Compliance', assignee: 'Sarah Johnson', dueDate: 'Oct 20, 2023', status: 'Overdue', progress: 0 },
        { id: 3, title: 'Pre-Trip Inspection', assignee: 'Mike Brown', dueDate: 'Oct 30, 2023', status: 'Active', progress: 10 },
        { id: 4, title: 'Winter Driving Safety', assignee: 'David Wilson', dueDate: 'Nov 15, 2023', status: 'Active', progress: 0 },
        { id: 5, title: 'Distracted Driving', assignee: 'Emily Davis', dueDate: 'Oct 10, 2023', status: 'Completed', progress: 100 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Training & Development</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Assign Training
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                        <GraduationCap className="w-6 h-6 text-green-800" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-gray-500">Active Modules</p>
                        <h3 className="text-2xl font-bold text-gray-900">12</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full mr-4 border border-blue-200">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Completion Rate</p>
                        <h3 className="text-2xl font-bold text-gray-900">85%</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Overdue Assignments</p>
                        <h3 className="text-2xl font-bold text-gray-900">3</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Training Assignments</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {modules.map((module) => (
                            <tr key={module.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{module.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.assignee}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.dueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        module.status === 'Active' ? "bg-green-100 text-green-800" :
                                            module.status === 'Completed' ? "bg-green-100 text-green-800" :
                                                "bg-red-100 text-red-800"
                                    )}>
                                        {module.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-xs">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${module.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">{module.progress}%</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Assign Training Module"
            >
                <form onSubmit={handleAssignTraining} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module Name</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newAssignment.moduleName}
                            onChange={(e) => setNewAssignment({ ...newAssignment, moduleName: e.target.value })}
                        >
                            <option value="">Select Module</option>
                            <option value="Defensive Driving">Defensive Driving</option>
                            <option value="HOS Compliance">HOS Compliance</option>
                            <option value="Winter Safety">Winter Safety</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAssignment.assignee}
                                onChange={(e) => setNewAssignment({ ...newAssignment, assignee: e.target.value })}
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.name}>{driver.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAssignment.dueDate}
                                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
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
                            Assign Training
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Training;
