import React, { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, adminTables } from '../services/adminService';
import { dataQualityService, type DataQualitySummary } from '../services/dataQualityService';
import AdminForm from '../components/AdminForm';

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const AdminDashboard: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState(adminTables[0].name);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<DataQualitySummary | null>(null);

  const selectedTableLabel = useMemo(() => {
    return adminTables.find((table) => table.name === selectedTable)?.label || selectedTable;
  }, [selectedTable]);

  const loadRows = async () => {
    try {
      setLoading(true);
      // guard against mocks or unexpected undefined returns
      const data = (await adminService.listRows(selectedTable, 25)) || [];
      setRows(data);
      if (data.length && Object.keys(formData).length === 0) {
        // start form with a blank copy of the first row
        const copy = { ...data[0] };
        delete copy.id;
        setFormData(copy);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to load ${selectedTableLabel}`);
    } finally {
      setLoading(false);
    }
  };

  const loadQuality = async () => {
    try {
      const summary = await dataQualityService.getSummary();
      setQuality(summary);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadRows();
    loadQuality();
    setFormData({});
  }, [selectedTable]);

  const insertRow = async () => {
    try {
      const payload = formData;
      await adminService.insertRow(selectedTable, payload);
      toast.success('Row created');
      setFormData({});
      loadRows();
    } catch (error) {
      console.error(error);
      toast.error('Insert failed');
    }
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm(`Delete row ${id}?`)) return;

    try {
      await adminService.deleteRow(selectedTable, id);
      setRows((prev) => prev.filter((row) => String(row.id) !== id));
      toast.success('Row deleted');
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Create records across application tables and manage operational data quickly.</p>
          </div>
          <div className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            <Shield className="mr-2 h-4 w-4" />
            Admin Access
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Data Builder</h3>
          <label htmlFor="table-select" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Table</label>
          <select
            id="table-select"
            value={selectedTable}
            onChange={(event) => setSelectedTable(event.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {adminTables.map((table) => (
              <option key={table.name} value={table.name}>{table.label}</option>
            ))}
          </select>

          <label htmlFor="admin-form" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Insert Record</label>
          <div id="admin-form"><AdminForm table={selectedTable} data={formData} onChange={setFormData} /></div>

          <div className="mt-3 flex gap-2">
            <button onClick={insertRow} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Create Row
            </button>
            <button onClick={loadRows} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Data Quality Snapshot</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-amber-900">
              <div>Missing driver emails: <span className="font-semibold">{quality?.missingDriverEmails ?? '-'}</span></div>
              <div>Missing driver terminals: <span className="font-semibold">{quality?.missingDriverTerminals ?? '-'}</span></div>
              <div>Open tasks w/o due date: <span className="font-semibold">{quality?.tasksWithoutDueDate ?? '-'}</span></div>
              <div>Open remediations: <span className="font-semibold">{quality?.openInspectionRemediations ?? '-'}</span></div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center text-lg font-semibold text-slate-900">
              <Database className="mr-2 h-5 w-5 text-slate-500" />
              {selectedTableLabel} ({rows?.length ?? 0})
            </h3>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading records...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">No records found.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={String(row.id)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ID: {String(row.id || 'N/A')}</div>
                    {Boolean(row.id) && (
                      <button onClick={() => deleteRow(String(row.id))} className="text-rose-600 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <pre className="overflow-x-auto text-xs text-slate-700">{prettyJson(row)}</pre>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
