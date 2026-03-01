import React from 'react';
import { CalendarClock, Wrench } from 'lucide-react';
import Modal from '../components/UI/Modal';

export const maintenanceIntervals = ['Days', 'Miles', 'Hours'] as const;

const Maintenance: React.FC = () => {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState<{
    name: string;
    intervalDays?: number;
    intervalMiles?: number;
    intervalHours?: number;
  }>({ name: '' });

  // TODO: dueTemplates requires additional maintenance history data; for now
  // show none so counts remain stable until we implement the full model.
  const dueTemplates: any[] = [];

  const loadTemplates = async () => {
    try {
      const data = await import('../services/maintenanceService').then(m => m.maintenanceService.getTemplates());
      setTemplates(data);
    } catch (e) {
      console.error('Failed to load maintenance templates', e);
    }
  };

  React.useEffect(() => {
    loadTemplates();
  }, []);


  return (
    <div className="space-y-8" data-testid="maintenance-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Maintenance Control</h2>
            <p className="mt-1 text-sm text-slate-500">Plan preventive maintenance and queue service work before failures occur.</p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm"
          >
            <CalendarClock className="w-4 h-4 inline mr-2" />
            New Template
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Templates</p>
          <h3 className="text-3xl font-semibold text-slate-900 mt-2">{templates.length}</h3>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Due This Week</p>
          <h3 className="text-3xl font-semibold text-slate-900 mt-2">{dueTemplates.length}</h3>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Interval Types</p>
          <h3 className="text-3xl font-semibold text-slate-900 mt-2">{maintenanceIntervals.length}</h3>
        </article>
      </section>

      <section className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Preventive Maintenance Templates</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Template</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Service</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {templates.map((template) => {
              const triggerLabel = template.intervalDays
                ? `Every ${template.intervalDays} days`
                : template.intervalMiles
                  ? `Every ${template.intervalMiles.toLocaleString()} miles`
                  : `Every ${template.intervalHours} hours`;

              return (
                <tr key={template.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{triggerLabel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {template.lastServiceDate || template.lastServiceMiles || template.lastServiceHours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <Wrench className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Overdue / Due Reminders</h3>
        <p className="text-xs text-slate-500 mb-3">Connect equipment usage and last service dates to see PM due by interval (days/miles/hours).</p>
        {dueTemplates.length === 0 ? (
          <p className="text-sm text-slate-500">No preventive maintenance is due right now.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {dueTemplates.map((template) => (
              <li key={template.id} className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2">
                <span>{template.name}</span>
                <span className="text-slate-500">Generate work order</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* New template modal */}
      {isNewModalOpen && (
        <Modal isOpen={isNewModalOpen} title="New Maintenance Template" onClose={() => setIsNewModalOpen(false)}>
          <form
            className="space-y-4 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const created = await import('../services/maintenanceService').then(m =>
                  m.maintenanceService.createTemplate({
                    name: newTemplate.name,
                    intervalDays: newTemplate.intervalDays,
                    intervalMiles: newTemplate.intervalMiles,
                    intervalHours: newTemplate.intervalHours
                  } as any)
                );
                setTemplates((prev) => [created, ...prev]);
                setIsNewModalOpen(false);
                setNewTemplate({ name: '' });
              } catch (err) {
                console.error('Failed to create template', err);
                alert('Could not create template');
              }
            }}
          >
            <h3 className="text-lg font-semibold">New Maintenance Template</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                required
                value={newTemplate.name}
                onChange={(e) => setNewTemplate((t) => ({ ...t, name: e.target.value }))}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Interval Days</label>
              <input
                type="number"
                min={0}
                value={newTemplate.intervalDays ?? ''}
                onChange={(e) =>
                  setNewTemplate((t) => ({ ...t, intervalDays: e.target.value ? parseInt(e.target.value) : undefined }))
                }
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            {/* Additional fields for miles/hours could be added similarly */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="mr-2 px-4 py-2 bg-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Maintenance;
