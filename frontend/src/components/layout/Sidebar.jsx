import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Database,
  History,
  CheckCircle2,
  AlertTriangle,
  FileBarChart,
  ClipboardList,
  Users,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Servers', path: '/servers', icon: Server },
    { name: 'Backup Jobs', path: '/jobs', icon: Database },
    { name: 'Backup Runs', path: '/runs', icon: History },
    { name: 'Verification', path: '/verifications', icon: CheckCircle2 },
    { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
  ];

  if (user?.role === 'ADMINISTRATOR') {
    navItems.push({ name: 'User Management', path: '/users', icon: Users });
  }

  navItems.push({ name: 'Settings', path: '/settings', icon: Settings });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="p-2 bg-sky-600 rounded-lg text-white shadow-lg shadow-sky-600/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">
            ODRI GUARDIAN
          </h1>
          <p className="text-xs text-sky-400 font-medium">Backup Monitoring</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">System Protection</p>
            <p className="text-slate-400">Monitoring Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
