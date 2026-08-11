import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Stat card metadata (icons/colors) is chrome — labels come from i18n.
const STAT_META = [
  { key: 'views',     icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'searches',  icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'text-purple-600 bg-purple-50' },
  { key: 'saves',     icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', color: 'text-blue-600 bg-blue-50' },
  { key: 'downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-green-600 bg-green-50' },
  { key: 'shares',    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'text-orange-600 bg-orange-50' },
];

const TIME_RANGES = ['all', 'today', '7days', '30days', '3months', 'year', 'custom'];
const ACTIVITY_TYPES = ['all', 'view', 'search', 'bookmark', 'download', 'share', 'comment'];
const CONTENT_TYPES = ['Artikel', 'Jurnal', 'Peneliti', 'Institusi', 'SDGs', 'Berita', 'Lainnya'];

const LogHistory = () => {
  const { t } = useTranslation('log_history');
  const { user } = useAuth();

  // State Management
  const [timeRange, setTimeRange] = useState('all');
  const [activityTypes, setActivityTypes] = useState(['all']);
  const [contentTypes, setContentTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [logHistory, setLogHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Raw stat values keyed by STAT_META.key — labels come from i18n.
  const [statValues, setStatValues] = useState({
    views: 126, searches: 84, saves: 32, downloads: 18, shares: 9,
  });
  const [statChanges, setStatChanges] = useState({
    views: '+12%', searches: '+8%', saves: '+15%', downloads: '+5%', shares: '+3%',
  });

  // Fetch log history from API
  useEffect(() => {
    if (!user?.orcid) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      orcid: user.orcid,
      range: timeRange,
      type: activityTypes.includes('all') ? 'all' : activityTypes.join(','),
      search: searchQuery
    });

    fetch(`/api/log_history.php?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setLogHistory(data.logs ?? []);
          if (data.summary) {
            setStatValues({
              views:     data.summary.views     || 0,
              searches:  data.summary.searches  || 0,
              saves:     data.summary.saves     || 0,
              downloads: data.summary.downloads || 0,
              shares:    data.summary.shares    || 0,
            });
            setStatChanges({
              views: '+0%', searches: '+0%', saves: '+0%', downloads: '+0%', shares: '+0%',
            });
          }
        } else {
          setError(data.message || t('load_failed'));
        }
      })
      .catch(err => setError(`${t('error_prefix')} ${err.message}`))
      .finally(() => setLoading(false));
  }, [user?.orcid, timeRange, activityTypes, searchQuery, t]);

  const activities = [
    {
      date: 'Hari Ini - 15 Mei 2024',
      items: [
        { time: '14:32', type: 'view', desc: 'Anda melihat artikel', title: 'Ecosystem-based adaptation in coastal areas: A review', sub: 'Journal of Environmental Science & Sustainability', action: 'Lihat Detail' },
        { time: '13:45', type: 'bookmark', desc: 'Anda menyimpan artikel ke koleksi', title: 'Mangrove ecosystem as climate buffer for coastal communities', sub: 'Marine Policy, 2022', collection: 'Koleksi: Adaptation Research' },
        { time: '11:20', type: 'download', desc: 'Anda mengunduh artikel', title: 'Climate resilience through local wisdom in coastal communities', sub: 'Sustainability, 2023', action: 'Unduh Lagi' },
        { time: '09:15', type: 'search', desc: 'Anda melakukan pencarian', title: '"climate adaptation coastal Indonesia"', sub: null, action: 'Lihat Hasil' }
      ]
    },
    {
      date: 'Kemarin - 14 Mei 2024',
      items: [
        { time: '16:40', type: 'view', desc: 'Anda melihat jurnal', title: 'Journal of Environmental Science and Sustainability', sub: 'EISSN: 1234-5678', action: 'Lihat Profil' },
        { time: '15:10', type: 'share', desc: 'Anda membagikan artikel', title: 'Blue carbon and coastal adaptation strategies', sub: 'Journal of Cleaner Production, 2022', action: 'Lihat Detail' },
        { time: '10:22', type: 'bookmark', desc: 'Anda menyimpan peneliti', title: 'Dr. Siti Nurhaliza', sub: 'BRIN - Badan Riset dan Inovasi Nasional' }
      ]
    },
    {
      date: '12 Mei 2024',
      items: [
        { time: '20:15', type: 'search', desc: 'Anda melakukan pencarian', title: '"mangrove restoration"', sub: null, action: 'Lihat Hasil' },
        { time: '17:30', type: 'view', desc: 'Anda melihat institusi', title: 'Universitas Indonesia', sub: 'Depok, Jawa Barat, Indonesia', action: 'Lihat Profil' },
        { time: '14:05', type: 'comment', desc: 'Anda mengomentari artikel', title: 'Community-based adaptation to sea level rise in Indonesia', sub: 'Environmental Science & Policy, 2024', action: 'Lihat Detail' }
      ]
    },
    {
      date: '11 Mei 2024',
      items: [
        { time: '09:50', type: 'download', desc: 'Anda mengunduh dataset', title: 'Data_Kualitas_Air_Teluk_Jakarta_2024.xlsx', sub: '2.4 MB', action: 'Unduh Lagi' }
      ]
    }
  ];

  const getIcon = (type) => {
    const icons = {
      view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
      download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    };
    return icons[type] || icons.view;
  };

  const handleActivityToggle = (id) => {
    if (id === 'all') {
      setActivityTypes(activityTypes.includes('all') ? [] : ['all', 'view', 'search', 'bookmark', 'download', 'share', 'comment']);
    } else {
      const newTypes = activityTypes.includes(id) 
        ? activityTypes.filter(t => t !== id && t !== 'all')
        : [...activityTypes.filter(t => t !== 'all'), id];
      setActivityTypes(newTypes.length === 6 ? [...newTypes, 'all'] : newTypes);
    }
  };

  if (!user?.orcid && !loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-600">{t('loading')}</span>
        </div>
      )}

      {!loading && !error && (
      <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.dashboard')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600 max-w-2xl">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder={t('search_ph')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('filter')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {STAT_META.map((meta) => (
          <div key={meta.key} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 ${meta.color} rounded-full flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={meta.icon} />
                </svg>
              </div>
              <span className="text-sm text-gray-600 font-medium">{t(`stats.${meta.key}`)}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statValues[meta.key]}</p>
            <p className="text-xs font-medium text-green-600 mt-1">
              {statChanges[meta.key]} {t('stats.change_suffix')}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-8">
          {/* Time Range */}
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
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{t(`time_range.${id}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Activity Types */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('activity_types_title')}</h3>
            <div className="space-y-2">
              {ACTIVITY_TYPES.map((id) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activityTypes.includes(id)}
                    onChange={() => handleActivityToggle(id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{t(`activity_types.${id}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('content_types_title')}</h3>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={contentTypes.includes(type)}
                    onChange={() => setContentTypes(contentTypes.includes(type) ? contentTypes.filter(x => x !== type) : [...contentTypes, type])}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{t(`content_types.${type}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="w-full py-2.5 text-sm text-indigo-600 font-medium border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('clear_filters')}
          </button>
        </aside>

        {/* Activity List */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('list_title')}</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">{t('sort.newest')}</option>
              <option value="oldest">{t('sort.oldest')}</option>
              <option value="views">{t('sort.views')}</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {logHistory.length > 0 ? logHistory.map((group, gIdx) => (
              <div key={gIdx} className={gIdx > 0 ? 'border-t border-gray-100' : ''}>
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-indigo-600">{group.date}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.items.map((item, iIdx) => (
                    <div key={iIdx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Time */}
                        <div className="shrink-0 w-full sm:w-16 text-left sm:text-right">
                          <span className="text-sm font-medium text-gray-500">{item.time}</span>
                        </div>
                        
                        {/* Icon */}
                        <div className="shrink-0 hidden sm:block">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getIcon(item.type)} />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-600 mb-0.5">{item.desc}</p>
                          <p className="text-sm font-semibold text-gray-900 mb-0.5 truncate">{item.title}</p>
                          {item.sub && <p className="text-xs text-gray-500">{item.sub}</p>}
                          {item.collection && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold tracking-wide uppercase">
                              {item.collection}
                            </span>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2 sm:justify-end">
                          {item.action && (
                            <button className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                              {item.action}
                            </button>
                          )}
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>{t('empty')}</p>
              </div>
            )}
          </div>

          {logHistory.length > 0 && (
          <div className="mt-6 text-center">
            <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all inline-flex items-center gap-2 shadow-sm">
              {t('load_more')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          )}
        </div>
      </div>
      </>
      )}
    </main>
  );
};

export default LogHistory;