import React from "react";
import { NavLink } from "react-router-dom";
import { Truck, Activity, Clock, User } from "lucide-react";

const AMB_MOBILE_ITEMS = [
  { path: "/ambulance", label: "Fleet", icon: Truck },
  { path: "/ambulance/active", label: "Active Run", icon: Activity },
  { path: "/ambulance/history", label: "History", icon: Clock },
  { path: "/ambulance/profile", label: "Profile", icon: User },
];

export const AmbulanceBottomNav = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-lg border-t border-dark-800/80 px-3 py-2 select-none">
      <div className="flex items-center justify-around">
        {AMB_MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 rounded-lg transition ${
                  isActive
                    ? "text-cyan-400 font-bold"
                    : "text-dark-400 hover:text-slate-200"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase font-mono">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default AmbulanceBottomNav;

