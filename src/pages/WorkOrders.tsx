import React from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, TrendingDown } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { workOrderService, canTransitionStatus, getNextStatuses, type WorkOrderStatus } from '../services/workOrderService';
import type { WorkOrder } from '../types';
import toast from 'react-hot-toast';

export const workOrderStatusPipeline = ['Draft', 'Approved', 'In Progress', 'Completed', 'Closed', 'Cancelled'] as const;

const statusTransitionLabel: Record<string, string> = {
  Approved: 'Approve',
  'In Progress': 'Start',
  Completed: 'Complete',
  Closed: 'Close',
  Cancelled: 'Cancel',
};

const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [newOrder, setNewOrder] = React.useState<{
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  }>({ title: '' });
  const [transitioningId, setTransitioningId] = React.useState<string | null>(null);

  const loadWorkOrders = async () => {
    try {
      const data = await workOrderService.getWorkOrders();
      setWorkOrders(data);
    } catch (e) {
      console.error('Failed to load work orders', e);
      toast.error('Failed to load work orders');
    }
  };

  React.useEffect(() => {
    loadWorkOrders();
  }, []);

  const backlogCount = workOrderService.getBacklogCount(workOrders);
  const overdueCount = workOrderService.getOverdueCount(workOrders);
  const mttrDays = workOrderService.getMTTRDays(workOrders);

  const handleStatusTransition = async (order: WorkOrder, nextStatus: WorkOrderStatus) => {
    if (!canTransitionStatus(order.status, nextStatus)) return;
    setTransitioningId(order.id);
    try {
      const updates: Partial<WorkOrder> = { status: nextStatus };
      if (nextStatus === 'Approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = 'Current User';
      }
      if (nextStatus === 'Completed') {
        updates.completedAt = new Date().toISOString();
      }
      const updated = await workOrderService.updateWorkOrder(order.id, updates);
      setWorkOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update status');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="space-y-8" data-testid="work-orders-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Work Order Command</h2>
            <p className="mt-1 text-sm text-slate-500">Track maintenance and repair execution from draft through closeout.</p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm"
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            New Work Order
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Backlog</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{backlogCount}</p>
          <p className="text-sm text-slate-500">Open work orders</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900">Overdue</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{overdueCount}</p>
          <p className="text-sm text-slate-500">Past due date</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">MTTR</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">
            {mttrDays != null ? `${mttrDays} days` : '—'}
          </p>
          <p className="text-sm text-slate-500">Mean time to repair</p>
        </article>
      </section>

      <section className="flex flex-wrap gap-2">
        {workOrderStatusPipeline.map((status) => (
          <span key={status} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        ))}
      </section>

      <section className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Work Orders</h3>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3 py-1 bg-emerald-600 text-white rounded-md text-sm"
          >
            New Order
          </button>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {workOrders.map((order) => {
              const allowedNext = getNextStatuses(order.status);
              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{order.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'Cancelled'
                          ? 'bg-slate-200 text-slate-600'
                          : order.status === 'Completed' || order.status === 'Closed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.assignedTo || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.dueDate || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {allowedNext.map((next: WorkOrderStatus) => (
                        <button
                          key={next}
                          type="button"
                          disabled={transitioningId === order.id}
                          onClick={() => handleStatusTransition(order, next)}
                          className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                        >
                          {statusTransitionLabel[next] ?? next}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Approvals</h3>
          </div>
          <p className="text-sm text-slate-500">
            {workOrders.filter((o) => o.status === 'Draft').length} draft work orders awaiting review.
          </p>
        </article>
        <article className="rounded-2xl shadow-sm border border-slate-200 p-6 bg-white">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Recently Closed</h3>
          </div>
          <p className="text-sm text-slate-500">
            {workOrders.filter((o) => o.status === 'Closed' || o.status === 'Completed').length} completed or closed.
          </p>
        </article>
      </section>

      {isNewModalOpen && (
        <Modal isOpen={isNewModalOpen} title="New Work Order" onClose={() => setIsNewModalOpen(false)}>
          <form
            className="space-y-4 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const created = await workOrderService.createWorkOrder({
                  title: newOrder.title,
                  description: newOrder.description || '',
                  priority: (newOrder.priority as any) || 'Medium',
                  status: 'Draft',
                  assignedTo: newOrder.assignedTo || undefined,
                  dueDate: newOrder.dueDate || undefined,
                });
                setWorkOrders((prev) => [created, ...prev]);
                setIsNewModalOpen(false);
                setNewOrder({ title: '' });
                toast.success('Work order created');
              } catch (err) {
                console.error('Failed to create work order', err);
                toast.error('Could not create work order');
              }
            }}
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                required
                value={newOrder.title}
                onChange={(e) => setNewOrder((o) => ({ ...o, title: e.target.value }))}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={newOrder.description || ''}
                onChange={(e) => setNewOrder((o) => ({ ...o, description: e.target.value }))}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Assignee</label>
              <input
                type="text"
                value={newOrder.assignedTo || ''}
                onChange={(e) => setNewOrder((o) => ({ ...o, assignedTo: e.target.value }))}
                placeholder="Name or ID"
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Due date</label>
              <input
                type="date"
                value={newOrder.dueDate || ''}
                onChange={(e) => setNewOrder((o) => ({ ...o, dueDate: e.target.value }))}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={newOrder.priority || 'Medium'}
                onChange={(e) => setNewOrder((o) => ({ ...o, priority: e.target.value }))}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
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

export default WorkOrders;
