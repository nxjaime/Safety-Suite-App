import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <Sidebar />
            <div className="flex-1 mr-64">
                <Header />
                <main className="pt-16 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
