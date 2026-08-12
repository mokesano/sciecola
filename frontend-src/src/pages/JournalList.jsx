import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';

const SDG_COLORS = {
  1: '#e5243b',  2: '#dda63a',  3: '#4c9f38',  4: '#c5192d',
  5: '#ff3a21',  6: '#26bde2',  7: '#fcc30b',  8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a',
};

const JournalList = () => {
  const { t } = useTranslation('journals');

  const [searchQuery, setSearchQuery]   = useState('');
  const [sortBy, setSortBy]             = useState('citescore');
  const [page, setPage]                 = useState(1);
  const [viewMode, setViewMode]         = useState('list');

  const [journals, setJournals]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 20,
          sort:  sortBy,
          search: searchQuery,
          sdg: 0,
        });
        const response = await fetch(`/api/journals.php?${params}`);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message || 'Unexpected response');

        const sourceList = Array.isArray(data.data) ? data.data : [];
        const transformed = sourceList.map((row) => ({
          id:        row.id,
          name:      row.name      || '',
          issn:      row.issn      || '',
          publisher: row.publisher || '',
          quartile:  row.quartile  || 'N/A',
          sjr:       (typeof row.sjr === 'number' ? row.sjr.toFixed(2) : (row.sjr || '0.00')),
          hIndex:    String(row.total_articles ?? row.hindex ?? 0),
          citescore: row.citescore || 0,
          sdgFocus:  Array.isArray(row.focus_sdgs) ? row.focus_sdgs : [],
        }));

        setJournals(transformed);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total || 0);
      } catch (err) {
        console.error('[JournalList] fetch failed:', err);
        setJournals([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [page, sortBy, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '';
  const resetAll = () => { setSearchQuery(''); setPage(1); };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">{t('breadcrumb.home')}</Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <span className="text-gray-900">{t('breadcrumb.current')}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">{t('header.subtitle')}</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder={t('filters.search_placeholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="citescore">{t('filters.sort.citescore')}</option>
          <option value="quartile">{t('filters.sort.quartile')}</option>
          <option value="name">{t('filters.sort.name')}</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {!loading && journals.length > 0 && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-[15px] text-gray-600">
              <Trans
                i18nKey="results.count"
                ns="journals"
                values={{ shown: journals.length, total: totalResults }}
                components={{ strong: <span className="font-bold text-gray-900" /> }}
              />
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                aria-label={t('filters.view.list_aria')}
                className={`p-2 border rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              </button>
              <button
                onClick={() => setViewMode('card')}
                aria-label={t('filters.view.card_aria')}
                className={`p-2 border rounded-lg transition-colors ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-6">
              {journals.map((journal) => (
                <Link
                  key={journal.id}
                  to={`/journals/${journal.id}`}
                  className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="flex gap-5 items-start">
                    <div className="w-16 h-20 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-400 border border-indigo-100 shrink-0">
                      <span className="text-xs font-bold">JOURNAL</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-lg transition-colors leading-tight mb-1">{journal.name}</h3>
                      <p className="text-gray-500 text-[15px] mb-3">
                        {t('results.issn_publisher', { issn: journal.issn || '—', publisher: journal.publisher || '—' })}
                      </p>
                      {journal.sdgFocus.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {journal.sdgFocus.map((sdg) => (
                            <span key={sdg} className="px-2 py-0.5 text-white rounded text-xs font-bold" style={{ backgroundColor: SDG_COLORS[sdg] || '#6b7280' }}>
                              SDG {sdg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-50">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.quartile')}</p>
                      <span className="text-lg font-black text-emerald-600">{journal.quartile}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.sjr')}</p>
                      <span className="text-lg font-black text-gray-900">{journal.sjr}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.hindex')}</p>
                      <span className="text-lg font-black text-gray-900">{journal.hIndex}</span>
                    </div>
                    <div className="ml-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {journals.map((journal) => (
                <Link
                  key={journal.id}
                  to={`/journals/${journal.id}`}
                  className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-14 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-400 border border-indigo-100 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-base transition-colors leading-tight line-clamp-2 mb-1">{journal.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {t('results.issn_publisher', { issn: journal.issn || '—', publisher: journal.publisher || '—' })}
                      </p>
                    </div>
                  </div>

                  {journal.sdgFocus.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {journal.sdgFocus.slice(0, 4).map((sdg) => (
                        <span key={sdg} className="px-2 py-0.5 text-white rounded text-xs font-bold" style={{ backgroundColor: SDG_COLORS[sdg] || '#6b7280' }}>
                          SDG {sdg}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.quartile')}</p>
                      <span className="text-[15px] font-black text-emerald-600">{journal.quartile}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.sjr')}</p>
                      <span className="text-[15px] font-black text-gray-900">{journal.sjr}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('results.metrics.hindex')}</p>
                      <span className="text-[15px] font-black text-gray-900">{journal.hIndex}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty: no match */}
      {!loading && journals.length === 0 && hasActiveFilters && (
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
          <p className="text-gray-500 text-[15px] mb-6 max-w-md mx-auto">{t('empty.no_match.subtitle')}</p>
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[15px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('empty.no_match.reset')}
          </button>
        </div>
      )}

      {/* Empty: no data */}
      {!loading && journals.length === 0 && !hasActiveFilters && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.no_data.title')}</h3>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto">{t('empty.no_data.subtitle')}</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && journals.length > 0 && totalPages > 1 && (
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

export default JournalList;
