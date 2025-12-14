import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, AlertCircle, Check, FileText } from 'lucide-react';
import type { Driver } from '../../types';
import { driverService } from '../../services/driverService';

interface DriverImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CSVRow {
    Name: string;
    'License Number': string;
    State: string;
    Email?: string;
    Phone?: string;
    'Hire Date'?: string;
}

export const DriverImportModal: React.FC<DriverImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Partial<Driver>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const drivers: Partial<Driver>[] = results.data.map((row) => ({
                    name: row.Name,
                    licenseNumber: row['License Number'],
                    terminal: row.State || 'Unknown', // Defaulting State to Terminal for now
                    email: row.Email,
                    phone: row.Phone,
                    hireDate: row['Hire Date'],
                    status: 'Active',
                    riskScore: 0,
                    yearsOfService: 0,
                    accidents: [],
                    citations: [],
                }));
                setPreviewData(drivers);
                setError(null);
            },
            error: (err) => {
                setError('Failed to parse CSV file: ' + err.message);
            }
        });
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        setIsUploading(true);
        try {
            await driverService.createDriversBulk(previewData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to upload drivers. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Import Drivers</h2>
                        <p className="text-sm text-slate-400 mt-1">Upload a CSV file to bulk add drivers.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!file ? (
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors bg-slate-800/50">
                            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Upload CSV File</h3>
                            <p className="text-sm text-slate-400 mb-6">Drag and drop or click to select</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer font-medium transition-colors"
                            >
                                Select File
                            </label>
                            <div className="mt-8 text-xs text-slate-500 text-left bg-slate-900 p-4 rounded border border-slate-800">
                                <p className="font-semibold mb-2">Expected CSV Columns (Case Sensitive):</p>
                                <code className="text-blue-400">Name, License Number, State, Email, Phone, Hire Date</code>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <FileText className="text-green-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{file.name}</p>
                                        <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB • {previewData.length} Drivers Found</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setPreviewData([]); }}
                                    className="text-slate-400 hover:text-red-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2 border border-red-500/20">
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {previewData.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300 mb-3">Preview ({Math.min(previewData.length, 5)} of {previewData.length})</h4>
                                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left text-slate-300">
                                            <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3">Name</th>
                                                    <th className="px-4 py-3">License</th>
                                                    <th className="px-4 py-3">State</th>
                                                    <th className="px-4 py-3">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {previewData.slice(0, 5).map((driver, idx) => (
                                                    <tr key={idx} className="bg-slate-800/30">
                                                        <td className="px-4 py-3 font-medium text-white">{driver.name}</td>
                                                        <td className="px-4 py-3">{driver.licenseNumber}</td>
                                                        <td className="px-4 py-3">{driver.terminal}</td>
                                                        <td className="px-4 py-3">{driver.email || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {previewData.length > 5 && (
                                            <div className="bg-slate-800/50 p-2 text-center text-xs text-slate-500 border-t border-slate-700">
                                                +{previewData.length - 5} more drivers
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-900 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading || previewData.length === 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>Uploading...</>
                        ) : (
                            <>
                                <Check size={18} />
                                Import {previewData.length} Drivers
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
