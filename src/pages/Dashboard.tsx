import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
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
    { name: 'Dec', nonPreventable: 15, preventable: 8 },
];

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Events Dashboard</h2>
                <div className="flex space-x-2">
                    <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white">
                        <option>June 2023</option>
                        <option>May 2023</option>
                        <option>April 2023</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Accidents</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">43</h3>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-500 font-medium">12%</span>
                        <span className="text-slate-400 ml-1">vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Preventable Rate</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">2.4</h3>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">5%</span>
                        <span className="text-slate-400 ml-1">vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Avg Risk Score</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">45</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full text-green-800 border border-green-200">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-400">Target: &lt; 50</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Open Tasks</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">12</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-400">3 overdue</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Accident Count by Type (12 Months)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Fixed Object', count: 253 },
                                    { name: 'Backing', count: 205 },
                                    { name: 'Sideswipe', count: 115 },
                                    { name: 'Rear Ended', count: 52 },
                                    { name: 'Jackknife', count: 16 },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Accident Count by Preventability Over Time</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={monthlyAccidents}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="nonPreventable" name="Non-Preventable" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="preventable" name="Preventable" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
