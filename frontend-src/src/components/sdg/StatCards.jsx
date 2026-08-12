import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 20 20">
      <path stroke="currentColor" strokeLinejoin="round" fill="currentColor" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" strokeWidth="1.5"></path>
    </svg>
    ),
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
  },
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="1.5"></path>
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

const StatCards = ({ data: propData }) => {
  const { t } = useTranslation('dashboard');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    if (propData) return;
    fetch('/api/platform_stats.php')
      .then(r => r.json())
      .then(json => { if (json.status === 'success') setApiData(json.data); })
      .catch(() => {});
  }, [propData]);

  // Label fallback diambil dari locale (id/en) — bukan hardcode.
  const fallbackLabels = t('stats_fallback', { returnObjects: true }) || [];
  const fallback       = fallbackLabels.map((label) => ({ label, value: '—' }));

  const source = propData || apiData || fallback;
  const stats = source.map((s, i) => ({
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
                <div className="text-[15px] text-gray-500 font-medium mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatCards;