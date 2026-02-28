import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, AlertCircle, User, Calendar, Eye, ClipboardCheck, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../components/UI/Modal';
import { driverService } from '../services/driverService';
import { trainingService } from '../services/trainingService';
import { useAuth } from '../contexts/AuthContext';
import type { Driver, TrainingAssignment, TrainingTemplate } from '../types';
import toast from 'react-hot-toast';

type DisplayStatus = 'Active' | 'Completed' | 'Overdue';

function getDisplayStatus(a: TrainingAssignment): DisplayStatus {
    if (a.status === 'Completed') return 'Completed';
    const today = new Date().toISOString().split('T')[0];
    if (a.due_date && a.due_date < today) return 'Overdue';
    return (a.status as DisplayStatus) || 'Active';
}

const Training: React.FC = () => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [newAssignment, setNewAssignment] = useState({
        templateId: '',
        moduleName: '',
        assignee: '',
        dueDate: ''
    });
    const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
    const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        talkingPoints: '',
        driverActions: ''
    });
    const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(undefined);
    const [selectedAssignment, setSelectedAssignment] = useState<TrainingAssignment | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [showCompleteForm, setShowCompleteForm] = useState(false);
    const [completingId, setCompletingId] = useState<string | null>(null);

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
        const loadTemplates = async () => {
            try {
                const data = await trainingService.listTemplates();
                setTemplates(data);
            } catch (error) {
                console.error("Failed to load training templates", error);
            }
        };
        loadAssignments();
        loadTemplates();
    }, []);

    const handleAssignTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await trainingService.insertAssignment({
                template_id: newAssignment.templateId || null,
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
        setNewAssignment({ templateId: '', moduleName: '', assignee: '', dueDate: '' });
    };

    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Completed' | 'Overdue'>('All');

    // Statistics and filtering use display status (Overdue computed from due_date when not Completed)
    const activeCount = assignments.filter(a => getDisplayStatus(a) === 'Active').length;
    const overdueCount = assignments.filter(a => getDisplayStatus(a) === 'Overdue').length;
    const completedCount = assignments.filter(a => a.status === 'Completed').length;
    const totalCount = assignments.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getFilteredList = () => {
        if (filterStatus === 'All') return assignments;
        return assignments.filter(a => getDisplayStatus(a) === filterStatus);
    };

    const handleMarkComplete = async () => {
        if (!selectedAssignment || completingId) return;
        setCompletingId(selectedAssignment.id);
        try {
            const updated = await trainingService.updateAssignment(selectedAssignment.id, {
                status: 'Completed',
                progress: 100,
                completed_at: new Date().toISOString(),
                completed_by: user?.id ?? undefined,
                completion_notes: completionNotes || undefined
            });
            setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
            setSelectedAssignment(updated);
            setCompletionNotes('');
            setShowCompleteForm(false);
            toast.success('Assignment marked complete');
        } catch (err) {
            console.error('failed to mark complete', err);
            toast.error('Failed to mark complete');
        } finally {
            setCompletingId(null);
        }
    };

    const handleMarkReviewed = async () => {
        if (!selectedAssignment) return;
        try {
            const updated = await trainingService.updateAssignment(selectedAssignment.id, {
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id ?? undefined
            });
            setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
            setSelectedAssignment(updated);
            toast.success('Marked as reviewed');
        } catch (err) {
            console.error('failed to mark reviewed', err);
            toast.error('Failed to mark reviewed');
        }
    };

    const openDetail = (assignment: TrainingAssignment) => {
        setSelectedAssignment(assignment);
        setCompletionNotes('');
        setShowCompleteForm(false);
        setIsDetailModalOpen(true);
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredList().map((module) => {
                            const assigneeName = module.assignee_id
                                ? drivers.find(d => d.id === module.assignee_id)?.name || ''
                                : '';
                            const displayStatus = getDisplayStatus(module);
                            return (
                                <tr key={module.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                        {module.module_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {assigneeName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {module.due_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            displayStatus === 'Active' ? "bg-green-100 text-green-800" :
                                                displayStatus === 'Completed' ? "bg-blue-100 text-blue-800" :
                                                    "bg-red-100 text-red-800"
                                        )}>
                                            {displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 max-w-xs">
                                            <div className={clsx("h-2.5 rounded-full",
                                                displayStatus === 'Overdue' ? 'bg-red-600' : 'bg-green-600'
                                            )} style={{ width: `${module.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs text-slate-500 mt-1">{module.progress}%</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => openDetail(module)}
                                            className="inline-flex items-center px-2 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                                            aria-label="View assignment details"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {getFilteredList().length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
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
                        <label htmlFor="assign-template" className="block text-sm font-medium text-slate-700 mb-1">Template</label>
                        <select
                            id="assign-template"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newAssignment.templateId}
                            onChange={(e) => {
                                const tmpl = templates.find(t => t.id === e.target.value);
                                setNewAssignment({
                                    ...newAssignment,
                                    templateId: e.target.value,
                                    moduleName: tmpl?.name || ''
                                });
                            }}
                        >
                            <option value="">Select Template</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <div className="mt-1 text-xs text-slate-500">
                            <button type="button" className="underline" onClick={() => setIsTemplateModalOpen(true)}>
                                Manage templates
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="assign-assignee" className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                id="assign-assignee"
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
                        <label htmlFor="assign-due" className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                id="assign-due"
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

            {/* template creation/edit modal */}
            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title="Manage Training Templates"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            if (editingTemplateId) {
                                const updated = await trainingService.updateTemplate(editingTemplateId, {
                                    name: newTemplate.name,
                                    talking_points: newTemplate.talkingPoints,
                                    driver_actions: newTemplate.driverActions,
                                });
                                setTemplates((prev) => prev.map(t => t.id === updated.id ? updated : t));
                                toast.success('Template updated');
                            } else {
                                const created = await trainingService.insertTemplate({
                                    name: newTemplate.name,
                                    talking_points: newTemplate.talkingPoints,
                                    driver_actions: newTemplate.driverActions,
                                });
                                setTemplates((prev) => [...prev, created]);
                                toast.success('Template added');
                            }
                            setIsTemplateModalOpen(false);
                            setNewTemplate({ name: '', talkingPoints: '', driverActions: '' });
                            setEditingTemplateId(undefined);
                        } catch (err) {
                            console.error('failed to save template', err);
                            toast.error('Unable to save template');
                        }
                    }}
                    className="space-y-4"
                >
                    {/* template list + edit/delete */}
                    {templates.length > 0 && (
                        <ul className="mb-4">
                            {templates.map((t) => (
                                <li key={t.id} className="flex justify-between items-center py-1">
                                    <span>{t.name}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="text-blue-600 underline text-sm"
                                            onClick={() => {
                                                setNewTemplate({
                                                    name: t.name,
                                                    talkingPoints: t.talking_points || '',
                                                    driverActions: t.driver_actions || '',
                                                });
                                                setEditingTemplateId(t.id);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="text-red-600 underline text-sm"
                                            onClick={async () => {
                                                await trainingService.deleteTemplate(t.id);
                                                setTemplates(templates.filter((x) => x.id !== t.id));
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div>
                        <label htmlFor="tmpl-name" className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                        <input
                            id="tmpl-name"
                            required
                            className="w-full border border-slate-300 rounded-md px-3 py-2"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="tmpl-points" className="block text-sm font-medium text-slate-700 mb-1">Talking Points</label>
                        <textarea
                            id="tmpl-points"
                            className="w-full border border-slate-300 rounded-md px-3 py-2"
                            value={newTemplate.talkingPoints}
                            onChange={(e) => setNewTemplate({ ...newTemplate, talkingPoints: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="tmpl-actions" className="block text-sm font-medium text-slate-700 mb-1">Driver Actions</label>
                        <textarea
                            id="tmpl-actions"
                            className="w-full border border-slate-300 rounded-md px-3 py-2"
                            value={newTemplate.driverActions}
                            onChange={(e) => setNewTemplate({ ...newTemplate, driverActions: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            {editingTemplateId ? 'Update Template' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assignment detail modal: talking points, driver actions, complete/review */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setSelectedAssignment(null); setShowCompleteForm(false); }}
                title="Assignment Details"
            >
                {selectedAssignment && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-500">Module</span>
                            <span className="font-medium">{selectedAssignment.module_name}</span>
                            <span className="text-slate-500">Assignee</span>
                            <span className="font-medium">
                                {drivers.find(d => d.id === selectedAssignment.assignee_id)?.name || '—'}
                            </span>
                            <span className="text-slate-500">Due date</span>
                            <span>{selectedAssignment.due_date || '—'}</span>
                            <span className="text-slate-500">Status</span>
                            <span>
                                <span className={clsx(
                                    "px-2 py-0.5 text-xs font-semibold rounded-full",
                                    getDisplayStatus(selectedAssignment) === 'Active' ? "bg-green-100 text-green-800" :
                                        getDisplayStatus(selectedAssignment) === 'Completed' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                )}>
                                    {getDisplayStatus(selectedAssignment)}
                                </span>
                            </span>
                            <span className="text-slate-500">Progress</span>
                            <span>{selectedAssignment.progress}%</span>
                        </div>
                        {(() => {
                            const template = selectedAssignment.template_id
                                ? templates.find(t => t.id === selectedAssignment.template_id)
                                : null;
                            return (
                                <>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                            <ClipboardCheck className="w-4 h-4" /> Coach talking points
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200">
                                            {template?.talking_points || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                            <CheckSquare className="w-4 h-4" /> Driver required actions
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200">
                                            {template?.driver_actions || '—'}
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                        {selectedAssignment.completed_at && (
                            <div className="text-sm">
                                <span className="text-slate-500">Completed:</span>{' '}
                                <span>{new Date(selectedAssignment.completed_at).toLocaleString()}</span>
                                {selectedAssignment.completion_notes && (
                                    <p className="mt-1 text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                                        {selectedAssignment.completion_notes}
                                    </p>
                                )}
                            </div>
                        )}
                        {selectedAssignment.reviewed_at && (
                            <div className="text-sm text-slate-500">
                                Reviewed: {new Date(selectedAssignment.reviewed_at).toLocaleString()}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            {selectedAssignment.status !== 'Completed' && (
                                <>
                                    {!showCompleteForm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowCompleteForm(true)}
                                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" /> Mark complete
                                        </button>
                                    ) : (
                                        <div className="w-full space-y-2">
                                            <label htmlFor="completion-notes" className="block text-sm font-medium text-slate-700">
                                                Completion notes (attestation)
                                            </label>
                                            <textarea
                                                id="completion-notes"
                                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                                rows={3}
                                                value={completionNotes}
                                                onChange={(e) => setCompletionNotes(e.target.value)}
                                                placeholder="Optional notes or attestation"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkComplete()}
                                                    disabled={completingId === selectedAssignment.id}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    Submit completion
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowCompleteForm(false); setCompletionNotes(''); }}
                                                    className="px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md hover:bg-slate-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {!selectedAssignment.reviewed_at && (
                                <button
                                    type="button"
                                    onClick={() => handleMarkReviewed()}
                                    className="inline-flex items-center px-3 py-1.5 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700"
                                >
                                    Mark reviewed
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Training;
