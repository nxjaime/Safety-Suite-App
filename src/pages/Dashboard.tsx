import React from 'react';
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
  Line
} from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, Activity, CheckSquare } from 'lucide-react';

const monthlyAccidents = [
  { name: 'Jan', nonPreventable: 12, preventable: 8 },
  { name: 'Feb', nonPreventable: 15, preventable: 10 },
  { name: 'Mar', nonPreventable: 18, preventable: 12 },
  { name: 'Apr', nonPreventable: 14, preventable: 9 },
  { name: 'May', nonPreventable: 20, preventable: 15 },
  { name: 'Jun', nonPreventable: 25, preventable: 18 },
  { name: 'Jul', nonPreventable: 22, preventable: 14 },
  { name: 'Aug', nonPreventable: 30, preventable: 20 },
  { name: 'Sep', nonPreventable: 28, preventable: 16 },
  { name: 'Oct', nonPreventable: 24, preventable: 12 },
  { name: 'Nov', nonPreventable: 18, preventable: 10 },
  { name: 'Dec', nonPreventable: 15, preventable: 8 }
];

const accidentTypes = [
  { name: 'Fixed Object', count: 253 },
  { name: 'Backing', count: 205 },
  { name: 'Sideswipe', count: 115 },
  { name: 'Rear Ended', count: 52 },
  { name: 'Jackknife', count: 16 }
];

const statCards = [
  {
    label: 'Total Accidents',
    value: '43',
    trend: '12% vs last month',
    trendUp: true,
    icon: AlertCircle,
    iconClass: 'text-rose-600 bg-rose-100',
    trendClass: 'text-rose-600'
  },
  {
    label: 'Preventable Rate',
    value: '2.4',
    trend: '5% improvement',
    trendUp: false,
    icon: Activity,
    iconClass: 'text-amber-600 bg-amber-100',
    trendClass: 'text-emerald-600'
  },
  {
    label: 'Avg Risk Score',
    value: '45',
    trend: 'Target < 50',
    trendUp: false,
    icon: Activity,
    iconClass: 'text-emerald-700 bg-emerald-100',
    trendClass: 'text-slate-500'
  },
  {
    label: 'Open Tasks',
    value: '12',
    trend: '3 overdue',
    trendUp: false,
    icon: CheckSquare,
    iconClass: 'text-sky-700 bg-sky-100',
    trendClass: 'text-slate-500'
  }
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Operations Pulse</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fleet safety health and event trends across the last 12 months.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Live Board
            </div>
            <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>June 2023</option>
              <option>May 2023</option>
              <option>April 2023</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <h3 className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</h3>
                </div>
                <div className={`rounded-xl p-2.5 ${card.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-1.5 text-sm ${card.trendClass}`}>
                {card.trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{card.trend}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Accident Count by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accidentTypes} margin={{ top: 12, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="2 8" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} interval={0} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Preventable vs Non-Preventable Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAccidents} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="2 8" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nonPreventable" name="Non-Preventable" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="preventable" name="Preventable" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
