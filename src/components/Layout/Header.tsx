import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
const Header: React.FC = () => {
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

    const handleSignOutKey = async (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            await handleSignOut();
        }
    };

    const getBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/') return { title: 'Status Board', path: 'Operations > Status Board' };
        if (path.startsWith('/drivers')) return path.includes('/') && path.split('/').length > 2
            ? { title: 'Driver Profile', path: 'Drivers > Profile' }
            : { title: 'Drivers', path: 'Safety > Drivers' };
        if (path.startsWith('/watchlist')) return { title: 'Watch List', path: 'Reporting > Watch List' };
        if (path.startsWith('/tasks')) return { title: 'Tasks', path: 'Operations > Tasks' };
        if (path.startsWith('/safety')) return { title: 'Risk & Coaching', path: 'Safety > Risk & Coaching' };
        if (path.startsWith('/training')) return { title: 'Training', path: 'Safety > Training' };
        if (path.startsWith('/compliance')) return { title: 'Compliance', path: 'Safety > Compliance' };
        if (path.startsWith('/equipment')) return { title: 'Equipment', path: 'Operations > Fleet > Equipment' };
        if (path.startsWith('/maintenance')) return { title: 'Maintenance', path: 'Operations > Fleet > Maintenance' };
        if (path.startsWith('/work-orders')) return { title: 'Work Orders', path: 'Operations > Fleet > Work Orders' };
        if (path.startsWith('/reporting')) return { title: 'Reporting', path: 'Reporting > Analytics' };
        if (path.startsWith('/help')) return { title: 'Help & Feedback', path: 'Reporting > Help & Feedback' };
        if (path.startsWith('/admin')) return { title: 'Admin Dashboard', path: 'Administration > Data Console' };
        if (path.startsWith('/documents')) return { title: 'Documents', path: 'Operations > Fleet > Documents' };
        if (path.startsWith('/fmcsa')) return { title: 'Regulations', path: 'Safety > Regulations' };
        if (path.startsWith('/settings')) return { title: 'Settings', path: 'Settings > System' };
        if (path.startsWith('/profile')) return { title: 'My Profile', path: 'Account > Profile' };

        return { title: 'Page', path: 'Reporting > Page' };
    };

    const { title, path } = getBreadcrumbs();

    return (
        <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 md:px-8 fixed top-0 left-64 right-0 z-10">
            <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-semibold text-slate-900">{title}</h1>
                <span className="text-xs md:text-sm text-slate-500">{path}</span>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        aria-label="Search"
                        className="bg-slate-100 text-slate-900 pl-9 pr-4 py-2 rounded-full text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
                    />
                </div>

                <button className="p-2 hover:bg-slate-100 rounded-full relative text-slate-600 transition-colors" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                <div
                    onClick={handleSignOut}
                    onKeyDown={handleSignOutKey}
                    className="flex items-center space-x-2 pl-4 border-l border-slate-200 cursor-pointer hover:bg-slate-100 p-2 rounded-md transition-colors"
                    role="button"
                    tabIndex={0}
                    aria-label="Sign out"
                >
                    <img
                        src={displayUser.avatarUrl}
                        alt="User"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                    <div className="text-sm hidden md:block">
                        <div className="font-medium text-slate-900">{displayUser.name}</div>
                        <div className="text-xs text-slate-500">{displayUser.title}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
