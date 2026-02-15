import React, { useState } from 'react';
import { Modal } from '../../UI/Modal';
import { driverService } from '../../../services/driverService';
import toast from 'react-hot-toast';

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    driverId: string;
    onSuccess: (newDoc: any) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
    isOpen,
    onClose,
    driverId,
    onSuccess
}) => {
    const [newDocument, setNewDocument] = useState<{
        name: string;
        type: string;
        notes: string;
        expiryDate: string;
        file: File | null;
    }>({
        name: '',
        type: 'General',
        notes: '',
        expiryDate: '',
        file: null
    });

    const handleUploadDocument = async () => {
        if (!newDocument.name) {
            toast.error('Please provide a document name');
            return;
        }

        try {
            const doc = await driverService.uploadDocument(driverId, {
                name: newDocument.name,
                type: newDocument.type as any,
                notes: newDocument.notes,
                expiryDate: newDocument.expiryDate,
                url: newDocument.file ? newDocument.file.name : '' // Mock URL for now
            });

            toast.success('Document uploaded successfully');
            onSuccess(doc);
            onClose();
            setNewDocument({ name: '', type: 'General', notes: '', expiryDate: '', file: null });
        } catch (error) {
            console.error('Failed to upload document', error);
            toast.error('Failed to upload document');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upload Driver Document"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., Medical Certificate"
                        value={newDocument.name}
                        onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newDocument.type}
                        onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    >
                        <option value="License">License</option>
                        <option value="Medical">Medical</option>
                        <option value="Certification">Certification</option>
                        <option value="Training">Training</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                    <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newDocument.expiryDate}
                        onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                    <input
                        type="file"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        onChange={(e) => e.target.files && setNewDocument({ ...newDocument, file: e.target.files[0] })}
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUploadDocument}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                        Upload
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DocumentModal;
