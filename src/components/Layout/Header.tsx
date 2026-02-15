import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // Derived user state
    const displayUser = {
        name: user?.user_metadata?.full_name || user?.email || 'User',
        title: user?.user_metadata?.title || 'Safety Manager',
        avatarUrl: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/') return { title: 'Dashboard', path: 'Overview > Dashboard' };
        if (path.startsWith('/drivers')) return path.includes('/') && path.split('/').length > 2
            ? { title: 'Driver Profile', path: 'Drivers > Profile' }
            : { title: 'Drivers', path: 'Reporting > Drivers' };
        if (path.startsWith('/watchlist')) return { title: 'Watch List', path: 'Reporting > Watch List' };
        if (path.startsWith('/tasks')) return { title: 'Tasks', path: 'Reporting > Tasks' };
        if (path.startsWith('/safety')) return { title: 'Safety & Risk', path: 'Reporting > Safety' };
        if (path.startsWith('/training')) return { title: 'Training', path: 'Reporting > Training' };
        if (path.startsWith('/compliance')) return { title: 'Compliance', path: 'Reporting > Compliance' };
        if (path.startsWith('/equipment')) return { title: 'Equipment', path: 'Reporting > Equipment' };
        if (path.startsWith('/reporting')) return { title: 'Reporting', path: 'Reporting > Analytics' };
        if (path.startsWith('/documents')) return { title: 'Document Library', path: 'Reporting > Documents' };
        if (path.startsWith('/fmcsa')) return { title: 'FMCSA Regulations', path: 'Resources > FMCSA' };
        if (path.startsWith('/settings')) return { title: 'Settings', path: 'Reporting > Settings' };
        if (path.startsWith('/profile')) return { title: 'My Profile', path: 'Account > Profile' };

        return { title: 'Page', path: 'Reporting > Page' };
    };

    const { title, path } = getBreadcrumbs();

    const getHeaderClass = () => {
        switch (theme) {
            case 'teal': return 'bg-gradient-to-r from-teal-600 to-teal-500';
            case 'slate': return 'bg-gradient-to-r from-slate-800 to-slate-700';
            case 'blue': return 'bg-gradient-to-r from-blue-600 to-blue-500';
            case 'dark': return 'bg-gray-900 border-b border-gray-800';
            default: return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
        }
    };

    return (
        <header className={`h-16 ${getHeaderClass()} text-white flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10 shadow-md transition-colors duration-300`}>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold">{title}</h1>
                <span className="mx-2 text-white/50">/</span>
                <span className="text-sm text-white/70">{path}</span>
            </div>

            {/* Theme Switcher - Temporary */}
            <div className="flex items-center space-x-2 mr-4 bg-white/10 px-3 py-1 rounded-full">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">Theme:</span>
                <button
                    onClick={() => setTheme('emerald')}
                    className={`w-4 h-4 rounded-full bg-emerald-500 ring-2 ${theme === 'emerald' ? 'ring-white' : 'ring-transparent'}`}
                    title="Emerald"
                />
                <button
                    onClick={() => setTheme('teal')}
                    className={`w-4 h-4 rounded-full bg-teal-500 ring-2 ${theme === 'teal' ? 'ring-white' : 'ring-transparent'}`}
                    title="Teal"
                />
                <button
                    onClick={() => setTheme('slate')}
                    className={`w-4 h-4 rounded-full bg-slate-700 ring-2 ${theme === 'slate' ? 'ring-white' : 'ring-transparent'}`}
                    title="Slate"
                />
                <button
                    onClick={() => setTheme('blue')}
                    className={`w-4 h-4 rounded-full bg-blue-500 ring-2 ${theme === 'blue' ? 'ring-white' : 'ring-transparent'}`}
                    title="Blue"
                />
                <button
                    onClick={() => setTheme('dark')}
                    className={`w-4 h-4 rounded-full bg-gray-900 ring-2 ${theme === 'dark' ? 'ring-white' : 'ring-transparent'}`}
                    title="Dark Mode"
                />
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-white text-gray-800 pl-10 pr-4 py-1.5 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <button className="p-2 hover:bg-green-600 rounded-full relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-green-700"></span>
                </button>

                <div
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 pl-4 border-l border-green-600 cursor-pointer hover:bg-green-600 p-2 rounded-md transition-colors"
                >
                    <img
                        src={displayUser.avatarUrl}
                        alt="User"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                    <div className="text-sm hidden md:block">
                        <div className="font-medium">{displayUser.name}</div>
                        <div className="text-xs text-blue-200">{displayUser.title}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
