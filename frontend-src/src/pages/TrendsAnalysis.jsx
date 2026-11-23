import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, Cell,
} from 'recharts';
import { countryName } from '../utils/countryName';

/**
 * Analisis tren — semua angka dari /api/trends_analysis.php (database).
 * Versi sebelumnya menampilkan perbandingan regional ASEAN dengan angka tetap, garis
 * dampak "media sosial/praktis" yang selalu nol, label "potensi dampak" karangan, serta
 * klaim dan rekomendasi kebijakan statis yang tampak seolah hasil analisis data.
 */
const PERIOD_OPTIONS = [
  { value: 5,  key: 'years_5'  },
  { value: 3,  key: 'years_3'  },
  { value: 7,  key: 'years_7'  },
  { value: 10, key: 'years_10' },
  { value: 0,  key: 'all'      },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
      <p className="text-[15px] font-semibold text-gray-900 mb-1">{label}</p>
      {payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => (
        <p key={i} className="text-sm leading-snug" style={{ color: p.color || p.stroke || p.fill }}>
          {p.name}: <span className="font-semibold">{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const EmptySection = ({ title, subtitle, compact = false }) => (
  <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-8' : 'py-14'}`}>
    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="font-semibold text-gray-700 text-[15px]">{title}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
  </div>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
  </svg>
);

const signed = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v}%`);

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {title && <h3 className="font-bold text-gray-900 mb-4">{title}</h3>}
    {children}
  </div>
);

const TrendsAnalysis = () => {
  const { t, i18n } = useTranslation('trends_analysis');
  const lang = (i18n.language || 'id').slice(0, 2);

  const [years,        setYears]        = useState(5);
  const [sdgFilter,    setSdgFilter]    = useState(0);
  const [showInsights, setShowInsights] = useState(true);
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ years: String(years) });
      if (sdgFilter > 0) params.set('sdg', String(sdgFilter));
      const r = await fetch(`/api/trends_analysis.php?${params}`);
      const json = await r.json();
      if (json.status === 'success') setData(json.data);
      else { setData(null); setError(json.message || t('error')); }
    } catch {
      setData(null);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [years, sdgFilter, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const yearly        = data?.yearly ?? [];
  const deltas        = data?.deltas ?? {};
  const projection    = data?.projection ?? [];
  const topicsGrowth  = data?.topics_growth ?? [];
  const fieldTrends   = data?.field_trends ?? [];
  const topSdgs       = data?.top_sdgs ?? [];
  const collabTrend   = data?.collab_trend ?? [];
  const topCountries  = (data?.top_countries ?? []).map(c => ({ ...c, label: countryName(c.country, lang) }));
  const homeCountry   = data?.home_country ? countryName(data.home_country, lang) : null;
  const hasPartial    = yearly.some(y => y.partial);
  const growthTopics  = topicsGrowth.filter(x => x.growth !== null);

  // Temuan yang dihitung langsung dari angka di atas (bukan teks tetap).
  const findings = useMemo(() => {
    const out = [];
    if (deltas.pub_count !== null && deltas.pub_count !== undefined) {
      out.push(t('insights.f_publications', { delta: signed(deltas.pub_count), from: deltas.from_year, to: deltas.to_year }));
    }
    if (deltas.avg_citations !== null && deltas.avg_citations !== undefined) {
      out.push(t('insights.f_citations', { delta: signed(deltas.avg_citations), from: deltas.from_year, to: deltas.to_year }));
    }
    if (topSdgs.length) {
      out.push(t('insights.f_top_sdgs', { list: topSdgs.slice(0, 3).map(s => `SDG ${s.sdg} (${s.count})`).join(', ') }));
    }
    if (growthTopics.length) {
      const g = growthTopics[0];
      out.push(t('insights.f_fastest', { sdg: g.sdg, name: g.topic, delta: signed(g.growth) }));
    }
    const lastCollab = [...collabTrend].reverse().find(c => !c.partial && c.intl_percent !== null);
    if (lastCollab) {
      out.push(t('insights.f_collab', { pct: lastCollab.intl_percent, year: lastCollab.year, known: lastCollab.known, total: lastCollab.total }));
    }
    if (projection.length) {
      const last = projection[projection.length - 1];
      out.push(t('insights.f_projection', { year: last.year, value: last.projected }));
    }
    return out;
  }, [deltas, topSdgs, growthTopics, collabTrend, projection, t]);

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <Link to="/analytics" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.analytics')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{t('header.title')}</h1>
          <p className="text-base lg:text-lg font-semibold text-gray-600 max-w-2xl">{t('header.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={sdgFilter} onChange={e => setSdgFilter(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500">
            <option value={0}>{t('filter.sdg_all')}</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
            ))}
          </select>
          <select value={years} onChange={e => setYears(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500">
            {PERIOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(`filter.period.${opt.key}`)}</option>)}
          </select>
          <button type="button" onClick={() => setShowInsights(s => !s)}
            className={`px-4 py-2 text-[15px] font-medium rounded-lg shadow-sm transition-colors ${showInsights ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            {showInsights ? t('filter.hide_insights') : t('filter.show_insights')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
          <svg className="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>{t('loading')}</span>
        </div>
      )}

      {!loading && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-red-700 text-[15px]">{error}</p>
          <button type="button" onClick={fetchData} className="text-[15px] text-red-600 underline shrink-0">{t('retry')}</button>
        </div>
      )}

      {!loading && data && (
        <>
          {showInsights && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
              <h3 className="font-bold text-indigo-900 mb-3">{t('insights.title')}</h3>
              {findings.length ? (
                <ul className="space-y-2 text-[15px] text-gray-700">
                  {findings.map((f, i) => <li key={i} className="flex items-start gap-2"><CheckIcon /><span>{f}</span></li>)}
                </ul>
              ) : (
                <p className="text-[15px] text-gray-600">{t('insights.not_enough')}</p>
              )}
              <p className="text-xs text-gray-500 mt-3">
                {t('insights.source_note', { total: (data.total_publications ?? 0).toLocaleString() })}
                {hasPartial && ` ${t('insights.partial_note', { year: data.current_year })}`}
              </p>
            </div>
          )}

          {/* Publikasi & sitasi per tahun */}
          <Card title={t('yearly.title')} className="mb-6">
            {yearly.length ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={yearly.map(y => ({ ...y, year: y.partial ? `${y.year}*` : y.year }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="pub_count" name={t('yearly.publications')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avg_citations" name={t('yearly.avg_citations')} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-indigo-50">
                    <p className="text-xl font-bold text-indigo-700">{signed(deltas.pub_count)}</p>
                    <p className="text-xs text-indigo-600">{t('yearly.delta_pubs', { from: deltas.from_year ?? '—', to: deltas.to_year ?? '—' })}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50">
                    <p className="text-xl font-bold text-amber-700">{signed(deltas.avg_citations)}</p>
                    <p className="text-xs text-amber-600">{t('yearly.delta_cites', { from: deltas.from_year ?? '—', to: deltas.to_year ?? '—' })}</p>
                  </div>
                </div>
                {hasPartial && <p className="text-xs text-gray-500 mt-2">* {t('insights.partial_note', { year: data.current_year })}</p>}
              </>
            ) : (
              <EmptySection title={t('yearly.no_data.title')} subtitle={t('yearly.no_data.subtitle')} />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Proyeksi */}
            <Card title={t('projection.title')}>
              {projection.length ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" name={t('projection.actual')} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
                      <Line type="monotone" dataKey="projected" name={t('projection.projected')} stroke="#10b981" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2">{t('projection.method')}</p>
                </>
              ) : (
                <EmptySection title={t('projection.no_data.title')} subtitle={t('projection.no_data.subtitle')} />
              )}
            </Card>

            {/* Pertumbuhan per SDG */}
            <Card title={t('topics_growth.title')}>
              {growthTopics.length ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={growthTopics} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" fontSize={11} unit="%" />
                      <YAxis type="category" dataKey="topic" stroke="#6b7280" fontSize={11} width={130} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="growth" name={t('topics_growth.growth_pct')} radius={[0, 4, 4, 0]}>
                        {growthTopics.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2">{t('topics_growth.method', { from: deltas.from_year ?? '—', to: deltas.to_year ?? '—' })}</p>
                </>
              ) : (
                <EmptySection title={t('topics_growth.no_data.title')} subtitle={t('topics_growth.no_data.subtitle')} />
              )}
            </Card>
          </div>

          {/* Kartu SDG */}
          {topicsGrowth.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1 text-gray-800">{t('topic_cards.title')}</h3>
              <p className="text-[15px] text-gray-500 mb-4">{t('topic_cards.subtitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topicsGrowth.slice(0, 4).map(topic => (
                  <div key={topic.sdg} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg text-white text-sm font-bold flex items-center justify-center" style={{ backgroundColor: topic.color }}>{topic.sdg}</span>
                      <p className="font-semibold text-gray-900 text-[15px]">{topic.topic}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div><p className="text-xs text-gray-500">{t('topic_cards.growth_label')}</p><p className="font-bold text-gray-900">{signed(topic.growth)}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-500">{t('topic_cards.publications')}</p><p className="font-bold text-gray-900">{topic.current_count.toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tren per SDG */}
          <Card title={t('field_trends.title')} className="mb-6">
            {fieldTrends.length && topSdgs.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={fieldTrends.map(r => ({ ...r, year: r.partial ? `${r.year}*` : r.year }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  {topSdgs.map(s => (
                    <Area key={s.sdg} type="monotone" dataKey={`sdg${s.sdg}`} name={`SDG ${s.sdg} ${s.name}`} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptySection title={t('field_trends.no_data.title')} subtitle={t('field_trends.no_data.subtitle')} />
            )}
          </Card>

          {/* Kolaborasi */}
          <Card title={t('collab_trend.title')} className="mb-6">
            {collabTrend.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={collabTrend.map(r => ({ ...r, year: r.partial ? `${r.year}*` : r.year }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="national" name={t('collab_trend.national')} stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="international" name={t('collab_trend.international')} stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2">{t('collab_trend.method')}</p>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold mb-1 text-gray-700">{t('top_countries.title')}</h4>
                  {homeCountry && <p className="text-xs text-gray-500 mb-3">{t('top_countries.home', { country: homeCountry })}</p>}
                  {topCountries.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={topCountries} layout="vertical">
                        <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="label" stroke="#6b7280" fontSize={11} width={100} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="collaborations" name={t('top_countries.collaborations')} fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptySection title={t('top_countries.no_data.title')} subtitle={t('top_countries.no_data.subtitle')} compact />
                  )}
                </div>
              </div>
            ) : (
              <EmptySection title={t('collab_trend.no_data.title')} subtitle={t('collab_trend.no_data.subtitle')} />
            )}
          </Card>
        </>
      )}
    </main>
  );
};

export default TrendsAnalysis;
