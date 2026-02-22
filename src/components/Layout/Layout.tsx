import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen font-body bg-slate-100 text-slate-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="pt-24 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
