import React, { useState } from 'react';
import Modal from '../../UI/Modal';
import { driverService } from '../../../services/driverService';
import { generateCheckIns } from '../../../utils/riskLogic';
import toast from 'react-hot-toast';

interface CoachingPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    driverId: string;
    driverName: string;
    onSuccess: () => void;
}

const CoachingPlanModal: React.FC<CoachingPlanModalProps> = ({
    isOpen,
    onClose,
    driverId,
    driverName,
    onSuccess
}) => {
    const [newPlan, setNewPlan] = useState({
        type: '',
        duration: 4,
        startDate: new Date().toISOString().split('T')[0]
    });

    const handleCreateCoachingPlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const checkIns = generateCheckIns(newPlan.startDate, newPlan.duration);

        const planData = {
            startDate: newPlan.startDate,
            durationWeeks: newPlan.duration,
            type: newPlan.type,
            status: 'Active',
            weeklyCheckIns: checkIns,
        };

        try {
            await driverService.addCoachingPlan(driverId, driverName, planData);

            toast.success(`Coaching Plan for ${newPlan.type} created!`);
            onSuccess();
            onClose();
            setNewPlan({ type: '', duration: 4, startDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error(error);
            toast.error('Failed to create coaching plan');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Create Coaching Plan for ${driverName}`}
        >
            <form onSubmit={handleCreateCoachingPlanSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coaching Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newPlan.type}
                        onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                        required
                    >
                        <option value="">Select Behavior</option>
                        <option value="Speeding">Speeding</option>
                        <option value="Harsh Braking">Harsh Braking</option>
                        <option value="Distracted Driving">Distracted Driving</option>
                        <option value="HOS Violation">HOS Violation</option>
                        <option value="Pre-Trip Inspection">Pre-Trip Inspection</option>
                        <option value="General Safety">General Safety</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Weeks)</label>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newPlan.duration}
                        onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                    >
                        <option value={2}>2 Weeks</option>
                        <option value={4}>4 Weeks</option>
                        <option value={6}>6 Weeks</option>
                        <option value={8}>8 Weeks</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newPlan.startDate}
                        onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                        Create Plan
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CoachingPlanModal;
