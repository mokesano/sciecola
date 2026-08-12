import React from 'react';

export default function TabNav({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 bg-gray-100 rounded-xl p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[15px] font-medium transition-all ${
            active === tab.value
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.count != null && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-sm font-semibold ${
              active === tab.value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
