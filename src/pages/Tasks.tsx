import React, { useState, useEffect } from 'react';
import { CheckSquare, Filter, Search, Calendar, User, ArrowRight, Plus } from 'lucide-react';
// import { storage } from '../utils/storage';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import { driverService } from '../services/driverService';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assignee: 'Safety Manager',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        description: ''
    });

    const loadTasks = async () => {
        try {
            // 1. Load Standalone Tasks
            const standaloneTasks = await taskService.fetchTasks();

            // 2. Load Derived Tasks from Coaching Plans
            const drivers = await driverService.fetchDrivers();
            const derivedTasks: any[] = [];

            drivers.forEach((driver: any) => {
                if (driver.coachingPlans || driver.coaching_plans) { // Handle snake_case if raw returned
                    const plans = driver.coachingPlans || driver.coaching_plans;
                    plans.forEach((plan: any) => {
                        if (plan.status === 'Active') {
                            // Note: deep structure like weeklyCheckIns might be JSON in DB or separate table.
                            // For now assuming joined or simple structure.
                            // If separate table, fetchDrivers join might return it. 
                            // If mock data had it in JSON, we might miss it unless we structured DB to have checkins.
                            // schema.sql didn't strictly define checkins table, only plans.
                            // Assuming checkins are part of plan or not fully implemented in DB yet.
                            // For this migration, I will skip detailed derived tasks if data structure isn't there, 
                            // OR assuming they are unnecessary for critical path.
                            // However, to keep feature parity, I should check if plans have checkins.
                            // In schema.sql I didn't see checkins table.
                            // I'll proceed with just standalone tasks + maybe simple plan tasks if I can.
                            // Mock data had `weeklyCheckIns`. 
                            // Let's just create derived tasks for the *Plan itself* if needed or skip logic if complex.
                            // I will KEEP the loop but guard against missing data to avoid crashes.
                            if (plan.weeklyCheckIns) {
                                plan.weeklyCheckIns.forEach((checkIn: any) => {
                                    if (checkIn.status === 'Pending') {
                                        derivedTasks.push({
                                            id: `${plan.id}-${checkIn.week}`,
                                            type: 'Coaching Check-in',
                                            title: `Week ${checkIn.week} Check-in: ${plan.type} Plan`,
                                            driverName: driver.name,
                                            driverId: driver.id,
                                            planId: plan.id,
                                            dueDate: checkIn.date || 'N/A',
                                            assignedTo: checkIn.assignedTo || 'Unassigned',
                                            priority: 'High',
                                            status: 'Pending'
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });

            // 3. Combine and Sort
            const allTasks = [...standaloneTasks, ...derivedTasks];
            allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            setTasks(allTasks);
        } catch (error) {
            console.error('Failed to load tasks', error);
            toast.error('Failed to load tasks');
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const taskData = {
            title: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            priority: newTask.priority as 'High' | 'Medium' | 'Low',
            status: 'Pending' as 'Pending',
            assignee: newTask.assignee,
            type: 'General' as 'General',
            // driverName: 'N/A' // Not in DB schema, computed on join or separate
        };

        try {
            await taskService.addTask(taskData);
            toast.success('Task created successfully');
            setIsTaskModalOpen(false);
            setNewTask({
                title: '',
                assignee: 'Safety Manager',
                dueDate: new Date().toISOString().split('T')[0],
                priority: 'Medium',
                description: ''
            });
            loadTasks();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.driverName && task.driverName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'Pending' && task.status === 'Pending') ||
            (filterStatus === 'Completed' && task.status === 'Completed');

        return matchesSearch && matchesPriority && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Tasks & Follow-ups</h2>
                <div className="flex space-x-3">
                    <div className="relative group">
                        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                        {/* Simple Hover Dropdown for Demo */}
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block z-20 p-2">
                            <div className="text-xs font-semibold text-gray-500 mb-1 px-2">Priority</div>
                            <select
                                className="w-full text-sm border-gray-300 rounded mb-2"
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <div className="text-xs font-semibold text-gray-500 mb-1 px-2">Status</div>
                            <select
                                className="w-full text-sm border-gray-300 rounded"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 w-full max-w-md">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="text-sm w-full focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredTasks.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={clsx(
                                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                                                task.type === 'General' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                            )}>
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                <div className="text-xs text-gray-500">{task.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{task.driverName === 'N/A' ? '-' : task.driverName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {task.assignedTo || task.assignee}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            {task.dueDate}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            task.priority === 'High' ? "bg-red-100 text-red-800" :
                                                task.priority === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-green-100 text-green-800"
                                        )}>
                                            {task.priority || 'Medium'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {task.driverId ? (
                                            <Link
                                                to={`/drivers/${task.driverId}${task.planId ? `?openPlan=${task.planId}` : ''}`}
                                                className="text-green-600 hover:text-green-900 flex items-center justify-end"
                                            >
                                                Go to {task.planId ? 'Plan' : 'Profile'} <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No tasks found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* New Task Modal */}
            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                title="Create New Task"
            >
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="e.g. Schedule Safety Meeting"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newTask.dueDate}
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.assignee}
                            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                        >
                            <option value="Safety Manager">Safety Manager</option>
                            <option value="Fleet Manager">Fleet Manager</option>
                            <option value="Dispatcher">Dispatcher</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsTaskModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
