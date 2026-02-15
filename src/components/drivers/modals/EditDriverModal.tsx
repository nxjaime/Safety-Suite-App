import React, { useState, useEffect } from 'react';
import { Modal } from '../../UI/Modal';
import { driverService } from '../../../services/driverService';
import type { Driver } from '../../../types';
import toast from 'react-hot-toast';

interface EditDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    driver: Driver;
    onSuccess: (updatedDriver: Driver) => void;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({
    isOpen,
    onClose,
    driver,
    onSuccess
}) => {
    const [editDriverData, setEditDriverData] = useState({
        name: '',
        status: '',
        phone: '',
        email: '',
        address: '',
        licenseNumber: '',
        terminal: '',
        employeeId: '',
        driverManager: '',
        licenseState: '',
        licenseRestrictions: '',
        licenseEndorsements: '',
        licenseExpirationDate: '',
        medicalCardIssueDate: '',
        medicalCardExpirationDate: '',
        cpapRequired: false
    });

    useEffect(() => {
        if (driver) {
            setEditDriverData({
                name: driver.name || '',
                status: driver.status || 'Active',
                phone: driver.phone || '',
                email: driver.email || '',
                address: driver.address || '',
                licenseNumber: driver.licenseNumber || '',
                terminal: driver.terminal || '',
                employeeId: driver.employeeId || '',
                driverManager: driver.driverManager || '',
                licenseState: driver.licenseState || '',
                licenseRestrictions: driver.licenseRestrictions || '',
                licenseEndorsements: driver.licenseEndorsements || '',
                licenseExpirationDate: driver.licenseExpirationDate || '',
                medicalCardIssueDate: driver.medicalCardIssueDate || '',
                medicalCardExpirationDate: driver.medicalCardExpirationDate || '',
                cpapRequired: driver.cpapRequired || false
            });
        }
    }, [driver, isOpen]);

    const handleUpdateDriver = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const updated = await driverService.updateDriver(driver.id, editDriverData);
            if (updated) {
                onSuccess(updated);
                toast.success('Driver profile updated');
                onClose();
            }
        } catch (error) {
            console.error('Failed to update driver', error);
            toast.error('Failed to update profile');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Driver Profile"
        >
            <form onSubmit={handleUpdateDriver} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.name}
                            onChange={(e) => setEditDriverData({ ...editDriverData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.employeeId}
                            onChange={(e) => setEditDriverData({ ...editDriverData, employeeId: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Manager</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. John Doe"
                        value={editDriverData.driverManager}
                        onChange={(e) => setEditDriverData({ ...editDriverData, driverManager: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.status}
                            onChange={(e) => setEditDriverData({ ...editDriverData, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.phone}
                            onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.email}
                            onChange={(e) => setEditDriverData({ ...editDriverData, email: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={editDriverData.address}
                        onChange={(e) => setEditDriverData({ ...editDriverData, address: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.licenseNumber}
                            onChange={(e) => setEditDriverData({ ...editDriverData, licenseNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="TX"
                            value={editDriverData.licenseState}
                            onChange={(e) => setEditDriverData({ ...editDriverData, licenseState: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Restrictions</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.licenseRestrictions}
                            onChange={(e) => setEditDriverData({ ...editDriverData, licenseRestrictions: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endorsements</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.licenseEndorsements}
                            onChange={(e) => setEditDriverData({ ...editDriverData, licenseEndorsements: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Expiration Date</label>
                    <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={editDriverData.licenseExpirationDate}
                        onChange={(e) => setEditDriverData({ ...editDriverData, licenseExpirationDate: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Card Issue Date</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.medicalCardIssueDate}
                            onChange={(e) => setEditDriverData({ ...editDriverData, medicalCardIssueDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Card Expiration</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={editDriverData.medicalCardExpirationDate}
                            onChange={(e) => setEditDriverData({ ...editDriverData, medicalCardExpirationDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="editCpapRequired"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={editDriverData.cpapRequired}
                        onChange={(e) => setEditDriverData({ ...editDriverData, cpapRequired: e.target.checked })}
                    />
                    <label htmlFor="editCpapRequired" className="text-sm font-medium text-gray-700">CPAP Required</label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={editDriverData.terminal}
                        onChange={(e) => setEditDriverData({ ...editDriverData, terminal: e.target.value })}
                    >
                        <option value="North East">North East</option>
                        <option value="South West">South West</option>
                        <option value="Central">Central</option>
                        <option value="West Coast">West Coast</option>
                    </select>
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditDriverModal;
