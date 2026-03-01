import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Filter, Search, Trash2, Upload } from 'lucide-react';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { documentService, type AppDocument } from '../services/documentService';

const Documents: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [archivingSelected, setArchivingSelected] = useState(false);
    const [applyingBulkUpdate, setApplyingBulkUpdate] = useState(false);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [bulkCategory, setBulkCategory] = useState('');
    const [bulkDocType, setBulkDocType] = useState('');
    const [bulkRequired, setBulkRequired] = useState(false);
    const [bulkExpirationDate, setBulkExpirationDate] = useState('');

    const [newDocument, setNewDocument] = useState<{
        name: string;
        category: string;
        docType: string;
        files: File[];
        required: boolean;
        expirationDate: string;
    }>({
        name: '',
        category: 'Policies',
        docType: 'PDF',
        files: [],
        required: false,
        expirationDate: ''
    });

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const data = await documentService.listDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Failed to load documents', error);
            setLoadError('Failed to load documents. Please retry.');
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const categories = useMemo(() => {
        const values = new Set(documents.map((doc) => doc.category));
        return ['All', ...Array.from(values)];
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
            const matchesSearch = !searchTerm
                || doc.name.toLowerCase().includes(searchTerm.toLowerCase())
                || doc.category.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [documents, selectedCategory, searchTerm]);

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newDocument.files.length === 0) {
            toast.error('Please choose a file to upload');
            return;
        }

        try {
            const metadata = {
                required: newDocument.required,
                expirationDate: newDocument.expirationDate || null
            };

            if (newDocument.files.length === 1) {
                const uploaded = await documentService.uploadDocument({
                    file: newDocument.files[0],
                    name: newDocument.name || newDocument.files[0].name,
                    category: newDocument.category,
                    docType: newDocument.docType,
                    metadata
                });
                setDocuments((prev) => [uploaded, ...prev]);
                setSelectedDocumentIds((prev) => prev.filter((id) => id !== uploaded.id));
            } else {
                const result = await documentService.uploadDocumentsBulk({
                    files: newDocument.files,
                    category: newDocument.category,
                    docType: newDocument.docType,
                    metadata
                });
                setDocuments((prev) => [...result.uploaded, ...prev]);
                if (result.failedFiles.length > 0) {
                    toast.error(`${result.failedFiles.length} file(s) failed to upload`);
                } else {
                    toast.success(`${result.uploaded.length} documents uploaded`);
                }
            }

            setIsModalOpen(false);
            setNewDocument({
                name: '',
                category: 'Policies',
                docType: 'PDF',
                files: [],
                required: false,
                expirationDate: ''
            });
            if (newDocument.files.length === 1) {
                toast.success('Document uploaded');
            }
        } catch (error) {
            console.error('Failed to upload document', error);
            toast.error('Document upload failed');
        }
    };

    const handleApplyBulkUpdate = async () => {
        if (selectedDocumentIds.length === 0) return;
        if (!bulkCategory && !bulkDocType && !bulkExpirationDate && !bulkRequired) {
            toast.error('Select at least one bulk update field');
            return;
        }

        setApplyingBulkUpdate(true);
        try {
            const result = await documentService.bulkUpdateDocuments({
                documentIds: selectedDocumentIds,
                category: bulkCategory || undefined,
                docType: bulkDocType || undefined,
                metadata: {
                    required: bulkRequired,
                    expirationDate: bulkExpirationDate || null
                }
            });

            if (result.failedIds.length > 0) {
                toast.error(`${result.failedIds.length} document(s) failed to update`);
            } else {
                toast.success(`${result.updated} document(s) updated`);
            }

            await loadDocuments();
            setSelectedDocumentIds((prev) => prev.filter((id) => result.failedIds.includes(id)));
            setBulkCategory('');
            setBulkDocType('');
            setBulkRequired(false);
            setBulkExpirationDate('');
        } catch (error) {
            console.error('Bulk update failed', error);
            toast.error('Bulk update failed');
        } finally {
            setApplyingBulkUpdate(false);
        }
    };

    const handleDownload = async (doc: AppDocument) => {
        try {
            const signedUrl = await documentService.getDownloadUrl(doc.storagePath);
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Download failed', error);
            toast.error('Failed to create download link');
        }
    };

    const handleDelete = async (doc: AppDocument) => {
        if (!window.confirm(`Archive document "${doc.name}"?`)) return;

        try {
            await documentService.deleteDocument(doc);
            setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
            setSelectedDocumentIds((prev) => prev.filter((id) => id !== doc.id));
            toast.success('Document archived');
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to archive document');
        }
    };

    const toggleSelectedDocument = (docId: string) => {
        setSelectedDocumentIds((prev) => (
            prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
        ));
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredDocuments.map((doc) => doc.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedDocumentIds.includes(id));
        if (allVisibleSelected) {
            setSelectedDocumentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
            return;
        }
        setSelectedDocumentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    };

    const handleBulkArchive = async () => {
        const selectedDocuments = documents.filter((doc) => selectedDocumentIds.includes(doc.id));
        if (selectedDocuments.length === 0) return;
        if (!window.confirm(`Archive ${selectedDocuments.length} selected document(s)?`)) return;

        setArchivingSelected(true);
        try {
            const result = await documentService.bulkArchiveDocuments(selectedDocuments);
            setDocuments((prev) => prev.filter((doc) => !selectedDocumentIds.includes(doc.id)));
            setSelectedDocumentIds([]);

            if (result.failedIds.length > 0) {
                toast.error(`${result.failedIds.length} document(s) failed to archive`);
            } else {
                toast.success(`${result.archived} document(s) archived`);
            }
        } catch (error) {
            console.error('Bulk archive failed', error);
            toast.error('Bulk archive failed');
        } finally {
            setArchivingSelected(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Document Library</h2>
                        <p className="mt-1 text-sm text-slate-500">Auditable compliance documents with secure storage access.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                    </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleBulkArchive}
                        disabled={selectedDocumentIds.length === 0 || archivingSelected}
                        className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archive Selected
                    </button>
                    <span className="text-sm text-slate-500">
                        {selectedDocumentIds.length} selected
                    </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="">Update category...</option>
                        <option value="Policies">Policies</option>
                        <option value="Handbooks">Handbooks</option>
                        <option value="Forms">Forms</option>
                        <option value="Training">Training</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Registration">Registration</option>
                    </select>
                    <input
                        type="text"
                        value={bulkDocType}
                        onChange={(e) => setBulkDocType(e.target.value)}
                        placeholder="Update type..."
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                        type="date"
                        value={bulkExpirationDate}
                        onChange={(e) => setBulkExpirationDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <label className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={bulkRequired}
                            onChange={(e) => setBulkRequired(e.target.checked)}
                            className="mr-2"
                        />
                        Mark required
                    </label>
                    <button
                        onClick={handleApplyBulkUpdate}
                        disabled={selectedDocumentIds.length === 0 || applyingBulkUpdate}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Apply Bulk Update
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <label className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                    </label>
                    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600">
                        <Filter className="mr-2 h-4 w-4" />
                        Category
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Loading documents...</div>
                ) : loadError ? (
                    <div className="space-y-3 p-8 text-center">
                        <p className="text-sm text-rose-600">{loadError}</p>
                        <button
                            onClick={loadDocuments}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAllVisible}
                                        checked={filteredDocuments.length > 0 && filteredDocuments.every((doc) => selectedDocumentIds.includes(doc.id))}
                                        aria-label="Select all visible documents"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredDocuments.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocumentIds.includes(doc.id)}
                                            onChange={() => toggleSelectedDocument(doc.id)}
                                            aria-label={`Select ${doc.name}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        <div className="flex items-center">
                                            <FileText className="mr-2 h-4 w-4 text-slate-400" />
                                            {doc.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{doc.category}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{doc.docType || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="mr-3 inline-flex items-center text-emerald-700 hover:text-emerald-900"
                                        >
                                            <Download className="mr-1 h-4 w-4" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc)}
                                            className="inline-flex items-center text-rose-600 hover:text-rose-800"
                                        >
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Archive
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocuments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                                        No documents found for this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </section>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Upload Document"
            >
                <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Document Name</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                            placeholder="Leave blank to use filename"
                            value={newDocument.name}
                            onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                        <select
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                            value={newDocument.category}
                            onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                        >
                            <option value="Policies">Policies</option>
                            <option value="Handbooks">Handbooks</option>
                            <option value="Forms">Forms</option>
                            <option value="Training">Training</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Registration">Registration</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Document Type</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                            placeholder="PDF, XLSX, DOCX"
                            value={newDocument.docType}
                            onChange={(e) => setNewDocument({ ...newDocument, docType: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">File(s)</label>
                        <input
                            type="file"
                            required
                            multiple
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            onChange={(e) => setNewDocument({ ...newDocument, files: Array.from(e.target.files || []) })}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="inline-flex items-center text-sm text-slate-700">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={newDocument.required}
                                onChange={(e) => setNewDocument({ ...newDocument, required: e.target.checked })}
                            />
                            Required compliance document
                        </label>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Expiration Date</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                                value={newDocument.expirationDate}
                                onChange={(e) => setNewDocument({ ...newDocument, expirationDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
