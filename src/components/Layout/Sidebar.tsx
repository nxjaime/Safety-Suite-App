import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    ShieldAlert,
    GraduationCap,
    FileText,
    Truck,
    Wrench,
    BarChart2,
    Files,
    BookOpen,
    Settings,
    ClipboardList,
    Route,
    Map
} from 'lucide-react';
import clsx from 'clsx';
import CarrierHealthWidget from './CarrierHealthWidget';
import { useAuth } from '../../contexts/AuthContext';

type NavLinkItem = {
    type: 'link';
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
};

type NavSubheader = {
    type: 'subheader';
    name: string;
};

type NavItem = NavLinkItem | NavSubheader;

export const navSections: Array<{ label: string; items: NavItem[] }> = [
    {
        label: 'Operations',
        items: [
            { type: 'link', name: 'Status Board', path: '/', icon: LayoutDashboard },
            { type: 'link', name: 'Tasks', path: '/tasks', icon: CheckSquare },
            { type: 'link', name: 'Orders', path: '/operations/orders', icon: ClipboardList, disabled: true },
            { type: 'link', name: 'Dispatch', path: '/operations/dispatch', icon: Route, disabled: true },
            { type: 'link', name: 'Routes', path: '/operations/routes', icon: Map, disabled: true },
            { type: 'subheader', name: 'Fleet' },
            { type: 'link', name: 'Equipment', path: '/equipment', icon: Truck },
            { type: 'link', name: 'Maintenance', path: '/maintenance', icon: Wrench },
            { type: 'link', name: 'Work Orders', path: '/work-orders', icon: ClipboardList },
            { type: 'link', name: 'Documents', path: '/documents', icon: Files },
        ],
    },
    {
        label: 'Safety',
        items: [
            { type: 'link', name: 'Drivers', path: '/drivers', icon: Users },
            { type: 'link', name: 'Risk & Coaching', path: '/safety', icon: ShieldAlert },
            { type: 'link', name: 'Compliance', path: '/compliance', icon: FileText },
            { type: 'link', name: 'Training', path: '/training', icon: GraduationCap },
            { type: 'link', name: 'Regulations', path: '/fmcsa', icon: BookOpen },
        ],
    },
    {
        label: 'Reporting',
        items: [
            { type: 'link', name: 'Analytics', path: '/reporting', icon: BarChart2 },
            { type: 'link', name: 'CSA Predictor', path: '/reporting/csa-predictor', icon: BarChart2 },
            { type: 'link', name: 'Help & Feedback', path: '/help', icon: BookOpen },
        ],
    },
];

const Sidebar: React.FC = () => {
    const { isAdmin } = useAuth();

    return (
        <div className="w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-[4px_0_24px_rgba(15,23,42,0.25)] border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
                <img src="/logo.png" alt="SafetyHub Logo" className="w-8 h-8 object-contain" />
                <div className="font-bold text-lg tracking-tight">
                    <span className="text-white">SafetyHub</span> <span className="font-light text-slate-300">Connect</span>
                </div>
            </div>

            <nav className="flex-1 py-4">
                <ul className="space-y-4">
                    {navSections.map((section) => (
                        <li key={section.label}>
                            <div className="px-4 text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-2">
                                {section.label}
                            </div>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    if (item.type === 'subheader') {
                                        return (
                                            <li key={item.name} className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                                                {item.name}
                                            </li>
                                        );
                                    }

                                    if (item.disabled) {
                                        return (
                                            <li key={item.name}>
                                                <div
                                                    className="flex items-center px-4 py-3 text-sm font-medium text-white/40 cursor-not-allowed"
                                                    aria-disabled="true"
                                                    title="Coming soon"
                                                >
                                                    <item.icon className="w-5 h-5 mr-3 opacity-60" />
                                                    {item.name}
                                                </div>
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={item.name}>
                                            <NavLink
                                                to={item.path}
                                                className={({ isActive }) =>
                                                    clsx(
                                                        'flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-r-xl mr-2',
                                                        isActive
                                                            ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400'
                                                            : 'text-slate-200 hover:bg-slate-800/80 border-l-2 border-transparent hover:text-white'
                                                    )
                                                }
                                            >
                                                <item.icon className="w-5 h-5 mr-3" />
                                                {item.name}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    ))}
                    {isAdmin && (
                        <li>
                            <div className="px-4 text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-2">
                                Administration
                            </div>
                            <ul className="space-y-1">
                                <li>
                                    <NavLink
                                        to="/admin"
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-r-xl mr-2',
                                                isActive
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400'
                                                    : 'text-slate-200 hover:bg-slate-800/80 border-l-2 border-transparent hover:text-white'
                                            )
                                        }
                                    >
                                        <ShieldAlert className="w-5 h-5 mr-3" />
                                        Admin Dashboard
                                    </NavLink>
                                </li>
                            </ul>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Carrier Health Section */}
            <div className="border-t border-slate-800">
                <CarrierHealthWidget />
            </div>

            <div className="p-4 border-t border-slate-800">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'block w-full flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                            isActive
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        )
                    }
                >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                </NavLink>
            </div>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
                &copy; 2026 SafetyHub Connect
            </div>
        </div>
    );
};

export default Sidebar;
