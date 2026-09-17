import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Bed, History, Settings } from "lucide-react";

export const HospitalBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: "Radar", path: "/hospital", icon: Activity, exact: true },
    { label: "Beds", path: "/hospital/capacity", icon: Bed },
    { label: "History", path: "/hospital/history", icon: History },
    { label: "Settings", path: "/hospital/settings", icon: Settings },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-dark-950/90 backdrop-blur-md border-t border-dark-800 flex items-center justify-around z-40 px-2 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-16 py-1 text-[10px] font-medium transition ${
              active ? "text-emergency-500" : "text-dark-400 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default HospitalBottomNav;

