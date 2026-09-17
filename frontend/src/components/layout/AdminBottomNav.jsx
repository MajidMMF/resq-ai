import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Truck, Hospital, ShieldAlert, BarChart3 } from "lucide-react";

export const AdminBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: "Ops", path: "/admin", icon: Activity, exact: true },
    { label: "Fleet", path: "/admin/ambulances", icon: Truck },
    { label: "Hospitals", path: "/admin/hospitals", icon: Hospital },
    { label: "Incidents", path: "/admin/incidents", icon: ShieldAlert },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
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
            className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition ${
              active ? "text-purple-400" : "text-dark-400 hover:text-white"
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

export default AdminBottomNav;

