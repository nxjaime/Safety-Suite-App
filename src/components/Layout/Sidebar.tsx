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

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Safety & Risk', path: '/safety', icon: ShieldAlert },
    { name: 'Training', path: '/training', icon: GraduationCap },
    { name: 'Compliance', path: '/compliance', icon: FileText },
    { name: 'Equipment', path: '/equipment', icon: Truck },
    { name: 'Reporting', path: '/safeview', icon: BarChart2 },
    { name: 'Document Library', path: '/documents', icon: Files },
    { name: 'Regulations', path: '/fmcsa', icon: BookOpen },
];

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-xl">
            <div className="p-4 border-b border-green-800 flex items-center space-x-2">
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
                                            ? 'bg-green-800 border-l-4 border-green-400'
                                            : 'hover:bg-green-800 border-l-4 border-transparent'
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

            <div className="p-4 border-t border-green-800">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'block w-full flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md',
                            isActive
                                ? 'bg-green-800 text-white'
                                : 'text-green-100 hover:bg-green-800 hover:text-white'
                        )
                    }
                >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                </NavLink>
            </div>

            <div className="p-4 border-t border-green-800 text-xs text-green-300">
                &copy; 2025 SafetyHub Connect, Inc.
            </div>
        </div>
    );
};

export default Sidebar;
