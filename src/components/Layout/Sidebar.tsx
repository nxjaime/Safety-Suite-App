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
    Settings
} from 'lucide-react';
import clsx from 'clsx';
import CarrierHealthWidget from './CarrierHealthWidget';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Safety & Risk', path: '/safety', icon: ShieldAlert },
    { name: 'Training', path: '/training', icon: GraduationCap },
    { name: 'Compliance', path: '/compliance', icon: FileText },
    { name: 'Equipment', path: '/equipment', icon: Truck },
    { name: 'Reporting', path: '/reporting', icon: BarChart2 },
    { name: 'Document Library', path: '/documents', icon: Files },
    { name: 'Regulations', path: '/fmcsa', icon: BookOpen },
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
                <ul className="space-y-1">
                    {navItems.map((item) => (
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

