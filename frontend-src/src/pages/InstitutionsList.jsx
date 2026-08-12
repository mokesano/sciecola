import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingSpinner } from '../components/shared';

const InstitutionsList = () => {
  const { t } = useTranslation('institutions');

  const [searchQueryLocal, setSearchQueryLocal] = useState('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCountry, setSelectedCountry]   = useState('all');
  const [sortBy, setSortBy]                     = useState('publications');
  const [viewMode, setViewMode]                 = useState('card');
  const [institutions, setInstitutions]         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQueryLocal(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setSearchQuery(value), 300);
  };

  useEffect(() => {
    const fetchInstitutions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCountry !== 'all') params.append('country', selectedCountry);
        if (searchQuery) params.append('search', searchQuery);
        params.append('sort', sortBy);
        params.append('limit', '50');

        const response = await fetch(`/api/institutions.php?${params}`);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message || 'Unexpected response');

        setInstitutions(Array.isArray(data.institutions) ? data.institutions : []);
      } catch (err) {
        console.error('[InstitutionsList] fetch failed:', err);
        setInstitutions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, [selectedCountry, searchQuery, sortBy]);

  // Country options derived from the live API response — no static list.
  const countries = useMemo(() => {
    const uniq = new Set(institutions.map((i) => i.country).filter(Boolean));
    return ['all', ...Array.from(uniq).sort()];
  }, [institutions]);

  const hasActiveFilters = selectedCountry !== 'all' || searchQuery.trim() !== '';
  const resetAll = () => {
    setSelectedCountry('all');
    setSearchQuery('');
    setSearchQueryLocal('');
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">{t('header.subtitle')}</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder={t('filters.search_placeholder')}
              value={searchQueryLocal}
              onChange={handleSearchChange}
              aria-label={t('filters.search_placeholder')}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-m focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c === 'all' ? t('filters.all_countries') : c}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-[15px] font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="relevance">{t('filters.sort.relevance')}</option>
              <option value="publications">{t('filters.sort.publications')}</option>
              <option value="citations">{t('filters.sort.citations')}</option>
              <option value="hIndex">{t('filters.sort.hIndex')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {/* Results */}
      {!loading && institutions.length > 0 && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600 text-[15px]">
              <Trans
                i18nKey="results.count"
                ns="institutions"
                values={{ shown: institutions.length }}
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

          <div className={viewMode === 'card' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-4'}>
            {institutions.map((inst) => (
              <Link
                key={inst.id}
                to={`/institutions/${inst.id}`}
                className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all"
              >
                <div className="flex gap-6">
                  <div className="shrink-0">
                    <img
                      src={inst.logo || '/assets/img/institution-default.svg'}
                      alt={`${inst.name} logo`}
                      onError={(e) => { e.target.src = '/assets/img/institution-default.svg'; }}
                      className="w-24 h-24 object-contain rounded-xl bg-gray-50 p-2 group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors truncate">{inst.name}</h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {inst.type && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-sm font-medium">{inst.type}</span>
                          )}
                          {inst.country && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">{inst.country}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(inst.established_year || inst.website) && (
                      <p className="text-[15px] text-gray-500 mb-4">
                        {inst.established_year && (
                          <span>{t('results.established', { year: inst.established_year })}</span>
                        )}
                        {inst.established_year && inst.website ? ' • ' : ''}
                        {inst.website && (
                          <span>{(inst.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                        )}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{(inst.publications || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 uppercase">{t('results.metrics.publications')}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{(inst.researchers || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 uppercase">{t('results.metrics.researchers')}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{inst.hIndex || 0}</p>
                        <p className="text-xs text-gray-500 uppercase">{t('results.metrics.hindex')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {t('results.footer.journals', { count: inst.journals || 0 })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {t('results.footer.collaborations', { count: inst.collaborations || 0 })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('results.footer.sdgs', { count: (inst.sdgs && inst.sdgs.length) || 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Empty: no match */}
      {!loading && institutions.length === 0 && hasActiveFilters && (
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
      {!loading && institutions.length === 0 && !hasActiveFilters && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.no_data.title')}</h3>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto">{t('empty.no_data.subtitle')}</p>
        </div>
      )}
    </main>
  );
};

export default InstitutionsList;
