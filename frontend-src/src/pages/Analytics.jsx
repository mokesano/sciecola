import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';

// Period options: 0 = all time, N = last N years
const PERIOD_OPTIONS = [
  { value: 5,  key: 'years_5'  },
  { value: 10, key: 'years_10' },
  { value: 3,  key: 'years_3'  },
  { value: 0,  key: 'all_time' },
];

const TABS = ['ringkasan', 'publikasi', 'sdgs', 'peneliti', 'institusi', 'tren', 'perbandingan'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-[15px] font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color || p.stroke }}>
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const EmptySection = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="font-semibold text-gray-700">{title}</p>
    {subtitle && <p className="text-[15px] text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
  </div>
);

const QuartileChip = ({ q }) => {
  if (!q) return <span className="text-sm text-gray-400">—</span>;
  const colors = { Q1:'bg-green-100 text-green-700', Q2:'bg-blue-100 text-blue-700', Q3:'bg-yellow-100 text-yellow-700', Q4:'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[q] || colors.Q4}`}>{q}</span>;
};

// ─── Main component ───────────────────────────────────────────────────────────

const Analytics = () => {
  const { t } = useTranslation('analytics');

  const [activeTab,   setActiveTab]   = useState('ringkasan');
  const [years,       setYears]       = useState(5);
  const [sortBy,      setSortBy]      = useState('citations');
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetchData = useCallback(async (y) => {
    setLoading(true);
    setError(null);
    try {
      const param = y > 0 ? `?years=${y}` : '';
      const r   = await fetch(`/api/analytics.php${param}`);
      const json = await r.json();
      if (json.status === 'success') {
        setData(json.data);
      } else {
        setError(t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(years); }, [fetchData, years]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const summary      = data?.summary          ?? [];
  const pubTrend     = data?.publication_trend ?? [];
  const citTrend     = data?.citation_trend    ?? [];
  const sdgDist      = data?.sdg_distribution  ?? [];
  const topJournals  = (data?.top_journals     ?? []).map((j, i) => ({ ...j, rank: i + 1 }));
  const docTypes     = data?.document_types    ?? [];
  const rawReseach   = data?.top_researchers   ?? [];
  const topInsts     = (data?.top_institutions ?? []).map((ins, i) => ({ ...ins, rank: i + 1 }));

  // SDG distribution with computed percentages
  const sdgTotal = useMemo(() => sdgDist.reduce((a, s) => a + s.value, 0) || 1, [sdgDist]);
  const sdgWithPct = useMemo(() =>
    sdgDist.map(s => ({ ...s, pct: ((s.value / sdgTotal) * 100).toFixed(1) }))
  , [sdgDist, sdgTotal]);

  // Top researchers sorted
  const topResearchers = useMemo(() => {
    const sorted = [...rawReseach].sort((a, b) => {
      if (sortBy === 'hindex') return (b.h_index ?? 0) - (a.h_index ?? 0);
      return (b.citation_count ?? 0) - (a.citation_count ?? 0);
    });
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rawReseach, sortBy]);

  // Comparison: last 2 years from pubTrend
  const comparisonData = useMemo(() => {
    if (pubTrend.length < 2) return [];
    const [prev, curr] = pubTrend.slice(-2);
    return [
      { label: t('comparison.articles'),    previous: prev.articles,    current: curr.articles,    prevYear: prev.year, currYear: curr.year },
      { label: t('comparison.researchers'), previous: prev.researchers ?? 0, current: curr.researchers ?? 0, prevYear: prev.year, currYear: curr.year },
    ];
  }, [pubTrend, t]);

  const hasData = data !== null && (pubTrend.length > 0 || sdgDist.length > 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">{t('breadcrumb.home')}</Link>
        <span>›</span>
        <span className="text-gray-900">{t('breadcrumb.current')}</span>
      </div>

      {/* Header + controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('header.title')}</h1>
          <p className="text-lg font-semibold text-gray-600 max-w-2xl">{t('header.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Period selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="text-[15px] text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none pr-2"
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{t(`period.${opt.key}`)}</option>
              ))}
            </select>
          </div>
          {/* Export button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-[15px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('period.export')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
          <span>{t('loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-red-700 text-[15px] flex-grow">{error}</span>
          <button onClick={() => fetchData(years)} className="text-[15px] text-red-600 underline shrink-0">{t('retry')}</button>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {summary.length > 0
              ? summary.map((stat, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium mb-1 truncate">{t(`summary.${stat.key}`)}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-xs font-medium mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                        {stat.change} {t('summary.change_suffix')}
                      </p>
                    )}
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
                ))
            }
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-gray-200 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>

          {/* ═══ Tab: Ringkasan ═══ */}
          {activeTab === 'ringkasan' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Publication Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('pub_trend.title')}</h3>
                  {pubTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={pubTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="articles" name={t('pub_trend.articles')}
                          stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>

                {/* SDG Distribution (pie) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sdg_dist.title')}</h3>
                  {sdgWithPct.length > 0 ? (
                    <div className="flex items-start gap-4">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie data={sdgWithPct} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                            paddingAngle={3} dataKey="value">
                            {sdgWithPct.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={v => [v.toLocaleString(), t('sdg_dist.publications')]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-grow space-y-1.5 overflow-y-auto max-h-[220px]">
                        {sdgWithPct.map((sdg, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sdg.color }} />
                            <span className="text-gray-600 truncate flex-grow">{sdg.name}</span>
                            <span className="font-semibold text-gray-900 shrink-0">{sdg.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>
              </div>

              {/* Top Journals (preview) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-gray-900">{t('top_journals.title')}</h3>
                  <Link to="/journals" className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700">
                    {t('top_journals.view_all')} →
                  </Link>
                </div>
                {topJournals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[15px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-sm text-gray-500 font-medium">
                          <th className="pb-3 text-left w-8">#</th>
                          <th className="pb-3 text-left">{/* Journal name */}</th>
                          <th className="pb-3 text-right">{t('top_journals.articles')}</th>
                          <th className="pb-3 text-right">{t('top_journals.citescore')}</th>
                          <th className="pb-3 text-right">{t('top_journals.quartile')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topJournals.slice(0, 5).map(j => (
                          <tr key={j.rank} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 text-sm font-bold text-gray-400">{j.rank}</td>
                            <td className="py-3 font-medium text-gray-900 max-w-[240px] truncate pr-4">{j.name}</td>
                            <td className="py-3 text-right font-semibold text-gray-900">{j.articles.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-600">{j.citescore ?? '—'}</td>
                            <td className="py-3 text-right"><QuartileChip q={j.quartile} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                )}
              </div>
            </>
          )}

          {/* ═══ Tab: Publikasi ═══ */}
          {activeTab === 'publikasi' && (
            <>
              {/* Full-width pub trend */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">{t('pub_trend.title')}</h3>
                {pubTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={pubTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="articles" name={t('pub_trend.articles')}
                        stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="researchers" name={t('pub_trend.researchers')}
                        stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Document types pie */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('doc_types.title')}</h3>
                  {docTypes.length > 0 ? (
                    <div className="flex items-start gap-4">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie data={docTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                            paddingAngle={3} dataKey="count">
                            {docTypes.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={v => [v.toLocaleString(), t('doc_types.count')]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-grow space-y-2 mt-4">
                        {docTypes.map((d, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="text-gray-600 truncate">{t(`doc_types.${d.type}`, { defaultValue: d.type })}</span>
                            </div>
                            <span className="font-semibold text-gray-900 shrink-0">{d.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>

                {/* Top Journals full */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{t('top_journals.title')}</h3>
                    <Link to="/journals" className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700">
                      {t('top_journals.view_all')} →
                    </Link>
                  </div>
                  {topJournals.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto max-h-64">
                      {topJournals.map(j => (
                        <div key={j.rank} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-gray-400 w-4 shrink-0">{j.rank}</span>
                            <div className="min-w-0">
                              <p className="text-[15px] font-medium text-gray-900 truncate">{j.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <QuartileChip q={j.quartile} />
                                {j.citescore > 0 && <span className="text-xs text-gray-400">CS {j.citescore}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[15px] font-bold text-gray-700 shrink-0">{j.articles.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ Tab: SDGs ═══ */}
          {activeTab === 'sdgs' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* SDG horizontal bar chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('sdg_dist.title')}</h3>
                  {sdgWithPct.length > 0 ? (
                    <div className="space-y-3">
                      {[...sdgWithPct].sort((a, b) => b.value - a.value).map((sdg, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <img src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`} alt={`SDG ${sdg.sdg}`}
                            className="w-7 h-7 rounded shrink-0" />
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-gray-700 truncate">{sdg.name}</span>
                              <span className="text-sm text-gray-500 ml-2 shrink-0">
                                {sdg.value.toLocaleString()} · {sdg.pct}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${sdg.pct}%`, backgroundColor: sdg.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>

                {/* SDG donut */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sdg_dist.title')}</h3>
                  {sdgWithPct.length > 0 ? (
                    <>
                      <div className="relative" style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={sdgWithPct} cx="50%" cy="50%"
                              innerRadius={75} outerRadius={105} paddingAngle={3} dataKey="value">
                              {sdgWithPct.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip formatter={v => [v.toLocaleString(), t('sdg_dist.publications')]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-2xl font-bold text-gray-900">{sdgTotal.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{t('sdg_dist.publications')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {sdgWithPct.map((sdg, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sdg.color }} />
                            SDG {sdg.sdg}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>
              </div>

              {/* Link to SDGs cluster page */}
              <div className="flex justify-center">
                <Link to="/sdgs" className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                  {t('sdg_dist.view_all')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          )}

          {/* ═══ Tab: Peneliti ═══ */}
          {activeTab === 'peneliti' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-gray-900">{t('top_researchers.title')}</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="text-[15px] border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="citations">{t('top_researchers.by_citations')}</option>
                    <option value="hindex">{t('top_researchers.by_hindex')}</option>
                  </select>
                  <Link to="/researchers" className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700">
                    {t('top_researchers.view_all')} →
                  </Link>
                </div>
              </div>

              {topResearchers.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {topResearchers.map(r => (
                    <Link
                      key={r.orcid || r.rank}
                      to={r.orcid ? `/orcid/${encodeURIComponent(r.orcid)}` : '#'}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {r.rank}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[15px] shrink-0">
                        {r.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-gray-900 text-[15px] truncate group-hover:text-indigo-600 transition-colors">{r.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{r.institution || '—'}</p>
                      </div>
                      <div className="shrink-0 flex gap-5 text-right">
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{(r.citation_count ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{t('top_researchers.citations')}</p>
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{r.h_index ?? '—'}</p>
                          <p className="text-xs text-gray-400">{t('top_researchers.hindex')}</p>
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{(r.pub_count ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{t('top_researchers.publications')}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySection
                  title={t('top_researchers.no_data.title')}
                  subtitle={t('top_researchers.no_data.subtitle')}
                />
              )}
            </div>
          )}

          {/* ═══ Tab: Institusi ═══ */}
          {activeTab === 'institusi' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{t('top_institutions.title')}</h3>
                <Link to="/institutions" className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700">
                  {t('top_institutions.view_all')} →
                </Link>
              </div>

              {topInsts.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {topInsts.map(inst => (
                    <div key={inst.rank} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {inst.rank}
                      </span>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-gray-900 text-[15px] truncate">{inst.name}</h4>
                        <p className="text-sm text-gray-500">{inst.country || '—'}</p>
                      </div>
                      <div className="shrink-0 flex gap-5 text-right">
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{(inst.researchers_count ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{t('top_institutions.researchers')}</p>
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{(inst.total_citations ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{t('top_institutions.citations')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySection
                  title={t('top_institutions.no_data.title')}
                  subtitle={t('top_institutions.no_data.subtitle')}
                />
              )}
            </div>
          )}

          {/* ═══ Tab: Tren ═══ */}
          {activeTab === 'tren' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Publication trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('pub_trend.title')}</h3>
                  {pubTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={pubTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="articles" name={t('pub_trend.articles')}
                          stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>

                {/* Citation trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t('cit_trend.title')}</h3>
                  {citTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={citTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="citations" name={t('cit_trend.citations')}
                          stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptySection title={t('empty.no_data.title')} subtitle={t('empty.no_data.subtitle')} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ Tab: Perbandingan ═══ */}
          {activeTab === 'perbandingan' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('comparison.title')}</h3>
              {comparisonData.length > 0 ? (
                <>
                  {/* Year labels */}
                  <div className="flex items-center justify-end gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-indigo-200" />
                      {comparisonData[0]?.prevYear ?? '—'} ({t('comparison.prev_period')})
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-indigo-600" />
                      {comparisonData[0]?.currYear ?? '—'} ({t('comparison.curr_period')})
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="previous" name={comparisonData[0]?.prevYear ?? t('comparison.prev_period')}
                        fill="#c7d2fe" radius={[4,4,0,0]} />
                      <Bar dataKey="current" name={comparisonData[0]?.currYear ?? t('comparison.curr_period')}
                        fill="#6366f1" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Delta cards */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {comparisonData.map((item, i) => {
                      const delta = item.current - item.previous;
                      const pct   = item.previous > 0 ? ((delta / item.previous) * 100).toFixed(1) : '∞';
                      const up    = delta >= 0;
                      return (
                        <div key={i} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{item.current.toLocaleString()}</p>
                          <p className={`text-sm font-medium mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
                            {up ? '+' : ''}{delta.toLocaleString()} ({up ? '+' : ''}{pct}%)
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <EmptySection
                  title={t('comparison.no_data.title')}
                  subtitle={t('comparison.no_data.subtitle')}
                />
              )}
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6 mt-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('cta.title')}</h3>
              <p className="text-indigo-100">{t('cta.subtitle')}</p>
            </div>
            <Link
              to="/articles"
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {t('cta.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </main>
  );
};

export default Analytics;
