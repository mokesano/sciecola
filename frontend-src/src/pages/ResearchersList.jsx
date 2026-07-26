import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';

// UN official SDG colour palette (1..17)
const SDG_COLORS = {
  1: '#e5243b',  2: '#dda63a',  3: '#4c9f38',  4: '#c5192d',
  5: '#ff3a21',  6: '#26bde2',  7: '#fcc30b',  8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a',
};

const SDG_NUMBERS = Array.from({ length: 17 }, (_, i) => i + 1);

const ResearchersList = () => {
  const { t } = useTranslation('researchers');

  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSdg, setSelectedSdg]       = useState('all');
  const [sortBy, setSortBy]                 = useState('citations');
  const [page, setPage]                     = useState(1);

  const [researchers, setResearchers]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalResults, setTotalResults]   = useState(0);

  useEffect(() => {
    const fetchResearchers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:   page,
          limit:  20,
          sort:   sortBy === 'relevance' ? 'citations' : sortBy,
          search: searchQuery,
          sdg:    selectedSdg === 'all' ? 0 : selectedSdg,
        });

        const response = await fetch(`/api/researchers.php?${params}`);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Unexpected response');
        }

        const sourceList = Array.isArray(data.data) ? data.data : [];
        const transformed = sourceList.map((row) => ({
          orcid:        row.orcid,
          name:         row.name,
          avatar:       row.avatar || null,
          univ:         row.affiliation || '',
          country:      row.country || '',
          citations:    row.citations    || 0,
          hIndex:       row.h_index      || 0,
          publications: row.publications || 0,
          sdgFocus:     Array.isArray(row.focus_sdgs) ? row.focus_sdgs : [],
          researchInterests: Array.isArray(row.research_interests) ? row.research_interests : [],
        }));

        setResearchers(transformed);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total || 0);
      } catch (err) {
        // Fetch failure is treated as "no data" empty state, not an error UI.
        // Log for diagnostics; user sees the informative empty state below.
        console.error('[ResearchersList] fetch failed:', err);
        setResearchers([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResearchers();
  }, [page, sortBy, searchQuery, selectedSdg]);

  // Country options derived from the current result set (no mock data).
  const countries = useMemo(() => {
    const uniq = new Set(
      researchers.map((r) => r.country).filter(Boolean)
    );
    return ['all', ...Array.from(uniq).sort()];
  }, [researchers]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000)    return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const avatarFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'R')}&background=random&size=128`;

  const resetAll = () => {
    setSelectedCountry('all');
    setSelectedSdg('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCountry !== 'all' || selectedSdg !== 'all' || searchQuery.trim() !== '';

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
        <span className="text-gray-900">{t('breadcrumb.current')}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">{t('header.subtitle')}</p>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder={t('filters.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-m focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c === 'all' ? t('filters.all_countries') : c}</option>
              ))}
            </select>

            <select
              value={selectedSdg}
              onChange={(e) => setSelectedSdg(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              <option value="all">{t('filters.all_sdgs')}</option>
              {SDG_NUMBERS.map((n) => (
                <option key={n} value={n}>{t('filters.sdg_label', { number: n })}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              <option value="relevance">{t('filters.sort.relevance')}</option>
              <option value="citations">{t('filters.sort.citations')}</option>
              <option value="hIndex">{t('filters.sort.hIndex')}</option>
              <option value="publications">{t('filters.sort.publications')}</option>
              <option value="name">{t('filters.sort.name')}</option>
            </select>
          </div>
        </div>

        {(selectedCountry !== 'all' || selectedSdg !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
            <span className="text-sm text-gray-500">{t('filters.active_label')}</span>
            {selectedCountry !== 'all' && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
                {selectedCountry}
                <button onClick={() => setSelectedCountry('all')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedSdg !== 'all' && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
                {t('filters.sdg_label', { number: selectedSdg })}
                <button onClick={() => setSelectedSdg('all')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2">
              {t('filters.reset_all')}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {researchers.length > 0 && (
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600 text-sm">
                <Trans
                  i18nKey="results.count"
                  ns="researchers"
                  values={{ shown: researchers.length, total: totalResults }}
                  components={{ strong: <span className="font-bold text-gray-900" /> }}
                />
              </p>
            </div>
          )}

          {researchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchers.map((pro) => (
                <Link
                  key={pro.orcid}
                  to={`/orcid/${pro.orcid}`}
                  className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={pro.avatar ?? avatarFallback(pro.name)}
                      alt={pro.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.src = avatarFallback(pro.name); }}
                    />
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-lg leading-tight mb-0.5 truncate">
                        {pro.name}
                      </h3>
                      <p className="text-sm text-indigo-600 font-medium">{t('results.title_role')}</p>
                      <p className="text-xs text-gray-500 truncate">{pro.univ}</p>
                    </div>
                  </div>

                  {pro.sdgFocus.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pro.sdgFocus.map((sdg) => (
                        <span
                          key={sdg}
                          className="px-2 py-0.5 text-white rounded text-[10px] font-bold"
                          style={{ backgroundColor: SDG_COLORS[sdg] || '#6b7280' }}
                          title={t('filters.sdg_label', { number: sdg })}
                        >
                          {sdg}
                        </span>
                      ))}
                    </div>
                  )}

                  {pro.researchInterests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">{t('results.interests')}</p>
                      <div className="flex flex-wrap gap-1">
                        {pro.researchInterests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px]">
                            {interest}
                          </span>
                        ))}
                        {pro.researchInterests.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-400 text-[10px]">
                            +{pro.researchInterests.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{formatNumber(pro.citations)}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{t('results.metrics.citations')}</p>
                    </div>
                    <div className="text-center border-l border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{pro.hIndex}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{t('results.metrics.h_index')}</p>
                    </div>
                    <div className="text-center border-l border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{pro.publications}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{t('results.metrics.publications')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    {pro.country && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{pro.country}</span>
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-auto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : hasActiveFilters ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.no_match.title')}</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{t('empty.no_match.subtitle')}</p>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('empty.no_match.reset')}
              </button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.no_data.title')}</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">{t('empty.no_data.subtitle')}</p>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && researchers.length > 0 && totalPages > 1 && (
        <div className="mt-10 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.prev')}
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-2 text-gray-400">…</span>
              <button
                onClick={() => setPage(totalPages)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}
    </main>
  );
};

export default ResearchersList;
