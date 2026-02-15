import React, { useState } from 'react';
import Modal from '../../UI/Modal';
import { driverService } from '../../../services/driverService';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';

interface RiskEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    driverId: string;
    driverName: string;
    onSuccess: () => void;
}

const RiskEventModal: React.FC<RiskEventModalProps> = ({
    isOpen,
    onClose,
    driverId,
    driverName,
    onSuccess
}) => {
    const [newRiskEvent, setNewRiskEvent] = useState<{
        date: string;
        type: string;
        notes: string;
        file: File | null;
    }>({
        date: new Date().toISOString().split('T')[0],
        type: '',
        notes: '',
        file: null
    });

    const handleLogRiskEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate points based on type
        let points = 0;
        switch (newRiskEvent.type) {
            case 'Speeding': points = 10; break;
            case 'Hard Braking': points = 5; break;
            case 'HOS Violation': points = 15; break;
            case 'Accident': points = 20; break;
            case 'Citation': points = 10; break;
            default: points = 5;
        }

        const event = {
            date: newRiskEvent.date,
            type: newRiskEvent.type,
            points,
            notes: newRiskEvent.file
                ? `${newRiskEvent.notes} [Attached: ${newRiskEvent.file.name}]`
                : newRiskEvent.notes
        };

        try {
            await driverService.addRiskEvent(driverId, event);

            // Fetch current driver data to get current score
            const currentDriver = await driverService.getDriverById(driverId);
            if (currentDriver) {
                const newScore = (currentDriver.riskScore || 0) + points;
                await driverService.updateDriverScore(driverId, newScore);
            }

            toast.success(`Risk event logged: ${newRiskEvent.type} `);
            onSuccess();
            onClose();
            setNewRiskEvent({ date: new Date().toISOString().split('T')[0], type: '', notes: '', file: null });
        } catch (error) {
            console.error(error);
            toast.error('Failed to log risk event');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Log Risk Event for ${driverName}`}
        >
            <form onSubmit={handleLogRiskEvent} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newRiskEvent.date}
                        onChange={(e) => setNewRiskEvent({ ...newRiskEvent, date: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newRiskEvent.type}
                            onChange={(e) => setNewRiskEvent({ ...newRiskEvent, type: e.target.value })}
                        >
                            <option value="">Select Type</option>
                            <option value="Speeding">Speeding (+10)</option>
                            <option value="Hard Braking">Hard Braking (+5)</option>
                            <option value="HOS Violation">HOS Violation (+15)</option>
                            <option value="Accident">Accident (+20)</option>
                            <option value="Citation">Citation (+10)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Points Impact</label>
                        <input
                            type="number"
                            className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-gray-500"
                            value={
                                newRiskEvent.type === 'Speeding' ? 10 :
                                    newRiskEvent.type === 'Hard Braking' ? 5 :
                                        newRiskEvent.type === 'HOS Violation' ? 15 :
                                            newRiskEvent.type === 'Accident' ? 20 :
                                                newRiskEvent.type === 'Citation' ? 10 : 0
                            }
                            readOnly
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={3}
                        placeholder="Enter event details..."
                        value={newRiskEvent.notes}
                        onChange={(e) => setNewRiskEvent({ ...newRiskEvent, notes: e.target.value })}
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Document</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="risk-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                    <span>Upload a file</span>
                                    <input
                                        id="risk-file-upload"
                                        name="risk-file-upload"
                                        type="file"
                                        className="sr-only"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setNewRiskEvent({ ...newRiskEvent, file: e.target.files[0] });
                                            }
                                        }}
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                {newRiskEvent.file ? newRiskEvent.file.name : 'PNG, JPG, PDF up to 10MB'}
                            </p>
                        </div>
                    </div>
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
                        Log Event
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RiskEventModal;
