import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BellOff,
  AlertTriangle,
  FileWarning,
  BookOpen,
  CheckCheck,
  X,
} from 'lucide-react';
import type { Notification } from '../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  unreadCount: number;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICON: Record<Notification['type'], React.ReactNode> = {
  overdue_task: <AlertTriangle className="w-4 h-4" />,
  expiring_document: <FileWarning className="w-4 h-4" />,
  unreviewed_training: <BookOpen className="w-4 h-4" />,
  pending_checkin: <AlertTriangle className="w-4 h-4" />,
};

const SEVERITY_BORDER: Record<Notification['severity'], string> = {
  critical: 'border-l-red-500',
  warning: 'border-l-amber-400',
  info: 'border-l-blue-400',
};

const SEVERITY_ICON_COLOR: Record<Notification['severity'], string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const NotificationPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  unreadCount,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              title="Mark all read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BellOff className="w-8 h-8 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ol>
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.href}
                  onClick={onClose}
                  className={`flex items-start gap-3 px-4 py-3 border-l-4 ${SEVERITY_BORDER[n.severity]} hover:bg-slate-50 transition-colors`}
                >
                  <span className={`mt-0.5 flex-shrink-0 ${SEVERITY_ICON_COLOR[n.severity]}`}>
                    {TYPE_ICON[n.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 truncate">{n.detail}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
