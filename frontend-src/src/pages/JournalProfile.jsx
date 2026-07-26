import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';

const SDG_COLORS = {
  1: '#e5243b',  2: '#dda63a',  3: '#4c9f38',  4: '#c5192d',
  5: '#ff3a21',  6: '#26bde2',  7: '#fcc30b',  8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a',
};

const extractISSNFromId = (journalId) => {
  if (!journalId) return null;
  if (/^\d{4}-\d{4}$/.test(journalId)) return journalId;
  if (/^\d{7}[\dXx]$/.test(journalId)) return journalId.slice(0, 4) + '-' + journalId.slice(4);
  return null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-sm text-indigo-600">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

const EmptySection = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

const ICON_CHART = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
const ICON_DOC   = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
const ICON_SDG   = 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
const ICON_DB    = 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4';

const JournalProfile = () => {
  const { t } = useTranslation('journal_profile');
  const { journalId } = useParams();
  const [journal, setJournal]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('ringkasan');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const issn = extractISSNFromId(journalId);
      if (!issn) {
        // The user-supplied id couldn't be resolved into an ISSN — that *is*
        // a user-input issue, so we still surface a "not found" state.
        setNotFound(true);
        return;
      }
      const res  = await fetch(`/api/journal_profile.php?issn=${encodeURIComponent(issn)}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setJournal(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('[JournalProfile] fetch failed:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [journalId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !journal) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found.title')}</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{t('not_found.message', { id: journalId })}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={fetchProfile} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              {t('not_found.retry')}
            </button>
            <Link to="/journals" className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              {t('not_found.home')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const j = journal;
  const publicationTrend = Array.isArray(j.publicationTrend) ? j.publicationTrend : [];
  const citationTrend    = Array.isArray(j.citationTrend)    ? j.citationTrend    : [];
  const sdgDistribution  = Array.isArray(j.sdgDistribution)  ? j.sdgDistribution  : [];
  const topArticles      = Array.isArray(j.topArticles)      ? j.topArticles      : [];
  const accessStats      = Array.isArray(j.accessStats)      ? j.accessStats      : [];
  const indexing         = Array.isArray(j.indexing)         ? j.indexing         : [];

  const sdgPalette = (entry) => SDG_COLORS[entry.sdg] || entry.color || '#6b7280';

  const TABS = [
    { id: 'ringkasan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'artikel',   icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { id: 'statistik', icon: ICON_CHART },
    { id: 'sdgs',      icon: ICON_SDG },
    { id: 'informasi', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0">
              <img
                src={j.coverImage || '/assets/img/journal-default.svg'}
                alt={j.name || ''}
                className="w-full sm:w-48 h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => { e.target.src = '/assets/img/journal-default.svg'; }}
              />
            </div>

            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{j.name || '—'}</h1>
              {j.issn && <p className="text-gray-600 mb-4">{t('header.issn', { value: j.issn })}</p>}

              <div className="space-y-2 text-sm">
                {j.publisher && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{t('header.publisher')} <span className="font-medium text-gray-900">{j.publisher}</span></span>
                  </div>
                )}
                {j.website && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={j.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-medium truncate">
                      {t('header.website', { value: j.website.replace(/^https?:\/\//, '') })}
                    </a>
                  </div>
                )}
                {j.subject && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{t('header.subject')} <span className="font-medium text-gray-900">{j.subject}</span></span>
                  </div>
                )}
                {j.country && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t('header.country')} <span className="font-medium text-gray-900">{j.country}</span></span>
                  </div>
                )}
                {j.language && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>{t('header.language')} <span className="font-medium text-gray-900">{j.language}</span></span>
                  </div>
                )}
                {j.established && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t('header.established')} <span className="font-medium text-gray-900">{j.established}</span></span>
                  </div>
                )}
                {j.frequency && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('header.frequency')} <span className="font-medium text-gray-900">{j.frequency}</span></span>
                  </div>
                )}
              </div>

              {j.website && (
                <a href={j.website} target="_blank" rel="noopener noreferrer"
                  className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                  <span>{t('header.visit_website')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'articles',  value: j.totalArticles    ?? 0 },
              { key: 'authors',   value: (j.totalAuthors    ?? 0).toLocaleString() },
              { key: 'citations', value: (j.totalCitations  ?? 0).toLocaleString() },
              { key: 'views',     value: (j.totalViews      ?? 0).toLocaleString() },
              { key: 'citescore', value: (j.citescore ?? j.impactScore ?? 0).toFixed ? (j.citescore ?? j.impactScore ?? 0).toFixed(2) : (j.citescore ?? 0) },
              { key: 'sdgs',      value: j.sdgsCovered ?? 0 },
            ].map((s) => (
              <div key={s.key} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-600 mt-1">{t(`header.stats.${s.key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              {t(`tabs.${tab.id}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { key: 'total_articles',  value: j.totalArticles    ?? 0 },
              { key: 'total_authors',   value: j.totalAuthors     ?? 0 },
              { key: 'total_citations', value: j.totalCitations   ?? 0 },
              { key: 'total_views',     value: j.totalViews       ?? 0 },
              { key: 'impact_score',    value: j.impactScore      ?? 0 },
              { key: 'sdgs_covered',    value: j.sdgsCovered      ?? 0 },
            ].map((s) => (
              <div key={s.key} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ICON_CHART} />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                  <p className="text-xs text-gray-600">{t(`ringkasan.stats.${s.key}`)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('ringkasan.publication_trend')}</h3>
              {publicationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={publicationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('header.stats.articles')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection icon={ICON_CHART} message={t('ringkasan.no_publication_trend')} />
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('ringkasan.citation_trend')}</h3>
              {citationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={citationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name={t('header.stats.citations')} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection icon={ICON_CHART} message={t('ringkasan.no_citation_trend')} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('ringkasan.performance')}</h3>
              <div className="space-y-4">
                {[
                  { key: 'acceptance_rate',    value: j.acceptanceRate },
                  { key: 'review_time',        value: j.avgReviewTime },
                  { key: 'publish_time',       value: j.avgPublishTime },
                  { key: 'cites_per_article',  value: j.citationsPerArticle },
                  { key: 'hindex',             value: j.hIndex },
                ].filter((m) => m.value !== undefined && m.value !== null && m.value !== '').map((m) => (
                  <div key={m.key} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{t(`performance_metrics.${m.key}`)}</span>
                    <span className="font-bold text-gray-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{t('ringkasan.top_articles')}</h3>
                {topArticles.length > 0 && (
                  <button onClick={() => setActiveTab('artikel')} className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                    {t('ringkasan.view_all')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              {topArticles.length > 0 ? (
                <div className="space-y-4">
                  {topArticles.slice(0, 3).map((art) => (
                    <Link key={art.id ?? art.doi} to={`/doi/${encodeURIComponent(art.doi)}`} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <img src={art.thumbnail || '/assets/img/article-default.svg'} alt={art.title}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }} />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{art.title}</h4>
                        {art.volume && <p className="text-xs text-gray-500 mb-2">{art.volume}</p>}
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                          {t('ringkasan.citations_unit', { count: art.citations || 0 })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySection icon={ICON_DOC} message={t('ringkasan.no_top_articles')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Artikel */}
      {activeTab === 'artikel' && (
        <div>
          {topArticles.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h2 className="text-xl font-bold text-gray-900">{t('artikel.title', { count: topArticles.length })}</h2>
                <div className="flex gap-3 flex-wrap">
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                    <option>{t('artikel.all_years')}</option>
                  </select>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                    <option>{t('artikel.sort_citations')}</option>
                    <option>{t('artikel.sort_newest')}</option>
                    <option>{t('artikel.sort_views')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                {topArticles.map((art) => (
                  <Link key={art.id ?? art.doi} to={`/doi/${encodeURIComponent(art.doi)}`}
                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all block">
                    <div className="flex gap-5">
                      <img src={art.thumbnail || '/assets/img/article-default.svg'} alt={art.title}
                        className="w-24 h-20 object-cover rounded-xl shrink-0"
                        onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }} />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-2">{art.title}</h3>
                        {art.volume && <p className="text-sm text-gray-600 mb-3">{art.volume}</p>}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                            {t('artikel.citations_unit', { count: art.citations || 0 })}
                          </span>
                          {art.doi && <span className="text-sm text-gray-500 truncate">{t('artikel.doi_label', { doi: art.doi })}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to="/articles" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                  {t('artikel.view_all')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm">
              <EmptySection icon={ICON_DOC} message={t('artikel.empty')} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Statistik */}
      {activeTab === 'statistik' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('statistik.publication_trend')}</h3>
              {publicationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={publicationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('header.stats.articles')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection icon={ICON_CHART} message={t('ringkasan.no_publication_trend')} />
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{t('statistik.citation_trend')}</h3>
              {citationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={citationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="citations" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name={t('header.stats.citations')} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptySection icon={ICON_CHART} message={t('ringkasan.no_citation_trend')} />
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('statistik.monthly_access')}</h3>
            {accessStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={accessStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name={t('header.stats.views')} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptySection icon={ICON_CHART} message={t('ringkasan.no_publication_trend')} />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('statistik.performance')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'acceptance_rate',   value: j.acceptanceRate },
                { key: 'review_time',       value: j.avgReviewTime },
                { key: 'publish_time',      value: j.avgPublishTime },
                { key: 'cites_per_article', value: j.citationsPerArticle },
                { key: 'hindex',            value: j.hIndex },
              ].filter((m) => m.value !== undefined && m.value !== null && m.value !== '').map((m) => (
                <div key={m.key} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-indigo-700 mb-1">{m.value}</p>
                  <p className="text-xs text-gray-600">{t(`performance_metrics.${m.key}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: SDGs */}
      {activeTab === 'sdgs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('sdgs_tab.distribution')}</h3>
            {sdgDistribution.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={sdgDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {sdgDistribution.map((entry, i) => <Cell key={i} fill={sdgPalette(entry)} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-grow space-y-3">
                  {sdgDistribution.map((sdg, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sdgPalette(sdg) }} />
                      <span className="text-gray-700 text-sm flex-grow">{sdg.name}</span>
                      <span className="font-bold text-gray-900 text-sm">{sdg.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptySection icon={ICON_SDG} message={t('sdgs_tab.empty')} />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('sdgs_tab.percentage')}</h3>
            {sdgDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sdgDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={120} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="%">
                      {sdgDistribution.map((entry, i) => <Cell key={i} fill={sdgPalette(entry)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-4 text-center">{t('sdgs_tab.total_covered', { count: j.sdgsCovered ?? sdgDistribution.length })}</p>
              </>
            ) : (
              <EmptySection icon={ICON_SDG} message={t('sdgs_tab.empty')} />
            )}
          </div>
        </div>
      )}

      {/* Tab: Informasi */}
      {activeTab === 'informasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('informasi.indexing')}</h3>
            {indexing.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {indexing.map((db, idx) => (
                  <div key={idx} className="flex items-center justify-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="font-semibold text-indigo-700">{db}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection icon={ICON_DB} message={t('informasi.no_indexing')} />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('informasi.journal_info')}</h3>
            <div className="space-y-3 text-sm">
              {[
                { key: 'eissn',          value: j.eissn },
                { key: 'pissn',          value: j.pissn },
                { key: 'publisher',      value: j.publisher },
                { key: 'country',        value: j.country },
                { key: 'language',       value: j.language },
                { key: 'established',    value: j.established },
                { key: 'frequency',      value: j.frequency },
                { key: 'indexing_count', value: indexing.length > 0 ? t('informasi.database_unit', { count: indexing.length }) : null },
              ].filter((f) => f.value).map((f) => (
                <div key={f.key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{t(`informasi.fields.${f.key}`)}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-xs">{f.value}</span>
                </div>
              ))}
            </div>

            {j.scope && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{t('informasi.scope')}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{j.scope}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg mt-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">{t('cta.title')}</h3>
            <p className="text-indigo-100">{t('cta.subtitle')}</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <input type="text" placeholder={t('cta.placeholder')}
              className="flex-grow lg:w-80 px-4 py-3 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none" />
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
              {t('cta.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default JournalProfile;
