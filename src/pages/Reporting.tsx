import React from 'react';
import { BarChart2, PieChart, TrendingUp, Download } from 'lucide-react';

const Reporting: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Reporting & Analytics</h2>
                <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white">
                        <option>Last 12 Months</option>
                        <option>YTD</option>
                        <option>Last Quarter</option>
                    </select>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-green-100 rounded-full mb-4 border border-green-200">
                        <BarChart2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Advanced Accident Analytics</h3>
                    <p className="text-gray-500 mt-2 max-w-xs">Deep dive into accident trends, root causes, and preventability factors.</p>
                    <button className="mt-6 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200">
                        View Report
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-green-50 rounded-full mb-4">
                        <TrendingUp className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Driver Performance Trends</h3>
                    <p className="text-gray-500 mt-2 max-w-xs">Analyze driver behavior improvements over time and training effectiveness.</p>
                    <button className="mt-6 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200">
                        View Report
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-purple-50 rounded-full mb-4">
                        <PieChart className="w-12 h-12 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Risk Distribution Analysis</h3>
                    <p className="text-gray-500 mt-2 max-w-xs">Visualize risk distribution across terminals, regions, and driver segments.</p>
                    <button className="mt-6 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200">
                        View Report
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-orange-50 rounded-full mb-4">
                        <BarChart2 className="w-12 h-12 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">CSA Score Predictor</h3>
                    <p className="text-gray-500 mt-2 max-w-xs">Predict future CSA scores based on current inspection and violation trends.</p>
                    <button className="mt-6 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md text-sm font-medium hover:bg-green-200">
                        View Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
