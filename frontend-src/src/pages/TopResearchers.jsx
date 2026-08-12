import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const SORT_OPTIONS = ['impact', 'citations', 'hindex', 'publications'];

const DIM_STYLE = {
  academic:     { bg: 'bg-blue-100',   icon: 'text-blue-600',   text: 'text-blue-800'   },
  citation:     { bg: 'bg-green-100',  icon: 'text-green-600',  text: 'text-green-800'  },
  productivity: { bg: 'bg-yellow-100', icon: 'text-yellow-600', text: 'text-yellow-800' },
  collab:       { bg: 'bg-purple-100', icon: 'text-purple-600', text: 'text-purple-800' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptySection = ({ title, subtitle, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-8' : 'py-14'}`}>
    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

const ScoreBar = ({ value, total = 100 }) => (
  <div className="flex items-center gap-2 min-w-[100px]">
    <div className="flex-grow bg-gray-200 rounded-full h-2">
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, (value / total) * 100))}%` }}
      />
    </div>
    <span className="text-sm font-semibold text-gray-900 shrink-0">{value}</span>
  </div>
);

const ComponentIcon = ({ comp }) => {
  const paths = {
    academic:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    citation:     'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    productivity: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    collab:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  };
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[comp]} />
    </svg>
  );
};

const getInitials = (name = '') => name
  .split(' ')
  .filter(p => p.length && !['Dr.', 'Prof.', 'Drs.', 'Ir.', 'Mr.', 'Mrs.', 'Ms.'].includes(p))
  .map(p => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

// ─── Main component ──────────────────────────────────────────────────────────

const TopResearchers = () => {
  const { t } = useTranslation('top_researchers');

  const [sdg,                setSdg]                = useState(0);
  const [countryFilter,      setCountryFilter]      = useState('');
  const [search,             setSearch]             = useState('');
  const [sort,               setSort]               = useState('impact');
  const [page,               setPage]               = useState(1);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [data,               setData]               = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);

  const limit = 10;
  const hasActiveFilters = sdg > 0 || countryFilter !== '' || search.trim() !== '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
      if (sdg > 0)              params.set('sdg', String(sdg));
      if (countryFilter)        params.set('country', countryFilter);
      if (search.trim())        params.set('search', search.trim());

      const r = await fetch(`/api/top_researchers.php?${params}`);
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
  }, [sdg, countryFilter, search, sort, page, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters/sort change
  useEffect(() => { setPage(1); }, [sdg, countryFilter, search, sort]);

  // Auto-select first researcher on data load (only if none selected)
  useEffect(() => {
    if (data?.researchers?.length > 0 && !selectedResearcher) {
      setSelectedResearcher(data.researchers[0]);
    }
  }, [data, selectedResearcher]);

  const researchers   = data?.researchers           ?? [];
  const total         = data?.total                 ?? 0;
  const totalPages    = data?.total_pages           ?? 1;
  const distribution  = data?.distribution_by_sdg   ?? [];
  const countries     = data?.available_countries   ?? [];

  const resetFilters = () => {
    setSdg(0);
    setCountryFilter('');
    setSearch('');
    setSort('impact');
    setPage(1);
  };

  // Radar data for selected researcher
  const radarData = useMemo(() => {
    if (!selectedResearcher) return [];
    const maxH    = Math.max(50, ...researchers.map(r => r.h_index));
    const maxCit  = Math.max(1000, ...researchers.map(r => r.citations));
    const maxPub  = Math.max(100, ...researchers.map(r => r.publications));
    const maxClbs = Math.max(50, ...researchers.map(r => r.total_collabs));
    const intMax  = Math.max(25, ...researchers.map(r => r.international_collabs));
    return [
      { name: t('detail.hindex'),       value: Math.min(100, (selectedResearcher.h_index               / maxH)    * 100) },
      { name: t('detail.citations'),    value: Math.min(100, (selectedResearcher.citations             / maxCit)  * 100) },
      { name: t('detail.publications'), value: Math.min(100, (selectedResearcher.publications          / maxPub)  * 100) },
      { name: t('detail.collab_total'), value: Math.min(100, (selectedResearcher.total_collabs         / maxClbs) * 100) },
      { name: t('detail.collab_intl'),  value: Math.min(100, (selectedResearcher.international_collabs / intMax)  * 100) },
    ];
  }, [selectedResearcher, researchers, t]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const max   = Math.min(totalPages, 5);
    let start   = Math.max(1, page - 2);
    let end     = Math.min(totalPages, start + max - 1);
    start       = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const fromIdx = researchers.length > 0 ? (page - 1) * limit + 1 : 0;
  const toIdx   = (page - 1) * limit + researchers.length;

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

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
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('filter.search_placeholder')}
              className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-[15px] bg-white shadow-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sdg}
            onChange={e => setSdg(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={0}>{t('filter.sdg_all')}</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
            ))}
          </select>
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{t('filter.country_all')}</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-[15px] bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s} value={s}>{t(`filter.sort.${s}`)}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-[15px] text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {t('filter.reset')}
            </button>
          )}
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
          {/* Selected researcher detail */}
          {selectedResearcher && (
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl mb-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-600 mb-1 uppercase tracking-wide">{t('detail.title')}</p>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{selectedResearcher.name}</h3>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 shrink-0"
                  onClick={() => setSelectedResearcher(null)}
                  aria-label={t('detail.close')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: profile + metrics + top pubs */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-indigo-700">{getInitials(selectedResearcher.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] text-gray-700"><b>{t('detail.affiliation')}:</b> {selectedResearcher.affiliation || '—'}</p>
                      <p className="text-[15px] text-gray-700"><b>{t('detail.country')}:</b> {selectedResearcher.country || '—'}</p>
                      <p className="text-[15px] text-indigo-600 font-semibold mt-1">
                        {t('detail.impact_score')}: {selectedResearcher.impact_score}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-800 mb-2 text-[15px]">{t('detail.metrics')}</h4>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">{t('detail.hindex')}</p>
                      <p className="text-xl font-bold text-gray-900">{selectedResearcher.h_index}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">{t('detail.citations')}</p>
                      <p className="text-xl font-bold text-gray-900">{selectedResearcher.citations.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">{t('detail.publications')}</p>
                      <p className="text-xl font-bold text-gray-900">{selectedResearcher.publications}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-800 mb-2 text-[15px]">{t('detail.top_pubs')}</h4>
                  {selectedResearcher.top_publications?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedResearcher.top_publications.map((pub, i) => (
                        <li key={pub.doi || i} className="bg-white rounded-lg p-2.5 text-[15px]">
                          <Link
                            to={pub.doi ? `/doi/${encodeURIComponent(pub.doi)}` : '#'}
                            className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2 leading-tight"
                          >
                            {pub.title}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1 flex justify-between">
                            <span className="truncate">{pub.journal} ({pub.year})</span>
                            <span className="ml-2 shrink-0 font-semibold text-gray-700">
                              {pub.citations.toLocaleString()} cit
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{t('detail.no_top_pubs')}</p>
                  )}

                  {selectedResearcher.orcid && (
                    <Link
                      to={`/orcid/${encodeURIComponent(selectedResearcher.orcid)}`}
                      className="inline-flex items-center gap-1 mt-3 text-[15px] text-indigo-600 font-medium hover:text-indigo-700"
                    >
                      {t('detail.open_profile')} →
                    </Link>
                  )}
                </div>

                {/* Right column: radar + collab */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-[15px]">{t('detail.profile_radar')}</h4>
                  <div className="bg-white rounded-lg p-2">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                        <Tooltip formatter={v => Math.round(v)} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <h4 className="font-semibold text-gray-800 mt-4 mb-2 text-[15px]">{t('detail.collab_network')}</h4>
                  {selectedResearcher.total_collabs > 0 ? (
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex justify-around items-center mb-3">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('detail.collab_total')}</p>
                          <p className="text-lg font-bold text-indigo-700">{selectedResearcher.total_collabs}</p>
                        </div>
                        <div className="h-10 border-l border-gray-200"></div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('detail.collab_domestic')}</p>
                          <p className="text-lg font-bold text-blue-600">{selectedResearcher.domestic_collabs}</p>
                        </div>
                        <div className="h-10 border-l border-gray-200"></div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('detail.collab_intl')}</p>
                          <p className="text-lg font-bold text-green-600">{selectedResearcher.international_collabs}</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={90}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('detail.collab_domestic'), value: selectedResearcher.domestic_collabs,      color: '#3b82f6' },
                              { name: t('detail.collab_intl'),     value: selectedResearcher.international_collabs, color: '#10b981' },
                            ]}
                            cx="50%" cy="50%" innerRadius={22} outerRadius={38}
                            paddingAngle={2} dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{t('detail.no_collab')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Researcher table */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{t('table.title')}</h3>
              {total > 0 && (
                <span className="text-sm text-gray-500">
                  {t('pagination.showing', { from: fromIdx, to: toIdx, total: total.toLocaleString() })}
                </span>
              )}
            </div>

            {researchers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-[15px]">
                  <thead className="bg-gray-50 text-sm text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.researcher')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.affiliation')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.hindex')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.publications')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.citations')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.collab')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.impact_score')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {researchers.map(r => (
                      <tr
                        key={r.orcid}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedResearcher?.orcid === r.orcid ? 'bg-indigo-50/50' : ''
                        }`}
                        onClick={() => setSelectedResearcher(r)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-indigo-700">{getInitials(r.name)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[15px] font-medium text-gray-900 truncate">{r.name}</div>
                              <div className="text-xs text-gray-500 truncate font-mono">{r.orcid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[15px] text-gray-700 truncate max-w-[200px]">{r.affiliation || '—'}</div>
                          <div className="text-sm text-gray-500">{r.country || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-[15px] font-semibold text-gray-900">{r.h_index}</td>
                        <td className="px-4 py-3 text-right text-[15px] text-gray-700">{r.publications}</td>
                        <td className="px-4 py-3 text-right text-[15px] text-gray-700">{r.citations.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              {t('table.collab_domestic', { n: r.domestic_collabs })}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                              {t('table.collab_intl', { n: r.international_collabs })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBar value={r.impact_score} />
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
            {totalPages > 1 && researchers.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-[15px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('pagination.prev')}
                </button>
                <div className="flex gap-1">
                  {pageNumbers.map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`text-[15px] px-3 py-1.5 rounded-lg ${
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
                  className="text-[15px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('pagination.next')}
                </button>
              </div>
            )}
          </div>

          {/* Impact score explanation */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('explanation.title')}</h3>
            <p className="text-[15px] text-gray-600 mb-4">{t('explanation.subtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {['academic', 'citation', 'productivity', 'collab'].map(c => {
                const s = DIM_STYLE[c];
                return (
                  <div key={c} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${s.bg} ${s.icon}`}>
                        <ComponentIcon comp={c} />
                      </div>
                      <h4 className={`font-semibold text-sm ${s.text}`}>
                        {t(`explanation.components.${c}.title`)} ({t(`explanation.components.${c}.weight`)})
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(`explanation.components.${c}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution by SDG */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1">{t('distribution.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('distribution.subtitle')}</p>
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="sdg"
                    stroke="#6b7280"
                    fontSize={11}
                    tickFormatter={v => `SDG ${v}`}
                  />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    formatter={(v) => [v.toLocaleString(), t('distribution.researchers')]}
                    labelFormatter={(label) => {
                      const item = distribution.find(d => d.sdg === label);
                      return item ? `SDG ${label}: ${item.name}` : `SDG ${label}`;
                    }}
                  />
                  <Bar dataKey="researcher_count" radius={[4, 4, 0, 0]}>
                    {distribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptySection title={t('distribution.no_data.title')} subtitle={t('distribution.no_data.subtitle')} />
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default TopResearchers;