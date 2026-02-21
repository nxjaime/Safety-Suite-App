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
        ],
    },
];

interface SidebarProps {
    theme: string;
}

const Sidebar: React.FC<SidebarProps> = ({ theme }) => {
    const getThemeStyles = () => {
        switch (theme) {
            case 'teal':
                return {
                    wrapper: 'from-teal-600 via-teal-700 to-teal-800 border-teal-500/30',
                    border: 'border-teal-500/30',
                    active: 'bg-teal-700 border-l-4 border-white shadow-lg',
                    hover: 'hover:bg-teal-700/50',
                    text: 'text-teal-50',
                    textHover: 'text-teal-50 hover:bg-teal-600/50 hover:text-white',
                    activeText: 'bg-teal-700 text-white shadow-md'
                };
            case 'slate':
                return {
                    wrapper: 'from-slate-800 via-slate-900 to-black border-slate-600/30',
                    border: 'border-slate-600/30',
                    active: 'bg-slate-700 border-l-4 border-white shadow-lg',
                    hover: 'hover:bg-slate-700/50',
                    text: 'text-slate-300',
                    textHover: 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    activeText: 'bg-slate-700 text-white shadow-md'
                };
            case 'blue':
                return {
                    wrapper: 'from-blue-600 via-blue-700 to-blue-800 border-blue-500/30',
                    border: 'border-blue-500/30',
                    active: 'bg-blue-700 border-l-4 border-white shadow-lg',
                    hover: 'hover:bg-blue-700/50',
                    text: 'text-blue-50',
                    textHover: 'text-blue-50 hover:bg-blue-600/50 hover:text-white',
                    activeText: 'bg-blue-700 text-white shadow-md'
                };
            case 'dark':
                return {
                    wrapper: 'from-gray-900 via-gray-800 to-black border-gray-700',
                    border: 'border-gray-700',
                    active: 'bg-gray-800 border-l-4 border-white shadow-lg',
                    hover: 'hover:bg-gray-800/50',
                    text: 'text-gray-300',
                    textHover: 'text-gray-300 hover:bg-gray-800/50 hover:text-white',
                    activeText: 'bg-gray-800 text-white shadow-md'
                };
            default: // emerald
                return {
                    wrapper: 'from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-400/30',
                    border: 'border-emerald-400/30',
                    active: 'bg-emerald-600 border-l-4 border-white shadow-lg',
                    hover: 'hover:bg-emerald-600/50',
                    text: 'text-emerald-50',
                    textHover: 'text-emerald-50 hover:bg-emerald-600/50 hover:text-white',
                    activeText: 'bg-emerald-600 text-white shadow-md'
                };
        }
    };

    const styles = getThemeStyles();

    return (
        <div className={`w-64 bg-gradient-to-b ${styles.wrapper} text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r transition-colors duration-300`}>
            <div className={`p-4 border-b ${styles.border} flex items-center space-x-2`}>
                <img src="/logo.png" alt="SafetyHub Logo" className="w-8 h-8 object-contain" />
                <div className="font-bold text-xl tracking-tight">
                    <span className="text-white">SAFETYHUB</span> <span className="font-light">CONNECT</span>
                </div>
            </div>

            <nav className="flex-1 py-4">
                <ul className="space-y-4">
                    {navSections.map((section) => (
                        <li key={section.label}>
                            <div className="px-4 text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">
                                {section.label}
                            </div>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    if (item.type === 'subheader') {
                                        return (
                                            <li key={item.name} className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-white/40">
                                                {item.name}
                                            </li>
                                        );
                                    }

                                    if (item.disabled) {
                                        return (
                                            <li key={item.name}>
                                                <div className="flex items-center px-4 py-3 text-sm font-medium text-white/40 cursor-not-allowed">
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
                                                        'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                                                        isActive
                                                            ? styles.active
                                                            : `${styles.hover} border-l-4 border-transparent`
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
                </ul>
            </nav>

            {/* Carrier Health Section */}
            <div className={`border-t ${styles.border}`}>
                <CarrierHealthWidget />
            </div>

            <div className={`p-4 border-t ${styles.border}`}>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'block w-full flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md',
                            isActive
                                ? styles.activeText
                                : styles.textHover
                        )
                    }
                >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                </NavLink>
            </div>

            <div className={`p-4 border-t ${styles.border} text-xs ${styles.text}`}>
                &copy; 2025 SafetyHub Connect, Inc.
            </div>
        </div>
    );
};

export default Sidebar;
