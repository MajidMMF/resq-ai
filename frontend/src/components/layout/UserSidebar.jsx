import React from "react";
import { NavLink } from "react-router-dom";
import ResQLogo from "../shared/ResQLogo";
import {
  Home,
  AlertTriangle,
  Clock,
  Bell,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/report", label: "Report Emergency", icon: AlertTriangle, highlight: true },
  { path: "/history", label: "History", icon: Clock },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/profile", label: "Profile", icon: User },
];

export const UserSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-dark-950 border-r border-dark-800/80 p-5 select-none shrink-0">
      {/* Brand */}
      <div className="flex items-center space-x-3 pb-6 border-b border-dark-800/80">
        <ResQLogo className="w-8 h-8" />
        <div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-dark-200 bg-clip-text text-transparent block">
            ResQ AI
          </span>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
            Citizen Panel
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? item.highlight
                      ? "bg-emergency-600 text-white shadow-lg shadow-emergency-600/30"
                      : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold"
                    : item.highlight
                    ? "text-emergency-400 hover:bg-emergency-500/10"
                    : "text-dark-300 hover:bg-dark-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout */}
      <div className="pt-4 border-t border-dark-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || "Citizen"}</p>
            <p className="text-[10px] text-dark-400 font-mono truncate">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Logout"
          className="p-1.5 rounded-lg text-dark-400 hover:text-emergency-400 hover:bg-emergency-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;

