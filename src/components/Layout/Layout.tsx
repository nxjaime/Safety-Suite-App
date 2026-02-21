import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    const [theme, setTheme] = React.useState('emerald');
    const isDark = theme === 'dark';

    return (
        <div
            className={`flex min-h-screen font-body transition-colors duration-300 ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}
        >
            <Sidebar theme={theme} />
            <div className="flex-1 ml-64">
                <Header theme={theme} setTheme={setTheme} />
                <main className="pt-16 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
