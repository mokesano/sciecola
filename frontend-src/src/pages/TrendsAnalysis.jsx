import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, Cell,
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: 5,  key: 'years_5'  },
  { value: 7,  key: 'years_7'  },
  { value: 10, key: 'years_10' },
  { value: 3,  key: 'years_3'  },
  { value: 0,  key: 'all'      },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
      <p className="text-[15px] font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm leading-snug" style={{ color: p.color || p.stroke || p.fill }}>
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
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

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" />
  </svg>
);

// ─── Main component ──────────────────────────────────────────────────────────

const TrendsAnalysis = () => {
  const { t } = useTranslation('trends_analysis');

  const [years,         setYears]         = useState(5);
  const [sdgFilter,     setSdgFilter]     = useState(0); // 0 = all
  const [showInsights,  setShowInsights]  = useState(true);
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (years > 0) params.set('years', String(years));
      if (sdgFilter > 0) params.set('sdg', String(sdgFilter));
      const qs = params.toString();
      const r = await fetch(`/api/trends_analysis.php${qs ? '?' + qs : ''}`);
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
  }, [years, sdgFilter, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const impactTrends      = data?.impact_trends      ?? [];
  const impactDeltas      = data?.impact_deltas      ?? { academic: 0, social: 0, practical: 0, total: 0 };
  const topicsGrowth      = data?.topics_growth      ?? [];
  const fieldTrends       = data?.field_trends       ?? [];
  const topSdgs           = data?.top_sdgs           ?? [];
  const collabTrend       = data?.collab_trend       ?? [];
  const topCountries      = data?.top_countries      ?? [];
  const prediction        = data?.prediction         ?? [];
  const regionalBenchmark = data?.regional_benchmark ?? [];

  const startYear = impactTrends[0]?.year ?? '—';

  // Dynamic insight strings
  const insightSummary = useMemo(() => {
    if (impactTrends.length < 2 || prediction.length === 0) return null;
    const last = prediction[prediction.length - 1];
    return t('insights.summary_template', {
      total:      impactDeltas.total ?? 0,
      years:      impactTrends.length,
      nextYears:  2,
      nextScore:  last.predicted ?? '—',
    });
  }, [impactTrends, impactDeltas, prediction, t]);

  const topicsInsight = useMemo(() => {
    if (topicsGrowth.length < 3) return null;
    return t('topics_growth.insight', {
      top3: topicsGrowth.slice(0, 3).map(t => t.topic).join(', '),
    });
  }, [topicsGrowth, t]);

  const fieldInsight = useMemo(() => {
    if (topSdgs.length === 0) return null;
    return t('field_trends.insight', { top: topSdgs.slice(0, 3).map(s => s.name).join(', ') });
  }, [topSdgs, t]);

  const predictionInsight = useMemo(() => {
    if (prediction.length < 2) return null;
    const last     = prediction[prediction.length - 1];
    const lastReal = [...prediction].reverse().find(p => p.actual !== null);
    const dir      = (last.predicted ?? 0) >= (lastReal?.actual ?? 0)
      ? t('prediction.direction_up') : t('prediction.direction_down');
    return t('prediction.insight', { direction: dir, score: last.predicted ?? '—', year: last.year });
  }, [prediction, t]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <Link to="/analytics" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.analytics')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header + filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{t('header.title')}</h1>
          <p className="text-base lg:text-lg font-semibold text-gray-600 max-w-2xl">{t('header.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={sdgFilter}
            onChange={e => setSdgFilter(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={0}>{t('filter.sdg_all')}</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
            ))}
          </select>
          <select
            value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{t(`filter.period.${opt.key}`)}</option>
            ))}
          </select>
          <button
            onClick={() => setShowInsights(s => !s)}
            className={`px-4 py-2 text-[15px] font-medium rounded-lg shadow-sm transition-colors ${
              showInsights
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {showInsights ? t('filter.hide_insights') : t('filter.show_insights')}
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
          <button onClick={fetchData} className="text-[15px] text-red-600 underline shrink-0">{t('retry')}</button>
        </div>
      )}

      {!loading && (
        <>
          {/* Insights overview */}
          {showInsights && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
                <InfoIcon />
                {t('insights.title')}
              </h3>
              <div className="bg-green-50 p-5 rounded-xl border border-green-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">{t('insights.main_trends')}</h4>
                    <ul className="space-y-2 text-[15px] text-gray-700">
                      <li className="flex items-start gap-2"><CheckIcon /><span>{t('insights.trend_1', { academic: impactDeltas.academic })}</span></li>
                      <li className="flex items-start gap-2"><CheckIcon /><span>{t('insights.trend_2')}</span></li>
                      <li className="flex items-start gap-2"><CheckIcon /><span>{t('insights.trend_3')}</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">{t('insights.policy_recs')}</h4>
                    <ul className="space-y-2 text-[15px] text-gray-700">
                      <li className="flex items-start gap-2"><ArrowRightIcon /><span>{t('insights.rec_1')}</span></li>
                      <li className="flex items-start gap-2"><ArrowRightIcon /><span>{t('insights.rec_2')}</span></li>
                      <li className="flex items-start gap-2"><ArrowRightIcon /><span>{t('insights.rec_3')}</span></li>
                      <li className="flex items-start gap-2"><ArrowRightIcon /><span>{t('insights.rec_4')}</span></li>
                    </ul>
                  </div>
                </div>
                {insightSummary && (
                  <div className="mt-4 pt-4 border-t border-green-200/50">
                    <p className="text-[15px] text-gray-600 italic">"{insightSummary}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top growing topics cards */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1 text-gray-800">{t('topic_cards.title')}</h3>
            <p className="text-[15px] text-gray-500 mb-4">{t('topic_cards.subtitle')}</p>
            {topicsGrowth.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topicsGrowth.slice(0, 3).map(topic => {
                  const impactLabel = topic.growth >= 60
                    ? t('topic_cards.impact_high')
                    : topic.growth >= 30 ? t('topic_cards.impact_medium') : t('topic_cards.impact_low');
                  return (
                    <div
                      key={topic.sdg}
                      className="p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      style={{ background: `${topic.color}15` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <img src={`/assets/sdgs/icons/sdg-${topic.sdg}.svg`} alt={topic.topic} className="w-10 h-10 rounded" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-[15px] leading-tight">{topic.topic}</h4>
                          <p className="text-xs text-gray-500">SDG {topic.sdg}</p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold" style={{ color: topic.color }}>+{topic.growth}%</p>
                          <p className="text-xs text-gray-500">{t('topic_cards.growth_label')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-semibold text-gray-700">{topic.current_count.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{t('topic_cards.publications')}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold">{t('topic_cards.impact_label')}</span> {impactLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200">
                <EmptySection title={t('topic_cards.no_data.title')} subtitle={t('topic_cards.no_data.subtitle')} />
              </div>
            )}
          </div>

          {/* Prediction + Topics Growth */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('prediction.title')}</h3>
              {prediction.length >= 2 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={prediction}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="actual"    name={t('prediction.actual')}    stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="predicted" name={t('prediction.predicted')} stroke="#10b981" strokeWidth={2}   strokeDasharray="6 4" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  {showInsights && predictionInsight && (
                    <div className="mt-3 bg-indigo-50 p-3 rounded-lg text-[15px] text-indigo-700">{predictionInsight}</div>
                  )}
                </>
              ) : (
                <EmptySection title={t('prediction.no_data.title')} subtitle={t('prediction.no_data.subtitle')} />
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('topics_growth.title')}</h3>
              {topicsGrowth.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topicsGrowth} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" fontSize={11} />
                      <YAxis dataKey="topic" type="category" width={130} stroke="#6b7280" fontSize={11} interval={0} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="growth" name={t('topics_growth.growth_pct')} radius={[0, 4, 4, 0]}>
                        {topicsGrowth.map((tp, i) => (
                          <Cell key={i} fill={tp.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {showInsights && topicsInsight && (
                    <div className="mt-3 bg-purple-50 p-3 rounded-lg text-[15px] text-purple-700">{topicsInsight}</div>
                  )}
                </>
              ) : (
                <EmptySection title={t('topics_growth.no_data.title')} subtitle={t('topics_growth.no_data.subtitle')} />
              )}
            </div>
          </div>

          {/* Impact trends */}
          <div className="mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="font-bold text-gray-900">{t('impact_trends.title')}</h3>
              {showInsights && impactDeltas.academic !== 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-1.5 text-sm text-yellow-700 flex items-center gap-2">
                  <InfoIcon />
                  <span>{t('impact_trends.delta_label', { year: startYear })}: +{impactDeltas.total}%</span>
                </div>
              )}
            </div>

            {impactTrends.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={impactTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="academic"  name={t('impact_trends.academic')}  stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="social"    name={t('impact_trends.social')}    stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="practical" name={t('impact_trends.practical')} stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="total"     name={t('impact_trends.total')}     stroke="#ef4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'academic',  delta: impactDeltas.academic,  bg: 'bg-indigo-50', text: 'text-indigo-700', sub: 'text-indigo-600' },
                    { key: 'social',    delta: impactDeltas.social,    bg: 'bg-green-50',  text: 'text-green-700',  sub: 'text-green-600'  },
                    { key: 'practical', delta: impactDeltas.practical, bg: 'bg-yellow-50', text: 'text-yellow-700', sub: 'text-yellow-600' },
                    { key: 'total',     delta: impactDeltas.total,     bg: 'bg-red-50',    text: 'text-red-700',    sub: 'text-red-600'    },
                  ].map(item => (
                    <div key={item.key} className={`p-3 rounded-lg ${item.bg}`}>
                      <p className={`text-sm font-medium ${item.text}`}>{t(`impact_trends.${item.key}`)}</p>
                      <p className={`text-xl font-bold ${item.text}`}>
                        {item.delta > 0 ? '+' : ''}{item.delta}%
                      </p>
                      <p className={`text-xs ${item.sub}`}>{t('impact_trends.delta_label', { year: startYear })}</p>
                    </div>
                  ))}
                </div>

                {(impactDeltas.social === 0 || impactDeltas.practical === 0) && showInsights && (
                  <div className="mt-3 text-sm text-gray-500 italic">
                    {impactDeltas.social === 0 && <p>* {t('impact_trends.social_unavailable')}</p>}
                    {impactDeltas.practical === 0 && <p>* {t('impact_trends.practical_unavailable')}</p>}
                  </div>
                )}
              </>
            ) : (
              <EmptySection title={t('impact_trends.no_data.title')} subtitle={t('impact_trends.no_data.subtitle')} />
            )}
          </div>

          {/* Field trends + Collab trend */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('field_trends.title')}</h3>
              {fieldTrends.length > 0 && topSdgs.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={fieldTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      {topSdgs.map(s => (
                        <Line key={s.sdg} type="monotone" dataKey={`sdg${s.sdg}`}
                          name={`SDG ${s.sdg}: ${s.name}`} stroke={s.color} strokeWidth={2} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {showInsights && fieldInsight && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg text-[15px] text-blue-700">{fieldInsight}</div>
                  )}
                </>
              ) : (
                <EmptySection title={t('field_trends.no_data.title')} subtitle={t('field_trends.no_data.subtitle')} />
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('collab_trend.title')}</h3>
              {collabTrend.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={collabTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="national"      name={t('collab_trend.national')}      stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="international" name={t('collab_trend.international')} stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                  {showInsights && (
                    <div className="mt-3 bg-green-50 p-3 rounded-lg text-[15px] text-green-700">{t('collab_trend.insight')}</div>
                  )}

                  {/* Top countries */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-[15px] font-semibold mb-3 text-gray-700">{t('top_countries.title')}</h4>
                    {topCountries.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {topCountries.slice(0, 8).map((c, i) => (
                          <div key={i} className="bg-gray-50 p-2 rounded text-center">
                            <p className="text-sm text-gray-500 truncate">{c.country}</p>
                            <p className="text-[15px] font-bold text-gray-900">{c.collaborations.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection title={t('top_countries.no_data.title')} subtitle={t('top_countries.no_data.subtitle')} compact />
                    )}
                  </div>
                </>
              ) : (
                <EmptySection title={t('collab_trend.no_data.title')} subtitle={t('collab_trend.no_data.subtitle')} />
              )}
            </div>
          </div>

          {/* Regional benchmark */}
          <div className="mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">{t('regional.title')}</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={regionalBenchmark}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="country" stroke="#6b7280" fontSize={11} />
                <YAxis yAxisId="left"  orientation="left"  stroke="#6366f1" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar yAxisId="left"  dataKey="impact" name={t('regional.impact_label')}  fill="#6366f1" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="growth" name={t('regional.growth_label')}  fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            {showInsights && (
              <div className="mt-3 bg-purple-50 p-3 rounded-lg text-[15px] text-purple-700">{t('regional.insight')}</div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default TrendsAnalysis;