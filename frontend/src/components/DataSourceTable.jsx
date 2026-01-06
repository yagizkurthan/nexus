import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';

const DataSourceTable = () => {
    const dataSources = [
        { id: 1, name: 'Salesforce CRM', type: 'CRM', status: 'Active', lastSync: 'Today, 10:45 AM' },
        { id: 2, name: 'Snowflake Data Warehouse', type: 'Database', status: 'Active', lastSync: 'Yesterday, 5:30 PM' },
        { id: 3, name: 'Google Sheets - Q3 Financials', type: 'Spreadsheet', status: 'Inactive', lastSync: 'Never' },
    ];

    return (
        <div className="glass-card p-6 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <svg
                            className="w-6 h-6 text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Data Source Management</h2>
                </div>
                <button className="glass-button bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-100">
                    Add New Connection <Plus size={16} />
                </button>
            </div>

            <div className="w-full overflow-hidden rounded-lg border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-sm">
                            <th className="p-4 font-medium">Source Name</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Last Sync</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {dataSources.map((source) => (
                            <tr key={source.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-white font-medium">{source.name}</td>
                                <td className="p-4 text-gray-400">{source.type}</td>
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${source.status === 'Active'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}
                                    >
                                        {source.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">{source.lastSync}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataSourceTable;
