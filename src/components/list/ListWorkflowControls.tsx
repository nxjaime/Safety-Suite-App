import React, { useEffect, useMemo, useState } from 'react';
import { Download, Save, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { listWorkflowService, type SavedViewTarget, type ViewFilters, type SavedListView } from '../../services/listWorkflowService';

interface Props {
  target: SavedViewTarget;
  filters: ViewFilters;
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
  onApply?: (filters: ViewFilters) => void;
}

const ListWorkflowControls: React.FC<Props> = ({ target, filters, headers, rows, onApply }) => {
  const [savedViews, setSavedViews] = useState<SavedListView[]>([]);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    const views = await listWorkflowService.listSavedViews(target);
    setSavedViews(views);
  };

  useEffect(() => { load().catch(() => {}); }, [target]);

  const exportCsv = useMemo(() => listWorkflowService.exportCsv(headers, rows), [headers, rows]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Enter a view name');
    try {
      await listWorkflowService.saveView(target, name, filters);
      setName('');
      await load();
      toast.success('Saved view');
    } catch {
      toast.error('Failed to save view');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await listWorkflowService.deleteView(id);
      await load();
      toast.success('Deleted view');
    } catch {
      toast.error('Failed to delete view');
    }
  };

  const handleExport = async () => {
    const csv = await exportCsv;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Save view name" className="w-40 border-0 text-sm focus:outline-none" />
        <button onClick={handleSave} className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
          <Save className="mr-1 h-4 w-4" /> Save
        </button>
      </div>
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          Views <ChevronDown className="ml-1 h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {savedViews.length === 0 ? <div className="p-2 text-sm text-slate-500">No saved views</div> : savedViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-slate-50">
                <button className="text-left text-sm text-slate-700" onClick={() => onApply?.(view.filters)}>{view.name}</button>
                <button onClick={() => handleDelete(view.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={handleExport} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
        <Download className="mr-1 h-4 w-4" /> Export CSV
      </button>
    </div>
  );
};

export default ListWorkflowControls;
