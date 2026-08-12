import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';

// UN official SDG colour palette (1..17) — inline style only (Tailwind cannot do dynamic hex)
const SDG_COLORS = {
  1: '#e5243b',  2: '#dda63a',  3: '#4c9f38',  4: '#c5192d',
  5: '#ff3a21',  6: '#26bde2',  7: '#fcc30b',  8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a',
};

const SDG_NUMBERS = Array.from({ length: 17 }, (_, i) => i + 1);
const YEAR_OPTIONS = (() => {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2, now - 3, now - 4];
})();

const ArticleList = () => {
  const { t } = useTranslation('articles');

  const [articles, setArticles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedSDG, setSelectedSDG]   = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy]             = useState('relevance');
  const [viewMode, setViewMode]         = useState('list');

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 20,
          sort:   sortBy === 'relevance' ? 'recent' : sortBy === 'date' ? 'recent' : sortBy,
          search: searchQuery,
          sdg:    selectedSDG === 'all' ? 0 : selectedSDG,
          year:   selectedYear === 'all' ? 0 : selectedYear,
        });

        const response = await fetch(`/api/articles.php?${params}`);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Unexpected response');
        }

        const sourceList = Array.isArray(data.data) ? data.data : [];
        const transformed = sourceList.map((row) => ({
          doi:           row.doi,
          title:         row.title || '',
          authors:       Array.isArray(row.authors) ? row.authors : [],
          journal:       row.journal || '',
          year:          row.year || row.published_date || '',
          citations:     row.citations || 0,
          views:         row.views     || 0,
          downloads:     row.downloads || 0,
          sdgFocus:      Array.isArray(row.sdgs) ? row.sdgs : [],
          articleType:   row.type || '',
          thumbnail:     row.thumbnail || '/assets/img/article-default.svg',
        }));

        setArticles(transformed);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total || 0);
      } catch (err) {
        console.error('[ArticleList] fetch failed:', err);
        setArticles([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [page, sortBy, searchQuery, selectedSDG, selectedYear]);

  const resetAll = () => {
    setSelectedSDG('all');
    setSelectedYear('all');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters =
    selectedSDG !== 'all' || selectedYear !== 'all' || searchQuery.trim() !== '';

  const formatNumber = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
    return String(num);
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
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
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-m focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSDG}
              onChange={(e) => { setSelectedSDG(e.target.value); setPage(1); }}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">{t('filters.all_sdgs')}</option>
              {SDG_NUMBERS.map((n) => (
                <option key={n} value={n}>{t('filters.sdg_label', { number: n })}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">{t('filters.all_years')}</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="relevance">{t('filters.sort.relevance')}</option>
              <option value="citations">{t('filters.sort.citations')}</option>
              <option value="views">{t('filters.sort.views')}</option>
              <option value="date">{t('filters.sort.date')}</option>
            </select>
          </div>
        </div>

        {(selectedSDG !== 'all' || selectedYear !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
            <span className="text-[15px] text-gray-500">{t('filters.active_label')}</span>
            {selectedSDG !== 'all' && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-1">
                {t('filters.sdg_label', { number: selectedSDG })}
                <button onClick={() => setSelectedSDG('all')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedYear !== 'all' && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-1">
                {t('filters.year_label', { year: selectedYear })}
                <button onClick={() => setSelectedYear('all')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-1">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button onClick={resetAll} className="text-sm text-gray-500 hover:text-gray-700 font-medium ml-2">
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
      {!loading && articles.length > 0 && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600 text-[15px]">
              <Trans
                i18nKey="results.count"
                ns="articles"
                values={{ shown: articles.length, total: totalResults }}
                components={{ strong: <span className="font-bold text-gray-900" /> }}
              />
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                aria-label={t('results.view.list_aria')}
                className={`p-2 border rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('card')}
                aria-label={t('results.view.card_aria')}
                className={`p-2 border rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.doi}
                  to={`/doi/${encodeURIComponent(article.doi)}`}
                  className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="shrink-0">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full md:w-48 h-32 object-cover rounded-xl"
                        onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-xl mb-2 leading-tight transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.authors.length > 0 && (
                        <p className="text-gray-600 text-[15px] mb-2 line-clamp-1">{article.authors.join(', ')}</p>
                      )}
                      <p className="text-gray-500 text-[15px] mb-3">
                        {article.journal && <span className="font-medium text-gray-700">{article.journal}</span>}
                        {article.journal && article.year ? ' • ' : ''}
                        {article.year && <span>{article.year}</span>}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.sdgFocus.map((sdg) => (
                          <span
                            key={sdg}
                            className="px-2.5 py-1 text-white rounded-lg text-xs font-bold shadow-sm"
                            style={{ backgroundColor: SDG_COLORS[sdg] || '#6b7280' }}
                          >
                            SDG {sdg}
                          </span>
                        ))}
                        {article.articleType && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            {article.articleType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-0 border-gray-50 shrink-0">
                      <div className="text-center md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5 mb-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                          <span className="text-lg font-bold text-gray-900">{article.citations}</span>
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.citations')}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5 mb-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          <span className="text-lg font-bold text-gray-900">{formatNumber(article.views)}</span>
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.views')}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5 mb-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          <span className="text-lg font-bold text-gray-900">{formatNumber(article.downloads)}</span>
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.downloads')}</p>
                      </div>
                      <div className="md:ml-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article) => (
                <Link
                  key={article.doi}
                  to={`/doi/${encodeURIComponent(article.doi)}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all overflow-hidden flex flex-col"
                >
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-36 object-cover"
                    onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
                  />
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-base mb-2 leading-snug transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.authors.length > 0 && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">{article.authors.join(', ')}</p>
                    )}
                    <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                      {article.journal && <span className="font-medium text-gray-700">{article.journal}</span>}
                      {article.journal && article.year ? ' • ' : ''}
                      {article.year && <span>{article.year}</span>}
                    </p>
                    {article.sdgFocus.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {article.sdgFocus.slice(0, 4).map((sdg) => (
                          <span
                            key={sdg}
                            className="px-2 py-0.5 text-white rounded text-xs font-bold"
                            style={{ backgroundColor: SDG_COLORS[sdg] || '#6b7280' }}
                          >
                            SDG {sdg}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{formatNumber(article.citations)}</p>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.citations')}</p>
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{formatNumber(article.views)}</p>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.views')}</p>
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{formatNumber(article.downloads)}</p>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{t('results.metrics.downloads')}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty states */}
      {!loading && articles.length === 0 && hasActiveFilters && (
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

      {!loading && articles.length === 0 && !hasActiveFilters && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.no_data.title')}</h3>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto">{t('empty.no_data.subtitle')}</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && articles.length > 0 && totalPages > 1 && (
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

export default ArticleList;
