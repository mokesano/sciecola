import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ─── constants ─────────────────────────────────────────────────────────── */

const SDG_COLORS = {
  1:'#E5243B',2:'#DDA63A',3:'#4C9F38',4:'#C5192D',5:'#FF3A21',
  6:'#26BDE2',7:'#FCC30B',8:'#A21942',9:'#FD6925',10:'#DD1367',
  11:'#FD9D24',12:'#BF8B2E',13:'#3F7E44',14:'#0A97D9',15:'#56C02B',
  16:'#00689D',17:'#19486A',
};

const SINTA_STYLE = {
  S1:{ chip:'bg-emerald-100 text-emerald-800' },
  S2:{ chip:'bg-blue-100 text-blue-800'       },
  S3:{ chip:'bg-indigo-100 text-indigo-800'   },
  S4:{ chip:'bg-amber-100 text-amber-800'     },
  S5:{ chip:'bg-orange-100 text-orange-800'   },
  S6:{ chip:'bg-red-100 text-red-800'         },
};

const FACTOR_ICONS = {
  publications: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  citations:    'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  h_index:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  sdg_impact:   'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const IMPACT_WEIGHTS = { publications: 30, citations: 30, h_index: 20, sdg_impact: 20 };

/* ─── small components ──────────────────────────────────────────────────── */

function getInitials(name) {
  return (name || '')
    .replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(' ').slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

const RankBadge = ({ rank }) => {
  const cls = rank === 1
    ? 'text-yellow-600 bg-yellow-100 ring-2 ring-yellow-300'
    : rank === 2
      ? 'text-gray-500 bg-gray-200'
      : rank === 3
        ? 'text-amber-700 bg-amber-100'
        : 'text-gray-700 bg-gray-100';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-[15px] ${cls}`}>
      {rank}
    </span>
  );
};

const Avatar = ({ src, name }) => {
  const [err, setErr] = React.useState(false);
  if (!err && src) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className="w-10 h-10 rounded-full object-cover" />
    );
  }
  return (
    <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[15px] flex items-center justify-center">
      {getInitials(name)}
    </span>
  );
};

const SintaChip = ({ value }) => {
  if (!value) return null;
  const style = SINTA_STYLE[value] ?? { chip: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${style.chip}`}>
      SINTA {value.replace('S', '')}
    </span>
  );
};

/* ─── main component ─────────────────────────────────────────────────────── */

const Leaderboard = () => {
  const { t } = useTranslation('leaderboard');

  const [category, setCategory]     = useState('researchers');
  const [sdgFilter, setSdgFilter]   = useState(0);
  const [country, setCountry]       = useState('');

  const [data, setData]               = useState([]);
  const [summary, setSummary]         = useState(null);
  const [sdgDist, setSdgDist]         = useState([]);
  const [countries, setCountries]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [visibleCount, setVisible]    = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVisible(10);
    try {
      const params = new URLSearchParams({ type: category, limit: '20' });
      if (sdgFilter > 0) params.set('sdg', String(sdgFilter));
      if (country)       params.set('country', country);
      const res  = await fetch(`/api/leaderboard.php?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message || 'API error');
      setData(json.data ?? []);
      if (json.summary)             setSummary(json.summary);
      if (json.sdg_distribution)    setSdgDist(json.sdg_distribution);
      if (json.available_countries) setCountries(json.available_countries);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, sdgFilter, country]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => { setSdgFilter(0); setCountry(''); };
  const hasFilter    = sdgFilter > 0 || country !== '';

  /* ── summary stats ─────────────────────────────────────────────────── */
  const summaryCards = summary ? [
    { key: 'researchers',  value: summary.researchers.toLocaleString() },
    { key: 'publications', value: summary.publications.toLocaleString() },
    { key: 'citations',    value: summary.citations.toLocaleString() },
  ] : [];

  const STAT_ICONS = {
    researchers:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    publications: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    citations:    'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  };

  const visible = data.slice(0, visibleCount);

  /* ── table per category ─────────────────────────────────────────────── */
  const renderTable = () => {
    if (loading) {
      return (
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (error) return null;

    if (visible.length === 0) {
      const empty = hasFilter ? 'no_match' : 'no_data';
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p className="font-semibold text-gray-700">{t(`empty.${empty}.title`)}</p>
          <p className="text-[15px] text-gray-500">{t(`empty.${empty}.subtitle`)}</p>
          {hasFilter && (
            <button onClick={resetFilters}
              className="mt-1 px-4 py-2 text-[15px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              {t('filter.reset')}
            </button>
          )}
        </div>
      );
    }

    if (category === 'researchers') return renderResearchersTable();
    if (category === 'journals')    return renderJournalsTable();
    return renderInstitutionsTable();
  };

  const renderResearchersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 font-medium">{t('table.rank')}</th>
            <th className="px-6 py-4 font-medium">{t('table.researcher')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.publications')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.citations')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.h_index')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.impact')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visible.map((r) => (
            <tr key={r.rank} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4"><RankBadge rank={r.rank} /></td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.avatar} name={r.name} />
                  <div>
                    {r.orcid ? (
                      <Link to={`/orcid/${encodeURIComponent(r.orcid)}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                        {r.name}
                      </Link>
                    ) : (
                      <p className="font-semibold text-gray-900">{r.name}</p>
                    )}
                    <p className="text-[15px] text-gray-500">{r.institution}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{r.publications}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{(r.citations || 0).toLocaleString()}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{r.h_index}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-bold text-indigo-600 w-12 text-right">{r.impact}</span>
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${r.impact}%` }} />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJournalsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 font-medium">{t('table.rank')}</th>
            <th className="px-6 py-4 font-medium">{t('table.journal')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.citescore')}</th>
            <th className="px-6 py-4 font-medium text-center">{t('table.sinta')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.sjr')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.articles')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visible.map((j) => (
            <tr key={j.rank} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4"><RankBadge rank={j.rank} /></td>
              <td className="px-6 py-4">
                <p className="font-semibold text-gray-900">{j.name}</p>
                {j.issn && <p className="text-sm text-gray-500">ISSN {j.issn}</p>}
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{j.citescore}</td>
              <td className="px-6 py-4 text-center"><SintaChip value={j.sinta} /></td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{j.sjr}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{j.articles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderInstitutionsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 font-medium">{t('table.rank')}</th>
            <th className="px-6 py-4 font-medium">{t('table.institution')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.researchers')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.publications')}</th>
            <th className="px-6 py-4 font-medium text-right">{t('table.citations')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visible.map((inst) => (
            <tr key={inst.rank} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4"><RankBadge rank={inst.rank} /></td>
              <td className="px-6 py-4">
                <p className="font-semibold text-gray-900">{inst.name}</p>
                {inst.country && <p className="text-[15px] text-gray-500">{inst.country}</p>}
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{inst.researchers.toLocaleString()}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{inst.publications.toLocaleString()}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">{inst.citations.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ── achievements from top 3 ────────────────────────────────────────── */
  const achievements = category === 'researchers'
    ? data.slice(0, 3).map(r => ({
        name:        r.name,
        institution: r.institution,
        score:       r.impact,
        avatar:      r.avatar,
      }))
    : [];

  return (
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-8">
          <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('header.title')}</h1>
          <p className="text-gray-600 max-w-2xl">{t('header.subtitle')}</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {summaryCards.map((card) => (
              <div key={card.key} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={STAT_ICONS[card.key]} />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-[15px] text-gray-600">{t(`stats.${card.key}`)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Tabs + Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {['researchers', 'institutions', 'journals'].map(cat => (
            <button key={cat}
              onClick={() => { setCategory(cat); setSdgFilter(0); setCountry(''); }}
              className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}>
              {t(`filter.category.${cat}`)}
            </button>
          ))}

          <select value={sdgFilter} onChange={e => setSdgFilter(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[15px] text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value={0}>{t('filter.sdg_all')}</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
            ))}
          </select>

          {(category === 'researchers' || category === 'institutions') && (
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[15px] text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">{t('filter.country_all')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {hasFilter && (
            <button onClick={resetFilters}
              className="px-3 py-2 rounded-lg text-[15px] font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              {t('filter.reset')}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex flex-col items-center gap-3">
            <p className="text-red-700 font-medium">{t('error')}</p>
            <button onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-[15px] font-medium hover:bg-red-700 transition-colors">
              {t('retry')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-10">
          {loading && (
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 text-[15px] text-gray-500">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              {t('loading')}
            </div>
          )}
          {renderTable()}
          {!loading && !error && data.length > visibleCount && (
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button onClick={() => setVisible(v => v + 10)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-[15px] font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                {t('table.load_more')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Impact Score Method */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">{t('method.title')}</h3>
            <p className="text-[15px] text-gray-600 mb-4">{t('method.description')}</p>
            <div className="space-y-3">
              {Object.entries(IMPACT_WEIGHTS).map(([key, weight]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={FACTOR_ICONS[key]} />
                      </svg>
                    </div>
                    <span className="text-[15px] text-gray-700">{t(`method.factors.${key}`)}</span>
                  </div>
                  <span className="text-[15px] font-semibold text-gray-900">{weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* SDG Distribution */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">{t('sdg_dist.title')}</h3>
            <p className="text-[15px] text-gray-500 mb-4">{t('sdg_dist.subtitle')}</p>
            {sdgDist.length > 0 ? (
              <div className="space-y-2.5">
                {sdgDist.map((item, idx) => {
                  const max = sdgDist[0]?.count || 1;
                  return (
                    <div key={item.sdg} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: item.color }}>
                        {idx + 1}
                      </span>
                      <span className="text-[15px] text-gray-700 flex-1 truncate">{item.name}</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">{item.count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 text-center py-4">—</p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {t('achievements.title')}
            </h3>
            <p className="text-[15px] text-gray-600 mb-4">{t('achievements.description')}</p>
            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Avatar src={ach.avatar} name={ach.name} />
                    <div className="flex-grow min-w-0">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">{ach.name}</p>
                      <p className="text-sm text-gray-500 truncate">{ach.institution}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold text-indigo-600">{ach.score}</p>
                      <p className="text-xs text-gray-500">{t('achievements.score_label')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] text-gray-400 text-center py-4">—</p>
            )}
          </div>

        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">{t('cta.title')}</h3>
            <p className="text-indigo-100">{t('cta.subtitle')}</p>
          </div>
          <Link to="/"
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
            {t('cta.button')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

      </main>
  );
};

export default Leaderboard;