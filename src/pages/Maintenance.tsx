import React from 'react';
import { CalendarClock, Wrench, ClipboardList, CheckCircle } from 'lucide-react';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { maintenanceService } from '../services/maintenanceService';
import { workOrderService } from '../services/workOrderService';
import { equipmentService } from '../services/equipmentService';
import type { MaintenanceHistoryEntry, PMDueItem, Equipment } from '../types';

export const maintenanceIntervals = ['Days', 'Miles', 'Hours'] as const;

const Maintenance: React.FC = () => {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [equipment, setEquipment] = React.useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = React.useState<string>('');
  const [dueItems, setDueItems] = React.useState<PMDueItem[]>([]);
  const [history, setHistory] = React.useState<MaintenanceHistoryEntry[]>([]);
  const [loadingDues, setLoadingDues] = React.useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState<{
    name: string;
    appliesToType?: string;
    intervalDays?: number;
    intervalMiles?: number;
    intervalHours?: number;
  }>({ name: '' });

  const loadTemplates = async () => {
    try {
      const data = await maintenanceService.getTemplates();
      setTemplates(data);
    } catch (e) {
      console.error('Failed to load maintenance templates', e);
    }
  };

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getEquipment({ status: 'active' });
      setEquipment(data);
    } catch (e) {
      console.error('Failed to load equipment', e);
    }
  };

  React.useEffect(() => {
    loadTemplates();
    loadEquipment();
  }, []);

  React.useEffect(() => {
    if (!selectedEquipmentId) {
      setDueItems([]);
      setHistory([]);
      return;
    }
    const asset = equipment.find(e => e.id === selectedEquipmentId);
    if (!asset) return;

    setLoadingDues(true);
    Promise.all([
      maintenanceService.generatePMDues(
        selectedEquipmentId,
        asset.usageMiles || 0,
        asset.usageHours || 0
      ),
      maintenanceService.getMaintenanceHistory(selectedEquipmentId),
    ])
      .then(([dues, hist]) => {
        setDueItems(dues);
        setHistory(hist);
      })
      .catch(err => console.error('Failed to load PM dues', err))
      .finally(() => setLoadingDues(false));
  }, [selectedEquipmentId, equipment]);

  const handleGenerateWorkOrder = async (due: PMDueItem) => {
    const asset = equipment.find(e => e.id === selectedEquipmentId);
    if (!asset) return;
    try {
      await workOrderService.createWorkOrderFromTemplate(due.templateId, {
        equipmentId: selectedEquipmentId,
        title: `PM: ${due.templateName} — ${asset.assetTag}`,
        description: due.reason,
      });
      toast.success(`Work order created for ${due.templateName}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create work order');
    }
  };

  const selectedAsset = equipment.find(e => e.id === selectedEquipmentId);

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
          <p className="text-sm text-slate-500">Due This Asset</p>
          <h3 className="text-3xl font-semibold text-slate-900 mt-2">{dueItems.length}</h3>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Service Records</p>
          <h3 className="text-3xl font-semibold text-slate-900 mt-2">{history.length}</h3>
        </article>
      </section>

      {/* Equipment selector for PM due calculation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Check PM dues for:</label>
          <select
            value={selectedEquipmentId}
            onChange={e => setSelectedEquipmentId(e.target.value)}
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">— Select an asset —</option>
            {equipment.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.assetTag} — {asset.year} {asset.make} {asset.model} ({asset.type})
              </option>
            ))}
          </select>
          {selectedAsset && (
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {(selectedAsset.usageMiles || 0).toLocaleString()} mi · {selectedAsset.usageHours || 0} hrs
            </span>
          )}
        </div>
      </section>

      {/* PM Templates table */}
      <section className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Preventive Maintenance Templates</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Template</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Applies To</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-sm text-slate-500 text-center">No templates yet. Add one to start scheduling PM.</td>
              </tr>
            ) : templates.map((template) => {
              const triggerLabel = template.intervalDays
                ? `Every ${template.intervalDays} days`
                : template.intervalMiles
                  ? `Every ${template.intervalMiles.toLocaleString()} miles`
                  : template.intervalHours
                    ? `Every ${template.intervalHours} hours`
                    : '—';
              const isDueForSelected = dueItems.some(d => d.templateId === template.id);

              return (
                <tr key={template.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{template.appliesToType || 'All'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{triggerLabel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isDueForSelected ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <Wrench className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* PM Due Reminders */}
      <section className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Overdue / Due Reminders</h3>
          {selectedAsset && <span className="text-sm text-slate-500">{selectedAsset.assetTag}</span>}
        </div>
        {!selectedEquipmentId ? (
          <p className="text-sm text-slate-500">Select an asset above to check PM due items.</p>
        ) : loadingDues ? (
          <p className="text-sm text-slate-500">Calculating dues…</p>
        ) : dueItems.length === 0 ? (
          <p className="text-sm text-slate-500">No preventive maintenance is due for this asset.</p>
        ) : (
          <ul className="space-y-2">
            {dueItems.map((item) => (
              <li key={item.templateId} className="flex items-center justify-between border border-amber-100 bg-amber-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.templateName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                </div>
                <button
                  onClick={() => handleGenerateWorkOrder(item)}
                  className="ml-4 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1 whitespace-nowrap"
                >
                  <ClipboardList className="w-3 h-3" />
                  Generate WO
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Service History */}
      {selectedEquipmentId && (
        <section className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Service History — {selectedAsset?.assetTag}</h3>
          </div>
          {history.length === 0 ? (
            <div className="px-6 py-6 text-sm text-slate-500">No service records yet. Complete a work order or record a service to start tracking history.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {history.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-700">{entry.serviceDate}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{entry.serviceMiles?.toLocaleString() || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{entry.serviceHours || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{entry.performedBy || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* New template modal */}
      {isNewModalOpen && (
        <Modal isOpen={isNewModalOpen} title="New Maintenance Template" onClose={() => setIsNewModalOpen(false)}>
          <form
            className="space-y-4 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const created = await maintenanceService.createTemplate({
                  name: newTemplate.name,
                  appliesToType: newTemplate.appliesToType || undefined,
                  intervalDays: newTemplate.intervalDays,
                  intervalMiles: newTemplate.intervalMiles,
                  intervalHours: newTemplate.intervalHours,
                } as any);
                setTemplates((prev) => [created, ...prev]);
                setIsNewModalOpen(false);
                setNewTemplate({ name: '' });
                toast.success('Template created');
              } catch (err) {
                console.error('Failed to create template', err);
                toast.error('Could not create template');
              }
            }}
          >
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
              <label className="block text-sm font-medium text-slate-700">Applies to type (optional)</label>
              <input
                type="text"
                value={newTemplate.appliesToType || ''}
                onChange={(e) => setNewTemplate((t) => ({ ...t, appliesToType: e.target.value || undefined }))}
                placeholder="Truck, Trailer, Forklift…"
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Interval Days</label>
                <input
                  type="number"
                  min={0}
                  value={newTemplate.intervalDays ?? ''}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, intervalDays: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="mt-1 block w-full border border-slate-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Interval Miles</label>
                <input
                  type="number"
                  min={0}
                  value={newTemplate.intervalMiles ?? ''}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, intervalMiles: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="mt-1 block w-full border border-slate-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Interval Hours</label>
                <input
                  type="number"
                  min={0}
                  value={newTemplate.intervalHours ?? ''}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, intervalHours: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="mt-1 block w-full border border-slate-300 rounded-md p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Maintenance;
