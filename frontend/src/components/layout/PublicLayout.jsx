import React, { useEffect, useRef } from "react";
import { Outlet, Link } from "react-router-dom";
import ResQLogo from "../shared/ResQLogo";
import { pageEnter } from "../../lib/gsap";

export const PublicLayout = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    pageEnter(contentRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 relative overflow-hidden flex flex-col justify-between">
      {/* Subtle Radial Glows */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.08),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)]" />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-dark-800/80 bg-dark-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <ResQLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-dark-200 bg-clip-text text-transparent">
              ResQ AI
            </span>
          </Link>

          <div className="flex items-center space-x-4 text-sm font-medium">
            <Link
              to="/login"
              className="text-dark-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white shadow-lg shadow-emergency-600/20 transition-all active:scale-95"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Routed Content */}
      <main ref={contentRef} className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-20 border-t border-dark-800/60 py-6 text-center text-xs text-dark-400">
        &copy; {new Date().getFullYear()} ResQ AI — Autonomous Emergency Coordination Platform.
      </footer>
    </div>
  );
};

export default PublicLayout;
