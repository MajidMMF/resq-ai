import React from "react";
import { Link } from "react-router-dom";
import ResQLogo from "../shared/ResQLogo";
import LiveIndicator from "../shared/LiveIndicator";
import { Bell } from "lucide-react";
import { useGetUnreadCountQuery } from "../../features/notifications/notificationsApi";
import useAuth from "../../hooks/useAuth";

export const UserTopbar = () => {
  const { user } = useAuth();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 15000,
  });

  const unreadCount = countData?.data?.count || 0;

  return (
    <header className="h-16 border-b border-dark-800/80 bg-dark-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Mobile Brand */}
      <div className="flex items-center space-x-2.5 lg:hidden">
        <ResQLogo className="w-7 h-7" />
        <span className="font-extrabold text-sm tracking-tight text-white">ResQ AI</span>
      </div>

      {/* GPS Telemetry Indicator */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900 border border-dark-700/60">
        <LiveIndicator color="cyan" label="LIVE GPS" />
        <span className="text-[10px] font-mono text-dark-400">±1.5m active</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl bg-dark-800/60 hover:bg-dark-700/80 border border-dark-700/60 text-dark-300 hover:text-white transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emergency-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Mini Avatar */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-dark-800/60 transition"
        >
          <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-xs font-bold text-cyan-400">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <span className="hidden md:inline text-xs font-semibold text-slate-200">
            {user?.name?.split(" ")[0] || "User"}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default UserTopbar;

