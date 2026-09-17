import React from "react";
import { Link } from "react-router-dom";
import useRole from "../../hooks/useRole";
import { ShieldAlert } from "lucide-react";
import { getRedirectPath } from "../../lib/constants";

export const RoleGuard = ({ allow = [], children }) => {
  const { roles, primaryRole } = useRole();

  const isAllowed = allow.some((role) => roles.includes(role));

  if (!isAllowed) {
    const homePath = getRedirectPath(roles);

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emergency-500/10 border border-emergency-500/30 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-emergency-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied (403)</h1>
        <p className="text-sm text-dark-400 max-w-md mb-6">
          Your role ({primaryRole || "UNASSIGNED"}) does not have permission to view
          this section.
        </p>
        <Link
          to={homePath}
          className="px-6 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-200 font-medium text-sm transition-all active:scale-95"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
