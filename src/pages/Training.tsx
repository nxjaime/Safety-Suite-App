import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import { driverService } from '../services/driverService';
import { trainingService } from '../services/trainingService';
import type { Driver, TrainingAssignment } from '../types';
import toast from 'react-hot-toast';

const Training: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [newAssignment, setNewAssignment] = useState({
        moduleName: '',
        assignee: '',
        dueDate: ''
    });
    const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);

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

        const loadAssignments = async () => {
            try {
                const data = await trainingService.listAssignments();
                setAssignments(data);
            } catch (error) {
                console.error("Failed to load training assignments", error);
            }
        };
        loadAssignments();
    }, []);

    const handleAssignTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await trainingService.insertAssignment({
                module_name: newAssignment.moduleName,
                assignee_id: newAssignment.assignee,
                due_date: newAssignment.dueDate,
                status: 'Active',
                progress: 0
            });
            setAssignments((prev) => [created, ...prev]);
            toast.success('Assignment created');
        } catch (err) {
            console.error('failed to create assignment', err);
            toast.error('Unable to assign training');
        }

        setIsModalOpen(false);
        setNewAssignment({ moduleName: '', assignee: '', dueDate: '' });
    };

    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Completed' | 'Overdue'>('All');

    // statistics and filtering operate over the assignments state loaded from the backend

    // Calculate Stats
    const activeCount = assignments.filter(a => a.status === 'Active').length;
    const overdueCount = assignments.filter(a => a.status === 'Overdue').length;
    const completedCount = assignments.filter(a => a.status === 'Completed').length;
    const totalCount = assignments.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getFilteredList = () => {
        if (filterStatus === 'All') return assignments;
        return assignments.filter(a => a.status === filterStatus);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Training & Development</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Assign Training
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => setFilterStatus('Active')}
                    className={clsx(
                        "bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all",
                        filterStatus === 'Active' ? "border-green-500 ring-2 ring-green-100" : "border-slate-200 hover:border-green-300"
                    )}
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full mr-4 border border-green-200">
                            <GraduationCap className="w-6 h-6 text-green-800" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-slate-500">Active Modules</p>
                            <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => setFilterStatus('Completed')}
                    className={clsx(
                        "bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all",
                        filterStatus === 'Completed' ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"
                    )}
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full mr-4 border border-blue-200">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Completion Rate</p>
                            <h3 className="text-2xl font-bold text-slate-900">{completionRate}%</h3>
                            <p className="text-xs text-slate-400 mt-1">{completedCount} / {totalCount} completed</p>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => setFilterStatus('Overdue')}
                    className={clsx(
                        "bg-white p-6 rounded-lg shadow-sm border cursor-pointer transition-all",
                        filterStatus === 'Overdue' ? "border-red-500 ring-2 ring-red-100" : "border-slate-200 hover:border-red-300"
                    )}
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-full mr-4 border border-red-200">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Overdue Assignments</p>
                            <h3 className="text-2xl font-bold text-slate-900">{overdueCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {filterStatus !== 'All' && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setFilterStatus('All')}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                        Clear Filter (Show All)
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Training Assignments</h3>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        Showing: {filterStatus}
                    </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Module Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredList().map((module) => (
                            <tr key={module.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{module.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{module.assignee}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{module.dueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        module.status === 'Active' ? "bg-green-100 text-green-800" :
                                            module.status === 'Completed' ? "bg-blue-100 text-blue-800" : // Changed for visual distinction
                                                "bg-red-100 text-red-800"
                                    )}>
                                        {module.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 max-w-xs">
                                        <div className={clsx("h-2.5 rounded-full",
                                            module.status === 'Overdue' ? 'bg-red-600' : 'bg-green-600'
                                        )} style={{ width: `${module.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">{module.progress}%</span>
                                </td>
                            </tr>
                        ))}
                        {getFilteredList().length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                                    No assignments found for status "{filterStatus}".
                                </td>
                            </tr>
                        )}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Module Name</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAssignment.assignee}
                                onChange={(e) => setNewAssignment({ ...newAssignment, assignee: e.target.value })}
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newAssignment.dueDate}
                                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                            />
                        </div>
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
                            Assign Training
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Training;
