import React, { useState } from 'react';
import { FileText, Search, Filter, Upload, File, Folder } from 'lucide-react';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';

const Documents: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDocument, setNewDocument] = useState({
        name: '',
        type: '',
        category: ''
    });

    const [documents, setDocuments] = useState([
        { id: 1, name: 'Safety Policy 2023.pdf', type: 'PDF', size: '2.4 MB', date: 'Oct 24, 2023', category: 'Policies' },
        { id: 2, name: 'Driver Handbook v2.docx', type: 'DOCX', size: '1.8 MB', date: 'Sep 15, 2023', category: 'Handbooks' },
        { id: 3, name: 'Incident Report Template.xlsx', type: 'XLSX', size: '450 KB', date: 'Aug 10, 2023', category: 'Forms' },
        { id: 4, name: 'Training Schedule Q4.pdf', type: 'PDF', size: '1.2 MB', date: 'Oct 01, 2023', category: 'Training' },
        { id: 5, name: 'Vehicle Inspection Checklist.pdf', type: 'PDF', size: '850 KB', date: 'Jul 20, 2023', category: 'Forms' },
    ]);

    const handleUploadDocument = (e: React.FormEvent) => {
        e.preventDefault();
        const newDoc = {
            id: documents.length + 1,
            name: newDocument.name || 'New Document.pdf',
            type: 'PDF', // Mock type
            size: '1.5 MB', // Mock size
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            category: newDocument.category || 'Uncategorized'
        };
        setDocuments([...documents, newDoc]);
        setIsModalOpen(false);
        setNewDocument({ name: '', type: '', category: '' });
        toast.success('Document uploaded successfully!');
    };

    const handleDownload = (docName: string) => {
        // Create a fake blob for download simulation
        const content = `This is a placeholder content for document: ${docName}. \n\nIn a real application, this would come from a server.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docName.endsWith('.pdf') ? docName.replace('.pdf', '.txt') : docName + '.txt'; // Just saving as txt for demo
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Started download for ${docName}`);
    };

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredDocuments = selectedCategory
        ? documents.filter(d => d.category === selectedCategory)
        : documents;

    // ... handlers ...

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                    {selectedCategory ? (
                        <div className="flex items-center">
                            <span
                                className="text-slate-500 hover:text-slate-700 cursor-pointer mr-2"
                                onClick={() => setSelectedCategory(null)}
                            >
                                Document Library
                            </span>
                            <span className="text-slate-400 mr-2">/</span>
                            <span>{selectedCategory}</span>
                        </div>
                    ) : 'Document Library'}
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200 flex items-center"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex space-x-4 mb-6">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <button className="flex items-center px-4 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </button>
            </div>

            {!selectedCategory && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {['Policies', 'Handbooks', 'Forms', 'Training'].map((cat) => {
                        const count = documents.filter(d => d.category === cat).length;
                        const color = cat === 'Policies' ? 'text-yellow-500' :
                            cat === 'Handbooks' ? 'text-blue-500' :
                                cat === 'Forms' ? 'text-green-500' : 'text-purple-500';
                        return (
                            <div
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center cursor-pointer hover:bg-slate-50"
                            >
                                <Folder className={`w-8 h-8 ${color} mr-3`} />
                                <div>
                                    <h4 className="font-medium text-slate-900">{cat}</h4>
                                    <p className="text-xs text-slate-500">{count} files</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Added</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FileText className="w-5 h-5 text-slate-400 mr-3" />
                                        <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.size}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDownload(doc.name)}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Upload Document"
            >
                <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Document Name</label>
                        <div className="relative">
                            <File className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                className="pl-9 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g. Safety Policy 2024"
                                value={newDocument.name}
                                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={newDocument.category}
                            onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            <option value="Policies">Policies</option>
                            <option value="Handbooks">Handbooks</option>
                            <option value="Forms">Forms</option>
                            <option value="Training">Training</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                <div className="flex text-sm text-slate-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF, DOCX, XLSX up to 10MB</p>
                            </div>
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
                            Upload
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Documents;
