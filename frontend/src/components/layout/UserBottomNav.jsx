import React from "react";
import { NavLink } from "react-router-dom";
import { Home, AlertTriangle, Clock, Bell, User } from "lucide-react";

const MOBILE_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/history", label: "History", icon: Clock },
  { path: "/report", label: "Report", icon: AlertTriangle, central: true },
  { path: "/notifications", label: "Alerts", icon: Bell },
  { path: "/profile", label: "Profile", icon: User },
];

export const UserBottomNav = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/90 backdrop-blur-lg border-t border-dark-800/80 px-3 py-2 select-none">
      <div className="flex items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.central) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -top-5 flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-emergency-600 hover:bg-emergency-500 border-4 border-dark-950 text-white flex items-center justify-center shadow-lg shadow-emergency-600/40 active:scale-95 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emergency-400 mt-0.5">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-lg transition ${
                  isActive ? "text-cyan-400 font-bold" : "text-dark-400 hover:text-slate-200"
                }`
              }
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default UserBottomNav;

