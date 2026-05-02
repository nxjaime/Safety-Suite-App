import React, { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationPanel from '../NotificationPanel';
import { formatBadgeCount } from '../../services/notificationService';
import SearchPanel from '../SearchPanel';

const Header: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [profileState, setProfileState] = useState({
        name: user?.email || 'User',
        title: '',
        avatarUrl: '',
    });
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const [panelOpen, setPanelOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Load profile from Supabase and refresh on profile updates
    useEffect(() => {
        let cancelled = false;

        const loadProfile = () => {
            profileService.getExtendedProfile().then((profile) => {
                if (cancelled || !profile) return;
                setProfileState({
                    name: profile.fullName || profile.email || 'User',
                    title: profile.title,
                    avatarUrl: profile.avatarUrl,
                });
            }).catch(() => {/* silently degrade */});
        };

        loadProfile();

        window.addEventListener('userProfileUpdated', loadProfile);
        return () => {
            cancelled = true;
            window.removeEventListener('userProfileUpdated', loadProfile);
        };
    }, [user]);

    // Cmd/Ctrl+K global shortcut to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        if (path.startsWith('/reporting/hypercare')) return { title: 'Hypercare', path: 'Reporting > Hypercare' };
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
        <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 fixed top-0 left-0 md:left-64 right-0 z-10">
            <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-semibold text-slate-900">{title}</h1>
                <span className="text-xs md:text-sm text-slate-500">{path}</span>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="relative flex items-center bg-slate-100 hover:bg-slate-200 text-slate-500 pl-9 pr-4 py-2 rounded-full text-sm transition-colors w-52"
                    aria-label="Search (Ctrl+K)"
                    title="Search (⌘K)"
                >
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <span className="text-slate-400">Search…</span>
                    <kbd className="ml-auto text-[10px] font-mono bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>
                <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

                <div className="relative">
                    <button
                        className="p-2 hover:bg-slate-100 rounded-full relative text-slate-600 transition-colors"
                        aria-label="Notifications"
                        onClick={() => setPanelOpen((prev) => !prev)}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full border-2 border-white flex items-center justify-center px-0.5">
                                {formatBadgeCount(unreadCount)}
                            </span>
                        )}
                    </button>
                    <NotificationPanel
                        isOpen={panelOpen}
                        onClose={() => setPanelOpen(false)}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={markAllRead}
                    />
                </div>

                <div
                    onClick={handleSignOut}
                    onKeyDown={handleSignOutKey}
                    className="flex items-center space-x-2 pl-4 border-l border-slate-200 cursor-pointer hover:bg-slate-100 p-2 rounded-md transition-colors"
                    role="button"
                    tabIndex={0}
                    aria-label="Sign out"
                >
                    {profileState.avatarUrl ? (
                        <img
                            src={profileState.avatarUrl}
                            alt="User"
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        />
                    ) : (
                        <div
                            data-testid="avatar-fallback"
                            className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center"
                        >
                            <User className="w-4 h-4 text-slate-500" />
                        </div>
                    )}
                    <div className="text-sm hidden md:block">
                        <div className="font-medium text-slate-900">{profileState.name}</div>
                        <div className="text-xs text-slate-500">{profileState.title}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
