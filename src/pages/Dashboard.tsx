import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckSquare,
  Loader2,
  Wrench,
  Shield,
  FileCheck,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportingService } from '../services/reportingService';
import { equipmentService } from '../services/equipmentService';
import { createDashboardService } from '../services/dashboardService';
import type { DashboardSnapshot, DashboardKpiCard } from '../services/dashboardService';
import type { ReportingWindow, ReportingTrendPoint } from '../services/reportingService';
import { buildBacklog } from '../services/backlogPrioritizationService';
import type { BacklogItem } from '../services/backlogPrioritizationService';

const dashboardService = createDashboardService({
  getReportingSnapshot: (w) => reportingService.getSnapshot(w),
  getEquipment: () => equipmentService.getEquipment(),
  now: () => new Date(),
});

const FLEET_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];
const DOMAIN_ICONS: Record<string, React.ComponentType<any>> = {
  fleet: Wrench,
  safety: Shield,
  compliance: FileCheck,
  training: BookOpen,
};
const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-sky-100 text-sky-800 border-sky-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const KPI_ICON_MAP: Record<string, React.ComponentType<any>> = {
  fleet_completion: Wrench,
  avg_risk_score: Activity,
  compliance_actions: AlertCircle,
  training_rate: CheckSquare,
};
const KPI_COLOR_MAP: Record<string, { good: string; warn: string; critical: string }> = {
  fleet_completion: { good: 'text-emerald-700 bg-emerald-100', warn: 'text-amber-700 bg-amber-100', critical: 'text-rose-700 bg-rose-100' },
  avg_risk_score: { good: 'text-emerald-700 bg-emerald-100', warn: 'text-amber-700 bg-amber-100', critical: 'text-rose-700 bg-rose-100' },
  compliance_actions: { good: 'text-emerald-700 bg-emerald-100', warn: 'text-amber-700 bg-amber-100', critical: 'text-rose-700 bg-rose-100' },
  training_rate: { good: 'text-sky-700 bg-sky-100', warn: 'text-amber-700 bg-amber-100', critical: 'text-rose-700 bg-rose-100' },
};

const Dashboard: React.FC = () => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [trendData, setTrendData] = useState<ReportingTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState<ReportingWindow>('90d');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [dash, reporting] = await Promise.all([
          dashboardService.getSnapshot(window),
          reportingService.getSnapshot(window),
        ]);
        if (!cancelled) {
          setSnapshot(dash);
          setBacklog(buildBacklog(reporting));
          setTrendData(reporting.trends);
        }
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [window]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" data-testid="dashboard-loading">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-sm text-slate-500">Loading dashboard…</span>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400" data-testid="dashboard-empty">
        No data available.
      </div>
    );
  }

  const { kpis, fleetComposition, safetyTrend, recentActivity } = snapshot;

  const fleetPieData = [
    { name: 'Active', value: fleetComposition.active },
    { name: 'Maintenance', value: fleetComposition.maintenance },
    { name: 'Out of Service', value: fleetComposition.outOfService },
    { name: 'Other', value: Math.max(0, fleetComposition.total - fleetComposition.active - fleetComposition.maintenance - fleetComposition.outOfService) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Operations Pulse</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live fleet safety health and operational metrics &mdash; last refreshed{' '}
              {new Date(snapshot.generatedAt).toLocaleTimeString()}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Live Board
            </div>
            <select
              value={window}
              onChange={(e) => setWindow(e.target.value as ReportingWindow)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="365d">Last 12 Months</option>
            </select>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card: DashboardKpiCard) => {
          const Icon = KPI_ICON_MAP[card.key] || Activity;
          const colors = KPI_COLOR_MAP[card.key] || KPI_COLOR_MAP.fleet_completion;
          const iconClass = colors[card.status];
          const trendPositive = card.status === 'good';

          return (
            <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <h3 className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</h3>
                </div>
                <div className={`rounded-xl p-2.5 ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-1.5 text-sm ${trendPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                {trendPositive ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                <span>{card.detail}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Work Orders & Training Trend */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Completed Work Orders &amp; Training</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="2 8" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Legend />
                <Bar dataKey="completedWorkOrders" name="Work Orders" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completedTraining" name="Training" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Fleet Composition Pie */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Fleet Composition</h3>
          <div className="h-80 flex items-center justify-center">
            {fleetPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine
                  >
                    {fleetPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={FLEET_COLORS[index % FLEET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">No equipment data</p>
            )}
          </div>
        </article>
      </section>

      {/* Safety trend line */}
      {safetyTrend.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Driver Risk Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safetyTrend} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="2 8" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#475569' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageRisk" name="Avg Risk Score" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="highRiskCount" name="High-Risk Drivers" stroke="#ef4444" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Backlog Prioritization */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Backlog Prioritization</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Action items ranked by operational impact score.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {backlog.length} items
          </span>
        </div>

        {backlog.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            All clear — no outstanding action items.
          </p>
        ) : (
          <div className="space-y-3">
            {backlog.map((item) => {
              const DomainIcon = DOMAIN_ICONS[item.domain] || Activity;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                >
                  <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
                    <DomainIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_CLASSES[item.severity]}`}>
                        {item.severity}
                      </span>
                      <span className="ml-auto text-xs font-mono text-slate-400">
                        Score {item.score}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700">
                      <ChevronRight className="h-3 w-3" />
                      {item.suggestedAction}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Notable Activity</h3>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((act, idx) => {
              const ActIcon = DOMAIN_ICONS[act.type] || Activity;
              return (
                <div key={idx} className="flex items-center gap-3 py-3">
                  <ActIcon className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{act.label}</p>
                    <p className="text-xs text-slate-500">{act.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
