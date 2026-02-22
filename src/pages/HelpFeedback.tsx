import React, { useEffect, useMemo, useState } from 'react';
import { Download, HelpCircle, LifeBuoy, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbackService, type FeedbackEntry } from '../services/feedbackService';

const HelpFeedback: React.FC = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    category: 'General',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    message: ''
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.listFeedback();
      setEntries(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load feedback backlog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const openCount = useMemo(() => entries.filter((entry) => entry.status !== 'Closed').length, [entries]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = form.message.trim();

    if (!trimmed) {
      toast.error('Please provide feedback details');
      return;
    }

    if (trimmed.length < 8) {
      toast.error('Feedback message must be at least 8 characters');
      return;
    }

    try {
      const created = await feedbackService.addFeedback({
        category: form.category,
        priority: form.priority,
        message: trimmed
      });
      setEntries((prev) => [created, ...prev]);
      setForm({ category: 'General', priority: 'Medium', message: '' });
      toast.success('Feedback submitted');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to submit feedback';
      toast.error(message);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm('Delete this feedback item?')) return;

    try {
      await feedbackService.deleteFeedback(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast.success('Feedback deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete feedback');
    }
  };

  const exportCsv = () => {
    if (entries.length === 0) {
      toast.error('No feedback to export');
      return;
    }

    const csv = feedbackService.toCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback_backlog_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Help & Feedback</h2>
        <p className="mt-1 text-sm text-slate-500">Documentation, support access, and a product feedback backlog.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600"><HelpCircle className="h-5 w-5" /></div>
          <h3 className="text-lg font-semibold text-slate-900">Getting Started</h3>
          <p className="mt-2 text-sm text-slate-600">Use Drivers, Equipment, and Compliance first. Then enable integration syncing from Settings and monitor Safety scores daily.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-cyan-50 p-2 text-cyan-600"><LifeBuoy className="h-5 w-5" /></div>
          <h3 className="text-lg font-semibold text-slate-900">Support Workflow</h3>
          <p className="mt-2 text-sm text-slate-600">Escalate urgent issues via your internal support process and log platform problems below so they enter the roadmap backlog.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-amber-50 p-2 text-amber-600"><MessageSquare className="h-5 w-5" /></div>
          <h3 className="text-lg font-semibold text-slate-900">Backlog Health</h3>
          <p className="mt-2 text-sm text-slate-600">Open items: <span className="font-semibold text-slate-900">{openCount}</span> / Total: <span className="font-semibold text-slate-900">{entries.length}</span></p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Send Feedback</h3>
        <form onSubmit={submitFeedback} className="mt-4 grid gap-4 md:grid-cols-4">
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="General">General</option>
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Usability">Usability</option>
            <option value="Performance">Performance</option>
          </select>
          <select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as 'Low' | 'Medium' | 'High' }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <input
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Describe issue or request"
            className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="md:col-span-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Submit Feedback
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Feedback Backlog</h3>
          <button onClick={exportCsv} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading feedback...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-sm text-slate-700">{entry.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{entry.priority}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{entry.message}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteFeedback(entry.id)} className="inline-flex items-center text-rose-600 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No feedback submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default HelpFeedback;
