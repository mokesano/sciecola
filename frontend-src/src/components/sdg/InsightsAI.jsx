import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Sparkline, { readDirection } from '../shared/Sparkline';

/* ─── insight row ────────────────────────────────────────────────────────── */

const InsightRow = ({ item }) => {
  const series    = Array.isArray(item.series) ? item.series : [];
  const direction = readDirection(series, item.trend);
  const start     = item.series_start;
  const end       = start && series.length ? start + series.length - 1 : null;

  const trendClass = {
    up:   'text-indigo-700',
    down: 'text-red-600',
    flat: 'text-slate-600',
  }[direction];

  return (
    <li className="flex items-start gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        {item.category && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {item.category}
          </p>
        )}
        {item.title && (
          <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
        )}
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{item.text}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {series.length > 1 && <Sparkline values={series} direction={direction} />}
        {item.trend && (
          <span className={`text-sm font-semibold tabular-nums ${trendClass}`}>{item.trend}</span>
        )}
        {start && end && (
          <span className="font-mono text-[10px] tabular-nums text-slate-400">{start}–{end}</span>
        )}
      </div>
    </li>
  );
};

/* ─── main ───────────────────────────────────────────────────────────────── */

const InsightsAI = () => {
  const { t } = useTranslation('dashboard');
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetch('/api/insights.php')
      .then(res => res.json())
      .then(json => {
        if (json.status === 'ok' && Array.isArray(json.insights)) {
          setInsights(json.insights.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-900">
          {t('insights_ai.title')}
        </h3>
        <Link to="/insights"
          className="text-[13px] text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
          {t('insights_ai.view_all')}
        </Link>
      </header>

      <div className="flex-grow px-5">
        {insights.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{t('insights_ai.empty')}</p>
        ) : (
          <ul>
            {insights.map(item => <InsightRow key={item.id} item={item} />)}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 px-5 py-3">
        <Link to="/insights"
          className="flex items-center justify-center gap-2 rounded border border-slate-300 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
          {t('insights_ai.cta')}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
};

export default InsightsAI;
