import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineSyncBanner from './OfflineSyncBanner';

const Layout: React.FC = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="flex min-h-screen font-body bg-slate-100 text-slate-900">
            <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
            <div className="min-w-0 flex-1 ml-0 md:ml-64">
                <Header onMenuClick={() => setMobileNavOpen(true)} />
                <main className="min-w-0 overflow-x-hidden p-4 sm:p-5 md:p-8 pt-28 sm:pt-24 md:pt-24">
                    <OfflineSyncBanner />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
