import React from 'react';
import Breadcrumb from './Breadcrumb';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions, icon }) {
  return (
    <div className="mb-8">
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-[15px] text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
