import React, { useState, useEffect } from 'react';
import { CheckSquare, Filter, Search, Calendar, User, ArrowRight, Plus, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import { taskService } from '../services/taskService';
import { driverService } from '../services/driverService';
import toast from 'react-hot-toast';
import type { TaskItem, Driver } from '../types';

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('Pending');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [closeNotes, setCloseNotes] = useState('');

    const [newTask, setNewTask] = useState({
        title: '',
        assignee: 'Safety Manager',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        description: '',
        driverId: ''
    });

    const [editTask, setEditTask] = useState({
        assignee: '',
        dueDate: '',
        priority: ''
    });

    const loadTasks = async () => {
        try {
            const allTasks = await taskService.fetchTasks();
            setTasks(allTasks);
        } catch (error) {
            console.error('Failed to load tasks', error);
            toast.error('Failed to load tasks');
        }
    };

    const loadDrivers = async () => {
        try {
            const { data } = await driverService.fetchDriversPaginated(1, 100, {});
            setDrivers(data);
        } catch (error) {
            console.error('Failed to load drivers');
        }
    };

    useEffect(() => {
        loadTasks();
        loadDrivers();
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDriver = drivers.find(d => d.id === newTask.driverId);

        const taskData = {
            title: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            priority: newTask.priority as 'High' | 'Medium' | 'Low',
            status: 'Pending' as const,
            assignee: newTask.assignee,
            type: 'General' as const,
            driverId: newTask.driverId || undefined,
            driverName: selectedDriver?.name
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
                description: '',
                driverId: ''
            });
            loadTasks();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const handleEditTask = (task: TaskItem) => {
        setSelectedTask(task);
        setEditTask({
            assignee: task.assignee,
            dueDate: task.dueDate,
            priority: task.priority
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedTask) return;

        try {
            await taskService.updateTask(selectedTask.id, {
                assignee: editTask.assignee,
                dueDate: editTask.dueDate,
                priority: editTask.priority
            });
            toast.success('Task updated');
            setIsEditModalOpen(false);
            loadTasks();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleOpenCloseModal = (task: TaskItem) => {
        setSelectedTask(task);
        setCloseNotes('');
        setIsCloseModalOpen(true);
    };

    const handleCloseTask = async () => {
        if (!selectedTask) return;

        // Validate minimum 25 characters for closing notes
        if (closeNotes.trim().length < 25) {
            toast.error('Closing notes must be at least 25 characters');
            return;
        }

        try {
            await taskService.closeTask(selectedTask.id, closeNotes);
            toast.success('Task marked as completed');
            setIsCloseModalOpen(false);
            loadTasks();
        } catch (error) {
            toast.error('Failed to close task');
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.driverName && task.driverName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
        // 'Pending' filter shows all active tasks (Pending + In Progress)
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'Pending' && (task.status === 'Pending' || task.status === 'In Progress')) ||
            (filterStatus === 'Completed' && task.status === 'Completed');

        return matchesSearch && matchesPriority && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Tasks & Follow-ups</h2>
                <div className="flex space-x-3">
                    <div className="relative group">
                        <button className="flex items-center px-4 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg hidden group-hover:block z-20 p-2">
                            <div className="text-xs font-semibold text-slate-500 mb-1 px-2">Priority</div>
                            <select
                                className="w-full text-sm border-slate-300 rounded mb-2"
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <div className="text-xs font-semibold text-slate-500 mb-1 px-2">Status</div>
                            <select
                                className="w-full text-sm border-slate-300 rounded"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="Pending">Active (default)</option>
                                <option value="All">All Tasks</option>
                                <option value="Completed">Completed Only</option>
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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center bg-white border border-slate-300 rounded-md px-3 py-2 w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
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
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Related Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className={clsx("hover:bg-slate-50", task.status === 'Completed' && "opacity-60")}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={clsx(
                                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                                                task.status === 'Completed' ? "bg-green-100 text-green-600" :
                                                    task.type === 'General' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                            )}>
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <div className="ml-4">
                                                <div className={clsx("text-sm font-medium", task.status === 'Completed' ? "text-slate-500 line-through" : "text-slate-900")}>{task.title}</div>
                                                <div className="text-xs text-slate-500">{task.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {task.driverId ? (
                                            <Link to={`/drivers/${task.driverId}`} className="flex items-center text-green-600 hover:text-green-800">
                                                <User className="w-4 h-4 mr-2" />
                                                <span className="text-sm">{task.driverName || 'View Driver'}</span>
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {task.assignee}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            task.status === 'Completed' ? "bg-green-100 text-green-800" :
                                                task.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                                                    "bg-slate-100 text-slate-800"
                                        )}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {task.status !== 'Completed' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditTask(task)}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="Edit Task"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenCloseModal(task)}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title="Close Task"
                                                    >
                                                        <CheckSquare className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {task.driverId && (
                                                <Link
                                                    to={`/drivers/${task.driverId}`}
                                                    className="text-slate-500 hover:text-slate-700 p-1"
                                                    title="Go to Driver"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="e.g. Schedule Safety Meeting"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Related Driver (Optional)</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newTask.driverId}
                            onChange={(e) => setNewTask({ ...newTask, driverId: e.target.value })}
                        >
                            <option value="">No Driver Selected</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={newTask.dueDate}
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
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

            {/* Edit Task Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Task"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Task</label>
                        <p className="text-slate-900 font-medium">{selectedTask?.title}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editTask.assignee}
                            onChange={(e) => setEditTask({ ...editTask, assignee: e.target.value })}
                        >
                            <option value="Safety Manager">Safety Manager</option>
                            <option value="Fleet Manager">Fleet Manager</option>
                            <option value="Dispatcher">Dispatcher</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editTask.dueDate}
                            onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editTask.priority}
                            onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Close Task Modal */}
            <Modal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                title="Close Task"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Task</label>
                        <p className="text-slate-900 font-medium">{selectedTask?.title}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Closing Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={clsx(
                                "w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500",
                                closeNotes.trim().length < 25 ? "border-orange-300" : "border-slate-300"
                            )}
                            value={closeNotes}
                            onChange={(e) => setCloseNotes(e.target.value)}
                            rows={4}
                            placeholder="Add notes about task completion (minimum 25 characters required)..."
                        />
                        <div className={clsx(
                            "text-xs mt-1 flex justify-between",
                            closeNotes.trim().length < 25 ? "text-orange-500" : "text-green-600"
                        )}>
                            <span>{closeNotes.trim().length < 25 ? `Minimum 25 characters required` : 'Character requirement met ✓'}</span>
                            <span>{closeNotes.trim().length}/25</span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setIsCloseModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCloseTask}
                            disabled={closeNotes.trim().length < 25}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Mark as Completed
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
