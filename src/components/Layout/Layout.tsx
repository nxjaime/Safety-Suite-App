import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    const [theme, setTheme] = React.useState('emerald');

    return (
        <div className={`flex min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
