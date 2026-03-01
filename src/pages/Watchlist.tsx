import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetchInterventionQueue,
  type InterventionQueueItem
} from '../services/interventionQueueService';

const Watchlist: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InterventionQueueItem[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queue = await fetchInterventionQueue(50);
      setItems(queue);
    } catch (e) {
      console.error('Failed to load watchlist', e);
      setError('Failed to load watchlist');
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6" data-testid="watchlist-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Intervention Watchlist</h2>
            <p className="mt-1 text-sm text-slate-500">
              Prioritized intervention queue for high-risk drivers and recent severe events.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading watchlist...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Events</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Max Severity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Action</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <tr key={item.driverId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    <div className="inline-flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                      {item.driverName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.riskScore}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.recentEventCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.maxSeverity}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.priorityScore}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.recommendedAction}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      to={`/drivers/${item.driverId}`}
                      className="font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      Driver Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No drivers currently meet watchlist criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Watchlist;
