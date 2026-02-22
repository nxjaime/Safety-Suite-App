import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowDownRight, ArrowUpRight, Activity, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getBand } from '../services/riskService';

const Safety: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [riskAverage, setRiskAverage] = useState(0);
    const [incidentCount, setIncidentCount] = useState(0);
    const [coachingCount, setCoachingCount] = useState(0);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                // Avg risk score across drivers
                const { data: drivers, error: dErr } = await supabase.from('drivers').select('risk_score');
                if (dErr) throw dErr;
                const scores = (drivers || []).map((d: any) => d.risk_score || 60);
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 60;
                setRiskAverage(avg);

                // Risk events last 90 days
                const since = new Date();
                since.setDate(since.getDate() - 90);
                const { count: incidents, error: iErr } = await supabase
                    .from('risk_events')
                    .select('*', { count: 'exact', head: true })
                    .gte('occurred_at', since.toISOString());
                if (iErr) throw iErr;
                setIncidentCount(incidents || 0);

                // Active coaching plans
                const { count: coaching, error: cErr } = await supabase
                    .from('coaching_plans')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Active');
                if (cErr) throw cErr;
                setCoachingCount(coaching || 0);

                // Score history (latest 12 entries overall)
                const { data: scoresHist, error: hErr } = await supabase
                    .from('driver_risk_scores')
                    .select('score, as_of')
                    .order('as_of', { ascending: false })
                    .limit(12);
                if (hErr) throw hErr;
                const hist = (scoresHist || []).map((row: any) => ({
                    date: new Date(row.as_of).toLocaleDateString(),
                    score: row.score,
                })).reverse();
                setHistory(hist);
            } catch (err) {
                console.error('Failed to load safety dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const band = getBand(riskAverage);
    const bandColor = band === 'red' ? 'text-red-600 bg-red-100' : band === 'yellow' ? 'text-amber-700 bg-amber-100' : 'text-green-700 bg-green-100';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Fleet Risk Score (avg)</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-3xl font-bold px-3 py-1 rounded-full ${bandColor}`}>{loading ? '...' : riskAverage}</span>
                        {band === 'green' ? <ArrowDownRight className="text-green-600" /> : band === 'yellow' ? <Activity className="text-amber-600" /> : <ArrowUpRight className="text-red-600" />}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Incidents (90d)</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-3xl font-bold text-slate-900">{loading ? '...' : incidentCount}</span>
                        <Users className="text-slate-400" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Active Coaching Plans</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-3xl font-bold text-slate-900">{loading ? '...' : coachingCount}</span>
                        <Activity className="text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Risk Score Trend</h3>
                        <p className="text-sm text-slate-500">Last 12 score calculations</p>
                    </div>
                </div>
                {history.length === 0 ? (
                    <p className="text-sm text-slate-500">No score history yet.</p>
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="riskColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" hide />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="score" stroke="#059669" fillOpacity={1} fill="url(#riskColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Safety;
