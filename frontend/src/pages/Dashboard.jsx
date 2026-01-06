import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DataSourceTable from '../components/DataSourceTable';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-transparent text-white overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full relative">
                {/* Background Glow Effects */}
                <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <Header />

                <main className="flex-1 overflow-y-auto p-8 pt-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
                                Welcome back, Admin
                            </h2>
                            <p className="text-gray-400">Here's what's happening with your agents today.</p>
                        </div>

                        <DataSourceTable />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
