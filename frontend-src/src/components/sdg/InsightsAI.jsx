import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CACHED_INSIGHTS } from '../../utils/insightEngine';

const ICON_STYLES = [
  { iconColor: 'text-green-400',  iconBg: 'bg-green-500/20'  },
  { iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/20'   },
  { iconColor: 'text-orange-400', iconBg: 'bg-orange-500/20' },
];

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
  if (trend === 'down') return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
};

const InsightsAI = () => {
  const [displayInsights, setDisplayInsights] = useState(
    CACHED_INSIGHTS.slice(0, 3).map((item, i) => ({ ...item, ...ICON_STYLES[i % ICON_STYLES.length] }))
  );

  useEffect(() => {
    fetch('/api/insights.php')
      .then(res => res.json())
      .then(json => {
        if (json.status === 'ok' && Array.isArray(json.insights) && json.insights.length > 0) {
          setDisplayInsights(
            json.insights.slice(0, 3).map((item, i) => ({
              ...item,
              ...ICON_STYLES[i % ICON_STYLES.length],
              trend: item.trend || 'neutral',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#1e1b4b] rounded-2xl p-6 text-white h-full flex flex-col shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2" />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="font-semibold text-lg">Insights AI</h3>
        </div>
        <Link to="/insights" className="text-sm text-gray-300 hover:text-white transition-colors">
          Lihat semua
        </Link>
      </div>

      <div className="flex-grow space-y-4 relative z-10">
        {displayInsights.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start transition hover:bg-white/10">
            <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0`}>
              <TrendIcon trend={item.trend} />
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <Link
        to="/insights"
        className="mt-6 w-full py-3 px-4 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex justify-center items-center gap-2 relative z-10"
      >
        Lihat semua insight
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
};

export default InsightsAI;
