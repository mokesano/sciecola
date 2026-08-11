import React, { useState, useEffect, useId } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/* ─── helpers ────────────────────────────────────────────────────────────── */

/* Direction is read from the series first — the actual data — and only falls
   back to parsing the `trend` label when no series was supplied. The previous
   version compared `trend` against the literals 'up'/'down', but the API sends
   formatted labels like '+32%', so every card rendered the neutral icon. */
function readDirection(series, trend) {
  if (Array.isArray(series) && series.length > 1) {
    const delta = series[series.length - 1] - series[0];
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'flat';
  }
  if (typeof trend === 'string') {
    if (trend.trim().startsWith('+')) return 'up';
    if (trend.trim().startsWith('-')) return 'down';
  }
  return 'flat';
}

const DIRECTION_COLOR = {
  up:   '#4f46e5', // indigo-600
  down: '#dc2626', // red-600
  flat: '#64748b', // slate-500
};

/* ─── sparkline ──────────────────────────────────────────────────────────── */

/* Small, axis-free trend chart in the style used across Google's dashboards:
   a thin monotone line over a soft fade, with only the latest point marked.
   No grid, no ticks, no tooltip — it reads as a glyph, not a chart. */
const Sparkline = ({ values, direction }) => {
  const gradientId = useId();
  const color = DIRECTION_COLOR[direction] ?? DIRECTION_COLOR.flat;
  const data = values.map((v, i) => ({ i, v }));
  const lastIndex = data.length - 1;

  // Only the final point gets a dot, so the eye lands on "where it is now".
  const renderDot = ({ cx, cy, index }) =>
    index === lastIndex
      ? <circle key="last" cx={cx} cy={cy} r={2.5} fill={color} stroke="#fff" strokeWidth={1.5} />
      : null;

  return (
    <div className="h-11 w-24 shrink-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={renderDot}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

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
