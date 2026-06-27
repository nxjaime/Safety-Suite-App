import React, { useState, useEffect } from 'react';
import { Bell, Menu, Search, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationPanel from '../NotificationPanel';
import { formatBadgeCount } from '../../services/notificationService';
import SearchPanel from '../SearchPanel';

type HeaderProps = {
    onMenuClick: () => void;
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
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
        if (path === '/' || path === '/dashboard') return { title: 'Status Board', path: 'Operations > Status Board' };
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
        <header className="min-h-20 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-3 px-3 py-3 sm:px-6 md:px-8 fixed top-0 left-0 md:left-64 right-0 z-10">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 md:hidden"
                    aria-label="Open navigation"
                    title="Open navigation"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div className="flex min-w-0 flex-col">
                    <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg md:text-xl">{title}</h1>
                    <span className="truncate text-[11px] text-slate-500 sm:text-xs md:text-sm">{path}</span>
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 lg:w-52 lg:justify-start lg:pl-9 lg:pr-4"
                    aria-label="Search (Ctrl+K)"
                    title="Search (⌘K)"
                >
                    <Search className="h-4 w-4 text-slate-400 lg:absolute lg:left-3 lg:top-1/2 lg:-translate-y-1/2" />
                    <span className="hidden text-sm text-slate-400 lg:inline">Search…</span>
                    <kbd className="ml-auto hidden rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 lg:inline">⌘K</kbd>
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
                    className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 cursor-pointer hover:bg-slate-100 p-2 rounded-md transition-colors"
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
                    <div className="hidden text-sm lg:block">
                        <div className="font-medium text-slate-900">{profileState.name}</div>
                        <div className="text-xs text-slate-500">{profileState.title}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
