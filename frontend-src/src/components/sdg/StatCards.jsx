import React from 'react';
import { STATS_MOCK } from '../../data/mock/statsMock';

const SDG_WHEEL_ICON = (
  <svg className="w-14 h-14 overflow-visible" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <path fill="#E5243B" d="M18 2 A 16 16 0 0 1 34 18 L 26 18 A 8 8 0 0 0 18 10 Z" className="origin-center transition-all duration-300 hover:scale-110 cursor-pointer hover:drop-shadow-md" />
    <path fill="#DDA63A" d="M34 18 A 16 16 0 0 1 18 34 L 18 26 A 8 8 0 0 0 26 18 Z" className="origin-center transition-all duration-300 hover:scale-110 cursor-pointer hover:drop-shadow-md" />
    <path fill="#4C9F38" d="M18 34 A 16 16 0 0 1 2 18 L 10 18 A 8 8 0 0 0 18 26 Z" className="origin-center transition-all duration-300 hover:scale-110 cursor-pointer hover:drop-shadow-md" />
    <path fill="#00689D" d="M2 18 A 16 16 0 0 1 18 2 L 18 10 A 8 8 0 0 0 10 18 Z" className="origin-center transition-all duration-300 hover:scale-110 cursor-pointer hover:drop-shadow-md" />
  </svg>
);

const STAT_ICONS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    colorClass: 'text-indigo-800',
    bgClass: 'bg-indigo-100',
  },
  { icon: SDG_WHEEL_ICON, colorClass: '', bgClass: 'bg-transparent' },
  {
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
    ),
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
  },
];

/**
 * StatCards — global platform statistics bar.
 * Accepts optional `data` prop from API: [{ label, value }]
 * Falls back to STATS_MOCK when omitted or null.
 */
const StatCards = ({ data }) => {
  const stats = (data && data.length > 0 ? data : STATS_MOCK).map((s, i) => ({
    ...s,
    ...STAT_ICONS[i] || STAT_ICONS[0],
  }));

  return (
    <div className="max-w-7xl mx-auto mb-12 relative z-20">
      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/40 border border-gray-100 p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4 pt-6 first:pt-0 lg:pt-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 group">
              <div className={`min-w-[56px] h-[56px] rounded-full flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110 ${stat.bgClass} ${stat.colorClass}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-tight">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatCards;
