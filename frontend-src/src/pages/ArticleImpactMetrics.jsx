import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: 0,  key: 'all'      },
  { value: 1,  key: 'year_1'   },
  { value: 3,  key: 'years_3'  },
  { value: 5,  key: 'years_5'  },
  { value: 10, key: 'years_10' },
];

const SORT_OPTIONS = ['impact', 'citations', 'year'];

// SINTA accreditation: 6 grades (S1 highest → S6 lowest). Structured color gradient
// for clear visual hierarchy: green → blue → indigo → amber → orange → red.
const SINTA_STYLE = {
  S1: { chip: 'bg-emerald-100 text-emerald-800', bar: '#10b981' },
  S2: { chip: 'bg-blue-100    text-blue-800',    bar: '#3b82f6' },
  S3: { chip: 'bg-indigo-100  text-indigo-800',  bar: '#6366f1' },
  S4: { chip: 'bg-amber-100   text-amber-800',   bar: '#f59e0b' },
  S5: { chip: 'bg-orange-100  text-orange-800',  bar: '#f97316' },
  S6: { chip: 'bg-red-100     text-red-800',     bar: '#ef4444' },
};

const DIM_STYLE = {
  academic:  { bg: 'bg-blue-100',   icon: 'text-blue-600',   text: 'text-blue-800',   bar: 'bg-blue-600'   },
  social:    { bg: 'bg-green-100',  icon: 'text-green-600',  text: 'text-green-800',  bar: 'bg-green-600'  },
  practical: { bg: 'bg-yellow-100', icon: 'text-yellow-600', text: 'text-yellow-800', bar: 'bg-yellow-600' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptySection = ({ title, subtitle, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-8' : 'py-14'}`}>
    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="font-semibold text-gray-700 text-sm">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
  </div>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const SintaChip = ({ grade }) => {
  if (!grade) return <span className="text-xs text-gray-400">—</span>;
  const style = SINTA_STYLE[grade];
  if (!style) return <span className="text-xs text-gray-400">{grade}</span>;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.chip}`}>SINTA {grade.slice(1)}</span>;
};

const ImpactBar = ({ value, color }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const DimensionIcon = ({ dim }) => {
  const paths = {
    academic:  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    social:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    practical: 'M13 10V3L4 14h7v7l9-11h-7z',
  };
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[dim]} />
    </svg>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ArticleImpactMetrics = () => {
  const { t } = useTranslation('article_impact');

  const [sdg,             setSdg]             = useState(0);
  const [years,           setYears]           = useState(0);
  const [sort,            setSort]            = useState('impact');
  const [page,            setPage]            = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [data,            setData]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  const limit = 10;
  const hasActiveFilters = sdg > 0 || years > 0;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sort,
        page:  String(page),
        limit: String(limit),
      });
      if (sdg > 0)   params.set('sdg',   String(sdg));
      if (years > 0) params.set('years', String(years));
      const r = await fetch(`/api/article_impact.php?${params}`);
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
  }, [sdg, years, sort, page, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters/sort change
  useEffect(() => { setPage(1); }, [sdg, years, sort]);

  const articles          = data?.articles            ?? [];
  const total             = data?.total               ?? 0;
  const totalPages        = data?.total_pages         ?? 1;
  const impactBySdg       = data?.impact_by_sdg       ?? [];
  const sintaBreakdown    = data?.sinta_breakdown     ?? [];
  const dimsAvailable     = data?.dimensions_available ?? { academic: true, social: false, practical: false };

  const resetFilters = () => {
    setSdg(0);
    setYears(0);
    setSort('impact');
    setPage(1);
  };

  // Pagination range to render
  const pageNumbers = useMemo(() => {
    const pages = [];
    const max   = Math.min(totalPages, 5);
    let start   = Math.max(1, page - 2);
    let end     = Math.min(totalPages, start + max - 1);
    start       = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const fromIdx = articles.length > 0 ? (page - 1) * limit + 1 : 0;
  const toIdx   = (page - 1) * limit + articles.length;

  // Radar data for selected article
  const radarData = useMemo(() => selectedArticle ? [
    { name: t('impact_dims.academic'),  value: selectedArticle.academic_impact  ?? 0 },
    { name: t('impact_dims.social'),    value: selectedArticle.social_impact    ?? 0 },
    { name: t('impact_dims.practical'), value: selectedArticle.practical_impact ?? 0 },
  ] : [], [selectedArticle, t]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
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
            value={sdg}
            onChange={e => setSdg(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={0}>{t('filter.sdg_all')}</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
            ))}
          </select>
          <select
            value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{t(`filter.period.${opt.key}`)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s} value={s}>{t(`filter.sort.${s}`)}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {t('filter.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Impact score explanation */}
      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('explanation.title')}</h3>
        <p className="text-sm text-gray-600 mb-4">{t('explanation.subtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['academic', 'social', 'practical'].map(dim => {
            const s = DIM_STYLE[dim];
            return (
              <div key={dim} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${s.bg} ${s.icon}`}>
                    <DimensionIcon dim={dim} />
                  </div>
                  <h4 className={`font-semibold text-sm ${s.text}`}>
                    {t(`explanation.dimensions.${dim}.title`)} ({t(`explanation.dimensions.${dim}.weight`)})
                  </h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t(`explanation.dimensions.${dim}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
        {(!dimsAvailable.social || !dimsAvailable.practical) && (
          <p className="text-xs text-gray-500 mt-3 italic">* {t('explanation.data_note')}</p>
        )}
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
          <span className="text-red-700 text-sm flex-grow">{error}</span>
          <button onClick={fetchData} className="text-sm text-red-600 underline shrink-0">{t('retry')}</button>
        </div>
      )}

      {!loading && (
        <>
          {/* Selected article detail panel */}
          {selectedArticle && (
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl mb-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">{t('detail.title')}</p>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{selectedArticle.title}</h3>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 shrink-0"
                  onClick={() => setSelectedArticle(null)}
                  aria-label={t('detail.close')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm text-gray-700">
                  <p><b>{t('detail.authors')}:</b> {(selectedArticle.authors ?? []).join(', ') || '—'}</p>
                  <p><b>{t('detail.journal')}:</b> {selectedArticle.journal || '—'}</p>
                  <p><b>{t('detail.year')}:</b> {selectedArticle.year || '—'}</p>
                  <p><b>{t('detail.sinta')}:</b> <SintaChip grade={selectedArticle.sinta} /></p>
                  <p><b>{t('detail.total_score')}:</b> <span className="font-bold text-indigo-600">{selectedArticle.total_impact}</span></p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{t('detail.components')}</h4>
                    <div className="space-y-2">
                      {['academic', 'social', 'practical'].map(dim => (
                        <div key={dim}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700">{t(`impact_dims.${dim}`)}</span>
                            <span className="font-semibold">{selectedArticle[`${dim}_impact`] ?? 0}</span>
                          </div>
                          <ImpactBar value={selectedArticle[`${dim}_impact`] ?? 0} color={DIM_STYLE[dim].bar} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedArticle.doi && (
                    <Link
                      to={`/doi/${encodeURIComponent(selectedArticle.doi)}`}
                      className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700"
                    >
                      {t('detail.open_article')} →
                    </Link>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{t('detail.profile')}</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Article table */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('table.title')}</h3>
              {total > 0 && (
                <span className="text-xs text-gray-500">
                  {t('pagination.showing', { from: fromIdx, to: toIdx, total: total.toLocaleString() })}
                </span>
              )}
            </div>

            {articles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.title_authors')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.journal')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.year')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.citations')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.academic')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.social')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.practical')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.impact_score')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {articles.map(article => (
                      <tr
                        key={article.doi}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedArticle?.doi === article.doi ? 'bg-indigo-50/50' : ''
                        }`}
                        onClick={() => setSelectedArticle(article)}
                      >
                        <td className="px-4 py-3 max-w-md">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</div>
                          <div className="text-xs text-gray-500 truncate">{(article.authors ?? []).join(', ')}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 truncate max-w-[180px]">{article.journal || '—'}</div>
                          <div className="mt-0.5"><SintaChip grade={article.sinta} /></div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{article.year || '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{article.citations.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{article.academic_impact}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">
                          {dimsAvailable.social ? article.social_impact : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">
                          {dimsAvailable.practical ? article.practical_impact : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-grow bg-gray-200 rounded-full h-2">
                              <div className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.max(0, Math.min(100, article.total_impact))}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 shrink-0">{article.total_impact}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptySection
                title={t(hasActiveFilters ? 'table.no_match.title' : 'table.no_data.title')}
                subtitle={t(hasActiveFilters ? 'table.no_match.subtitle' : 'table.no_data.subtitle')}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && articles.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('pagination.prev')}
                </button>
                <div className="flex gap-1">
                  {pageNumbers.map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`text-sm px-3 py-1.5 rounded-lg ${
                        page === p
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('pagination.next')}
                </button>
              </div>
            )}
          </div>

          {/* Analysis charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impact by SDG (radar) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">{t('by_sdg.title')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('by_sdg.subtitle')}</p>
              {impactBySdg.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart outerRadius={110} data={impactBySdg}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="sdg" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar
                      name={t('impact_dims.academic')}
                      dataKey="academic"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      formatter={(v) => v}
                      labelFormatter={(label) => {
                        const item = impactBySdg.find(s => s.sdg === label);
                        return item ? `SDG ${label}: ${item.name}` : `SDG ${label}`;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection title={t('by_sdg.no_data.title')} subtitle={t('by_sdg.no_data.subtitle')} />
              )}
            </div>

            {/* SINTA breakdown (horizontal bar with SINTA color gradient) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">{t('by_sinta.title')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('by_sinta.subtitle')}</p>
              {sintaBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sintaBreakdown} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                      <YAxis dataKey="sinta" type="category" stroke="#6b7280" fontSize={11} width={40} />
                      <Tooltip />
                      <Bar dataKey="academic" name={t('impact_dims.academic')} radius={[0, 4, 4, 0]}>
                        {sintaBreakdown.map((row, i) => (
                          <Cell key={i} fill={SINTA_STYLE[row.sinta]?.bar || '#9ca3af'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {sintaBreakdown.map(row => (
                      <div key={row.sinta} className="bg-gray-50 p-2 rounded text-center">
                        <SintaChip grade={row.sinta} />
                        <p className="text-sm font-bold text-gray-900 mt-1">{row.article_count.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">{t('by_sinta.articles')}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptySection title={t('by_sinta.no_data.title')} subtitle={t('by_sinta.no_data.subtitle')} />
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default ArticleImpactMetrics;
