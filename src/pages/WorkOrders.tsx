import React from 'react';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';

export const workOrderStatusPipeline = ['Draft', 'Approved', 'In Progress', 'Completed', 'Closed'] as const;

const WorkOrders: React.FC = () => {
  const workOrders = [
    { id: 'WO-1001', title: 'Brake inspection', equipment: 'TRK-101', status: 'Draft', priority: 'High', assignedTo: 'Fleet Manager', dueDate: '2026-03-05' },
    { id: 'WO-1002', title: 'Trailer lighting repair', equipment: 'TRL-502', status: 'In Progress', priority: 'Medium', assignedTo: 'Maintenance Lead', dueDate: '2026-02-28' },
    { id: 'WO-1003', title: 'Forklift hydraulic check', equipment: 'FRK-201', status: 'Approved', priority: 'Low', assignedTo: 'Shop Tech', dueDate: '2026-03-12' }
  ];

  return (
    <div className="space-y-8" data-testid="work-orders-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Work Order Command</h2>
            <p className="mt-1 text-sm text-slate-500">Track maintenance and repair execution from draft through closeout.</p>
          </div>
          <button className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm">
            <ClipboardList className="w-4 h-4 inline mr-2" />
            New Work Order
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {workOrderStatusPipeline.map((status) => (
          <span key={status} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        ))}
      </section>

      <section className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Open Work Orders</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {workOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{order.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.equipment}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.assignedTo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Approvals</h3>
          </div>
          <p className="text-sm text-slate-500">Draft work orders awaiting review.</p>
        </article>
        <article className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Recently Closed</h3>
          </div>
          <p className="text-sm text-slate-500">Completed maintenance and repairs.</p>
        </article>
      </section>
    </div>
  );
};

export default WorkOrders;
