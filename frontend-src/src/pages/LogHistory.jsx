import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

/**
 * Log History — riwayat aktivitas akun yang login.
 * Sumber data: /api/my_activity.php (tabel user_activity_log + cadangan file).
 * Tidak ada data contoh: bila belum ada aktivitas, halaman menampilkan keadaan kosong.
 */

// Ikon/warna kartu statistik (label dari i18n). `type` = jenis aktivitas di API.
const STAT_META = [
  { key: 'views',     type: 'viewed',     icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'searches',  type: 'searched',   icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'text-purple-600 bg-purple-50' },
  { key: 'saves',     type: 'saved',      icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', color: 'text-blue-600 bg-blue-50' },
  { key: 'downloads', type: 'downloaded', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-green-600 bg-green-50' },
  { key: 'shares',    type: 'shared',     icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'text-orange-600 bg-orange-50' },
];

const TIME_RANGES = ['all', 'today', '7days', '30days', '3months', 'year'];
// id filter UI -> jenis aktivitas di API
const ACTIVITY_TYPES = { view: 'viewed', search: 'searched', bookmark: 'saved', download: 'downloaded', share: 'shared', comment: 'commented' };
const CONTENT_TYPES = ['article', 'journal', 'researcher', 'institution', 'sdg', 'search', 'other'];
const PAGE_SIZE = 30;

const ICONS = {
  viewed: STAT_META[0].icon,
  searched: STAT_META[1].icon,
  saved: STAT_META[2].icon,
  downloaded: STAT_META[3].icon,
  shared: STAT_META[4].icon,
  commented: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

/** Tautan kembali ke objek aktivitas, bila bisa dibentuk dari datanya. */
function linkFor(item) {
  const id = item.target_id || '';
  if (!id) return null;
  switch (item.category) {
    case 'article':     return /^10\./.test(id) ? `/doi/${encodeURIComponent(id)}` : null;
    case 'researcher':  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(id) ? `/orcid/${id}` : null;
    case 'journal':     return `/journals/${encodeURIComponent(id)}`;
    case 'institution': return `/institutions/${encodeURIComponent(id)}`;
    default:            return null;
  }
}

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), ms);
    return () => clearTimeout(h);
  }, [value, ms]);
  return v;
}

const LogHistory = () => {
  const { t, i18n } = useTranslation('log_history');
  const { user } = useAuth();
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';

  const [timeRange, setTimeRange] = useState('30days');
  const [activityTypes, setActivityTypes] = useState([]); // kosong = semua
  const [contentTypes, setContentTypes] = useState([]);   // kosong = semua
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [summaryPrev, setSummaryPrev] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const search = useDebounced(searchQuery);
  const typeParam = activityTypes.length ? activityTypes.map((k) => ACTIVITY_TYPES[k]).join(',') : 'all';
  const catParam = contentTypes.length ? contentTypes.join(',') : 'all';
  const filterKey = `${timeRange}|${typeParam}|${catParam}|${search}|${sortBy}`;

  // Filter berubah -> mulai lagi dari halaman 1.
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  useEffect(() => {
    if (!user?.orcid) { setLoading(false); return undefined; }
    const first = page === 1;
    if (first) setLoading(true); else setLoadingMore(true);
    setError(null);

    const params = new URLSearchParams({
      range: timeRange, type: typeParam, category: catParam,
      search, sort: sortBy, page: String(page), limit: String(PAGE_SIZE),
    });
    let cancelled = false;
    fetch(`/api/my_activity.php?${params}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status !== 'success') {
          setError(data.message || t('load_failed'));
          return;
        }
        const rows = data.activities ?? data.data ?? [];
        setItems((prev) => (first ? rows : [...prev, ...rows]));
        setTotalPages(Math.max(1, data.total_pages ?? 1));
        setSummary(data.summary ?? null);
        setSummaryPrev(data.summary_prev ?? null);
      })
      .catch((err) => { if (!cancelled) setError(`${t('error_prefix')} ${err.message}`); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false); } });
    return () => { cancelled = true; };
  }, [user?.orcid, timeRange, typeParam, catParam, search, sortBy, page, t]);

  // Kelompokkan per tanggal (urutan mengikuti hasil API).
  const groups = useMemo(() => {
    const out = [];
    const todayKey = new Date().toDateString();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestKey = yest.toDateString();
    for (const it of items) {
      const d = new Date(it.timestamp);
      const key = d.toDateString();
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        const dateLabel = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        const prefix = key === todayKey ? t('today') : key === yestKey ? t('yesterday') : null;
        g = { key, label: prefix ? `${prefix} — ${dateLabel}` : dateLabel, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    return out;
  }, [items, locale, t]);

  // Perubahan dibanding periode sebelumnya yang sama panjang (dihitung server).
  const changeLabel = (type) => {
    if (!summary || !summaryPrev) return null;
    const cur = summary[type] ?? 0;
    const prev = summaryPrev[type] ?? 0;
    if (prev === 0) return cur === 0 ? null : { text: t('stats.new'), up: true };
    const pct = Math.round(((cur - prev) / prev) * 100);
    return { text: `${pct > 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
  };

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const clearFilters = () => {
    setActivityTypes([]);
    setContentTypes([]);
    setSearchQuery('');
    setTimeRange('30days');
    setSortBy('newest');
  };

  if (!user?.orcid && !loading) {
    return (
      <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('no_orcid.title')}</h2>
          <p className="text-gray-600 mb-6">{t('no_orcid.subtitle')}</p>
          <Link to="/settings" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            {t('no_orcid.cta')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-4">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">›</span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.dashboard')}</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={t('search_ph')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>
      )}

      {/* Ringkasan — dihitung dari aktivitas nyata pada rentang yang dipilih */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
        {STAT_META.map((meta) => {
          const ch = changeLabel(meta.type);
          return (
            <div key={meta.key} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${meta.color} rounded-full flex items-center justify-center`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={meta.icon} />
                  </svg>
                </div>
                <span className="text-[15px] text-gray-600 font-medium">{t(`stats.${meta.key}`)}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary ? (summary[meta.type] ?? 0) : '—'}</p>
              <p className={`text-sm font-medium mt-1 ${ch ? (ch.up ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                {ch ? `${ch.text} ${t('stats.change_suffix')}` : t('stats.no_compare')}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mb-8">{t('stats.note')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter */}
        <aside className="lg:col-span-1 space-y-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('time_range_title')}</h3>
            <div className="space-y-2">
              {TIME_RANGES.map((id) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="timeRange"
                    checked={timeRange === id}
                    onChange={() => setTimeRange(id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{t(`time_range.${id}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('activity_types_title')}</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activityTypes.length === 0}
                  onChange={() => setActivityTypes([])}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{t('activity_types.all')}</span>
              </label>
              {Object.keys(ACTIVITY_TYPES).map((id) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activityTypes.includes(id)}
                    onChange={() => toggle(activityTypes, setActivityTypes, id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{t(`activity_types.${id}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('content_types_title')}</h3>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={contentTypes.includes(type)}
                    onChange={() => toggle(contentTypes, setContentTypes, type)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{t(`content_types.${type}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-2.5 text-[15px] text-indigo-600 font-medium border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            {t('clear_filters')}
          </button>
        </aside>

        {/* Daftar aktivitas */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('list_title')}</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[15px] font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">{t('sort.newest')}</option>
              <option value="oldest">{t('sort.oldest')}</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-gray-600">{t('loading')}</span>
              </div>
            ) : groups.length > 0 ? groups.map((group, gIdx) => (
              <div key={group.key} className={gIdx > 0 ? 'border-t border-gray-100' : ''}>
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-[15px] font-bold text-indigo-600">{group.label}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const href = linkFor(item);
                    const time = new Date(item.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="shrink-0 w-full sm:w-16 text-left sm:text-right">
                            <span className="text-[15px] font-medium text-gray-500">{time}</span>
                          </div>
                          <div className="shrink-0 hidden sm:block">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ICONS[item.type] || ICONS.viewed} />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-[15px] text-gray-600 mb-0.5">
                              {t(`desc.${item.type}`, { defaultValue: item.type })}
                              {' · '}
                              {t(`content_types.${item.category}`, { defaultValue: item.category })}
                            </p>
                            <p className="text-[15px] font-semibold text-gray-900 mb-0.5 truncate">
                              {item.title || item.target_id || '—'}
                            </p>
                            {item.target_id && item.target_id !== item.title && (
                              <p className="text-sm text-gray-500 truncate">{item.target_id}</p>
                            )}
                          </div>
                          {href && (
                            <div className="shrink-0 flex items-center sm:justify-end">
                              <Link
                                to={href}
                                className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                              >
                                {t('open')}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>{t('empty')}</p>
                <p className="text-sm mt-2">{t('empty_hint')}</p>
              </div>
            )}
          </div>

          {!loading && page < totalPages && (
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[15px] font-medium hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                {loadingMore ? t('loading') : t('load_more')}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LogHistory;
