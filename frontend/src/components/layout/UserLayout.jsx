import React from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import UserTopbar from "./UserTopbar";
import UserBottomNav from "./UserBottomNav";
import PageTransition from "./PageTransition";
import AIFloatingButton from "../../features/ai/components/AIFloatingButton";
import AIChatPanel from "../../features/ai/components/AIChatPanel";

export const UserLayout = () => {
  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden">
      {/* Desktop Navigation Sidebar */}
      <UserSidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <UserTopbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>

      {/* Mobile Responsive Bottom Navigation */}
      <UserBottomNav />

      {/* Floating AI Doc Assistant Trigger & Slide-over Panel */}
      <AIFloatingButton />
      <AIChatPanel />
    </div>
  );
};

export default UserLayout;

