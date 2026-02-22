import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart2,
    BookOpen,
    CheckSquare,
    ChevronDown,
    ClipboardList,
    Files,
    GraduationCap,
    LayoutDashboard,
    Map,
    Route,
    Settings,
    ShieldAlert,
    Truck,
    Users,
    Wrench
} from 'lucide-react';
import clsx from 'clsx';
import CarrierHealthWidget from './CarrierHealthWidget';
import { useAuth } from '../../contexts/AuthContext';

type LinkItem = {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
};

type LegacyNavLinkItem = {
    type: 'link';
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
};

type LegacyNavSubheader = {
    type: 'subheader';
    name: string;
};

type LegacyNavItem = LegacyNavLinkItem | LegacyNavSubheader;

export const navSections: Array<{ label: string; items: LegacyNavItem[] }> = [
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
            { type: 'link', name: 'Documents', path: '/documents', icon: Files }
        ]
    },
    {
        label: 'Safety',
        items: [
            { type: 'link', name: 'Drivers', path: '/drivers', icon: Users },
            { type: 'link', name: 'Risk & Coaching', path: '/safety', icon: ShieldAlert },
            { type: 'link', name: 'Compliance', path: '/compliance', icon: Files },
            { type: 'link', name: 'Training', path: '/training', icon: GraduationCap },
            { type: 'link', name: 'Regulations', path: '/fmcsa', icon: BookOpen }
        ]
    },
    {
        label: 'Reporting',
        items: [
            { type: 'link', name: 'Analytics', path: '/reporting', icon: BarChart2 },
            { type: 'link', name: 'CSA Predictor', path: '/reporting/csa-predictor', icon: BarChart2 },
            { type: 'link', name: 'Help & Feedback', path: '/help', icon: BookOpen }
        ]
    }
];

type MenuGroup = {
    id: string;
    label: string;
    items: LinkItem[];
};

const menuGroups: MenuGroup[] = [
    {
        id: 'quick',
        label: 'Quick Actions',
        items: [
            { name: 'Status Board', path: '/', icon: LayoutDashboard },
            { name: 'Tasks', path: '/tasks', icon: CheckSquare }
        ]
    },
    {
        id: 'operations',
        label: 'Operations',
        items: [
            { name: 'Orders', path: '/operations/orders', icon: ClipboardList, disabled: true },
            { name: 'Dispatch', path: '/operations/dispatch', icon: Route, disabled: true },
            { name: 'Routes', path: '/operations/routes', icon: Map, disabled: true },
            { name: 'Equipment', path: '/equipment', icon: Truck },
            { name: 'Maintenance', path: '/maintenance', icon: Wrench },
            { name: 'Work Orders', path: '/work-orders', icon: ClipboardList },
            { name: 'Documents', path: '/documents', icon: Files }
        ]
    },
    {
        id: 'safety',
        label: 'Safety',
        items: [
            { name: 'Drivers', path: '/drivers', icon: Users },
            { name: 'Risk & Coaching', path: '/safety', icon: ShieldAlert },
            { name: 'Compliance', path: '/compliance', icon: Files },
            { name: 'Training', path: '/training', icon: GraduationCap },
            { name: 'Regulations', path: '/fmcsa', icon: BookOpen }
        ]
    },
    {
        id: 'reporting',
        label: 'Reporting',
        items: [
            { name: 'Analytics', path: '/reporting', icon: BarChart2 },
            { name: 'CSA Predictor', path: '/reporting/csa-predictor', icon: BarChart2 },
            { name: 'Help & Feedback', path: '/help', icon: BookOpen }
        ]
    }
];

const Sidebar: React.FC = () => {
    const { isAdmin } = useAuth();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        quick: true,
        operations: true,
        safety: true,
        reporting: true,
        administration: true
    });

    const visibleGroups = useMemo<MenuGroup[]>(() => {
        if (!isAdmin) return menuGroups;
        return [
            ...menuGroups,
            {
                id: 'administration',
                label: 'Administration',
                items: [{ name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert, disabled: false }]
            }
        ];
    }, [isAdmin]);

    const toggleGroup = (groupId: string) => {
        setOpenGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <div className="fixed left-0 top-0 flex h-screen w-64 flex-col overflow-y-auto border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white shadow-[4px_0_24px_rgba(15,23,42,0.25)]">
            <div className="border-b border-slate-800 p-4">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="SafetyHub Logo" className="h-8 w-8 object-contain" />
                    <div className="text-lg font-bold tracking-tight">
                        <span className="text-white">SafetyHub</span> <span className="font-light text-slate-300">Connect</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-3">
                <ul className="space-y-2">
                    {visibleGroups.map((group) => (
                        <li key={group.id} className="rounded-xl border border-slate-800/80 bg-slate-900/50">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left"
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{group.label}</span>
                                <ChevronDown className={clsx('h-4 w-4 text-slate-500 transition-transform', openGroups[group.id] ? 'rotate-180' : '')} />
                            </button>

                            {openGroups[group.id] && (
                                <ul className="space-y-1 px-1 pb-2">
                                    {group.items.map((item) => {
                                        if (item.disabled) {
                                            return (
                                                <li key={item.name}>
                                                    <div className="flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm font-medium text-white/40" aria-disabled="true" title="Coming soon">
                                                        <item.icon className="mr-3 h-4 w-4 opacity-60" />
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
                                                            'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                            isActive
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                                                        )
                                                    }
                                                >
                                                    <item.icon className="mr-3 h-4 w-4" />
                                                    {item.name}
                                                </NavLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="border-t border-slate-800">
                <CarrierHealthWidget />
            </div>

            <div className="border-t border-slate-800 p-4">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        )
                    }
                >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                </NavLink>
            </div>

            <div className="border-t border-slate-800 p-4 text-xs text-slate-400">&copy; 2026 SafetyHub Connect</div>
        </div>
    );
};

export default Sidebar;
