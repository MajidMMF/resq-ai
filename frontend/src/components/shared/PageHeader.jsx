import React from "react";

export const PageHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = "",
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-dark-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center space-x-3">{action}</div>}
    </div>
  );
};

export default PageHeader;

