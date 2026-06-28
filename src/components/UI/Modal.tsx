import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/50 backdrop-blur-sm transition-opacity sm:items-center">
            <div
                className={clsx(
                    "my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-md transform flex-col rounded-lg border border-slate-200 bg-white shadow-xl transition-all",
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-4">
                    <h3 className="text-lg font-semibold text-slate-900" id="modal-title">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-safety-green rounded-full p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="min-h-0 overflow-y-auto p-6 text-slate-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
