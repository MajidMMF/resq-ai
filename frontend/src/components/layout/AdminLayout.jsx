import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminBottomNav from "./AdminBottomNav";
import { pageEnter } from "../../lib/gsap";

export const AdminLayout = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    pageEnter(contentRef.current);
  }, []);

  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Left Operations Sidebar */}
      <AdminSidebar />

      {/* 2. Main Admin Cockpit */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar />

        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Mobile Navigation */}
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;

