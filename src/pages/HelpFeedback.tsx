import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, FileText, LifeBuoy, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbackService, type FeedbackEntry } from '../services/feedbackService';

const docs = [
  {
    title: 'Getting Started',
    description: 'How to launch your daily workflow with Operations, Safety, and Compliance.',
    bullets: ['Review Status Board and open tasks', 'Check driver risk and coaching queue', 'Resolve compliance due items first']
  },
  {
    title: 'Submitting Feedback',
    description: 'Best way to report issues and request product improvements.',
    bullets: ['Choose the right category and priority', 'Include expected vs actual behavior', 'Add clear context and business impact']
  },
  {
    title: 'Admin & Access',
    description: 'How admin permissions and elevated actions are managed.',
    bullets: ['Admin dashboard is role-gated', 'Use least-privilege account assignments', 'Log feedback for missing admin workflows']
  }
];

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
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Help & Feedback</h2>
            <p className="mt-1 text-sm text-slate-500">Clean support docs, feedback intake, and backlog management.</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-emerald-700">Open Backlog</div>
            <div className="text-xl font-semibold text-emerald-900">{openCount}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Help Documentation</h3>
            </div>
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{doc.description}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {doc.bullets.map((bullet) => (
                      <li key={bullet}>- {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <FileText className="h-4 w-4" />
              Source doc: <code>docs/help/help-center.md</code>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Feedback Backlog</h3>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">Total items: {entries.length}</p>
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
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Message</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-3 text-sm text-slate-700">{entry.category}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{entry.priority}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{entry.message}</td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => deleteFeedback(entry.id)} className="inline-flex items-center text-rose-600 hover:text-rose-700" title="Delete feedback">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">No feedback submitted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">Send Feedback</h3>
          </div>
          <p className="mb-4 text-sm text-slate-500">Use this form to report bugs, request features, or suggest usability improvements.</p>

          <form onSubmit={submitFeedback} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="General">General</option>
                <option value="Bug">Bug</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Usability">Usability</option>
                <option value="Performance">Performance</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
              <select
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as 'Low' | 'Medium' | 'High' }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
              <textarea
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                rows={5}
                placeholder="Describe issue or request"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Submit Feedback
            </button>
          </form>
        </article>
      </section>
    </div>
  );
};

export default HelpFeedback;
