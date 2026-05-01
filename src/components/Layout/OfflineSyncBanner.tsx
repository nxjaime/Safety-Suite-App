import React from 'react';
import { WifiOff, Cloud, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';

const OfflineSyncBanner: React.FC = () => {
    const { isOnline, pendingCount, lastSyncMessage, syncNow, lastSyncedAt } = useOfflineSync();

    if (isOnline && pendingCount === 0) {
        return null;
    }

    const statusLabel = isOnline ? 'Connected' : 'Offline mode';
    const tone = isOnline
        ? 'border-sky-200 bg-sky-50 text-sky-900'
        : 'border-amber-200 bg-amber-50 text-amber-950';

    return (
        <div className={clsx('mb-6 rounded-2xl border px-4 py-3 shadow-sm', tone)} data-testid="offline-sync-banner">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    {isOnline ? <Cloud className="mt-0.5 h-5 w-5" /> : <WifiOff className="mt-0.5 h-5 w-5" />}
                    <div>
                        <p className="font-semibold">{statusLabel}</p>
                        <p className="text-sm opacity-90">
                            {pendingCount > 0
                                ? `${pendingCount} queued change(s) pending sync.`
                                : isOnline
                                    ? 'All queued changes have synced.'
                                    : 'Changes are being saved locally and will sync when you reconnect.'}
                        </p>
                        {lastSyncMessage && <p className="text-xs opacity-80">{lastSyncMessage}</p>}
                        {lastSyncedAt && isOnline && (
                            <p className="text-xs opacity-70">Last sync: {lastSyncedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { syncNow().catch(() => {}); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-current/20 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white"
                >
                    <RefreshCw className="h-4 w-4" />
                    Sync now
                </button>
            </div>
        </div>
    );
};

export default OfflineSyncBanner;
