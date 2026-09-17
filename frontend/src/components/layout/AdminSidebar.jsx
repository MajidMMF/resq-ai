import React from "react";
import { Link, useLocation } from "react-router-dom";
import ResQLogo from "../shared/ResQLogo";
import useAuth from "../../hooks/useAuth";
import {
  ShieldAlert,
  Activity,
  Truck,
  Hospital,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Radio,
  FileSpreadsheet,
} from "lucide-react";

export const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Operations Command",
      path: "/admin",
      icon: Activity,
      exact: true,
    },
    {
      label: "Fleet Approvals & Units",
      path: "/admin/ambulances",
      icon: Truck,
    },
    {
      label: "Hospital Facilities",
      path: "/admin/hospitals",
      icon: Hospital,
    },
    {
      label: "Incident Logs & Audits",
      path: "/admin/incidents",
      icon: ShieldAlert,
    },
    {
      label: "System Metrics & Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="w-64 bg-dark-950 border-r border-dark-800 flex flex-col justify-between hidden lg:flex select-none z-20">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-6 border-b border-dark-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
            🛡️
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              ResQ Ops Command
            </span>
            <span className="text-[10px] font-mono text-dark-400 block">
              National Dispatch Center
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  active
                    ? "bg-dark-800 text-white border border-dark-700 shadow-sm"
                    : "text-dark-400 hover:text-white hover:bg-dark-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    active
                      ? "text-purple-400"
                      : "text-dark-400 group-hover:text-white"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Operator Credentials Footer */}
      <div className="p-4 border-t border-dark-800 space-y-3">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400 font-mono">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {user?.name || "Operations Admin"}
            </span>
            <span className="text-[10px] text-purple-400 font-mono block truncate">
              SUPER_ADMIN_2FA_VERIFIED
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-emergency-400 transition active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

