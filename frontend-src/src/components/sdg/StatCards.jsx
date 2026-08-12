import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users, BookOpen, Quote } from 'lucide-react';

/* The SDG wheel, kept because it is the programme's own mark rather than
   decoration. Simplified to four quadrants in the official colours. */
const SdgWheel = () => (
  <svg className="h-6 w-6" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path fill="#E5243B" d="M18 2 A 16 16 0 0 1 34 18 L 26 18 A 8 8 0 0 0 18 10 Z" />
    <path fill="#DDA63A" d="M34 18 A 16 16 0 0 1 18 34 L 18 26 A 8 8 0 0 0 26 18 Z" />
    <path fill="#4C9F38" d="M18 34 A 16 16 0 0 1 2 18 L 10 18 A 8 8 0 0 0 18 26 Z" />
    <path fill="#00689D" d="M2 18 A 16 16 0 0 1 18 2 L 18 10 A 8 8 0 0 0 10 18 Z" />
  </svg>
);

/* One neutral icon treatment across the row. The previous version gave each
   tile its own colour family, which read as decoration rather than as a
   distinction between the figures. */
const STAT_ICONS = [
  (props) => <FileText {...props} />,
  (props) => <Users {...props} />,
  (props) => <BookOpen {...props} />,
  () => <SdgWheel />,
  (props) => <Quote {...props} />,
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

  return (
    <div className="relative z-20 mx-auto mb-12 max-w-7xl">
      <dl className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        {source.map((stat, index) => {
          const Icon = STAT_ICONS[index] ?? STAT_ICONS[0];
          return (
            <div key={index} className="flex items-center gap-4 px-6 py-6">
              <span className="shrink-0 text-slate-400">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <dd className="text-2xl font-semibold leading-tight tabular-nums tracking-tight text-slate-900">
                  {stat.value}
                </dd>
                <dt className="mt-0.5 text-[13px] leading-snug text-slate-500">{stat.label}</dt>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
};

export default StatCards;
