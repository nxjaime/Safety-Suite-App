import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineSyncBanner from './OfflineSyncBanner';

const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen font-body bg-slate-100 text-slate-900">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64">
                <Header />
                <main className="p-4 sm:p-6 md:p-8 pt-24 md:pt-24 overflow-x-hidden">
                    <OfflineSyncBanner />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
