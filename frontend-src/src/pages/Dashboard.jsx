import React, { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const Chevron = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const NavLink = ({ to, icon, label, active, extra }) => (
  <Link to={to} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
    active === 'admin'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-700 hover:bg-gray-50'
  }`}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {extra ? <span className="flex items-center gap-1">{label}{extra}</span> : label}
  </Link>
);

const Dashboard = () => {
  const { t } = useTranslation('dashboard_page');
  const [dateRange, setDateRange] = useState('current');

  const stats = { articles: 42, citations: 1248, reads: 3562, downloads: 2109,
                  articleGrowth: 12, citationGrowth: 18, readGrowth: 24, downloadGrowth: 16 };

  // Chart-facing month labels stay short and neutral.
  const publicationsPerMonth = [
    { month: 'Jan', count: 5 }, { month: 'Feb', count: 9 }, { month: 'Mar', count: 12 },
    { month: 'Apr', count: 4 }, { month: 'May', count: 5 }, { month: 'Jun', count: 10 },
    { month: 'Jul', count: 5 }, { month: 'Aug', count: 9 }, { month: 'Sep', count: 5 },
    { month: 'Oct', count: 9 }, { month: 'Nov', count: 15 }, { month: 'Dec', count: 4 }
  ];

  // SDG names left untranslated (proper nouns / global SDG labels).
  const sdgContribution = [
    { name: 'Climate Action',      value: 28, color: '#10b981' },
    { name: 'Sustainable Cities',  value: 22, color: '#f59e0b' },
    { name: 'Good Health',         value: 16, color: '#14b8a6' },
    { name: 'Clean Energy',        value: 12, color: '#fbbf24' },
    { name: 'Life on Land',        value: 10, color: '#ef4444' },
    { name: 'Others',              value: 12, color: '#8b5cf6' }
  ];

  const popularArticles = [
    { title: 'Climate Change Adaptation in Coastal Communities', journal: 'Journal of Environmental Science, 2024', citations: 24, downloads: 652 },
    { title: 'Sustainable Urban Transport Systems in Indonesia',  journal: 'Sustainable Cities Review, 2023',        citations: 18, downloads: 210 },
    { title: 'Renewable Energy Policy and Its Impact',            journal: 'Journal of Urbanism, Econ., 2024',       citations: 32, downloads: 411 }
  ];

  // Recent-activity text is mock data pending the real feed backend.
  const recentActivities = [
    { text: 'Artikel Anda "Climate Change Adaptation..." mendapat 15 sitasi baru', time: '2 jam yang lalu', avatar: 'https://i.pravatar.cc/150?img=1' },
    { text: 'User Budi Santoso menyimpan artikel Anda',                            time: '5 jam yang lalu', avatar: 'https://i.pravatar.cc/150?img=3' },
    { text: 'Artikel Anda diunduh 23 kali',                                        time: '1 hari yang lalu',avatar: 'https://i.pravatar.cc/150?img=5' }
  ];

  const articleDistribution = [
    { sdg: 'Climate Action',      count: 12, percentage: 28 },
    { sdg: 'Sustainable Cities',  count: 9,  percentage: 22 },
    { sdg: 'Good Health',         count: 7,  percentage: 16 },
    { sdg: 'Clean Energy',        count: 5,  percentage: 12 },
    { sdg: 'Life on Land',        count: 4,  percentage: 10 },
    { sdg: 'Others',              count: 5,  percentage: 12 }
  ];

  const citationTrend = [
    { year: '2018', count: 580  }, { year: '2019', count: 520  }, { year: '2020', count: 1100 },
    { year: '2021', count: 1350 }, { year: '2022', count: 1300 }, { year: '2023', count: 1800 },
    { year: '2024', count: 2000 }
  ];

  const journalPerformance = { acceptanceRate: 24, avgReviewTime: 28, avgPublishTime: 4, citationsPerArticle: 16.1, hIndex: 17 };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-[15px] font-semibold text-gray-900">{label}</p>
          <p className="text-[15px] text-indigo-600">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const statCards = [
    { key: 'articles',  value: stats.articles,                     growth: stats.articleGrowth,  bg: 'bg-indigo-50 text-indigo-600', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'citations', value: stats.citations.toLocaleString(),   growth: stats.citationGrowth, bg: 'bg-purple-50 text-purple-600', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { key: 'reads',     value: stats.reads.toLocaleString(),       growth: stats.readGrowth,     bg: 'bg-blue-50 text-blue-600',     icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'downloads', value: stats.downloads.toLocaleString(),   growth: stats.downloadGrowth, bg: 'bg-green-50 text-green-600',   icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  ];

  const navItems = [
    { to: '/feeds',          i18n: 'feeds',         icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { to: '/admin',          i18n: 'admin',         icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', active: 'admin', badge: true },
    { to: '/dashboard',      i18n: 'dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
    { to: '/my-profile',     i18n: 'my_profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { to: '/my-articles',    i18n: 'my_articles',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { to: '/my-collections', i18n: 'collections',   icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { to: '/my-statistics',  i18n: 'statistics',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/my-activity',    i18n: 'my_activity',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/log-history',    i18n: 'log_history',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { to: '/messages',       i18n: 'inbox',         icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { to: '/notifications',  i18n: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { to: '/settings',       i18n: 'settings',      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><Chevron /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('sidebar.profile')}</p>
                <p className="text-sm text-gray-500">{t('sidebar.profile_role')}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={t(`sidebar.${item.i18n}`)}
                  active={item.active}
                  extra={item.badge && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">
                      {t('sidebar.admin_badge')}
                    </span>
                  )}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[15px] font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="current">{t('range.current')}</option>
              <option value="prev">{t('range.prev')}</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.key} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-600">{t(`stats.${s.key}`)}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm font-medium text-green-600 mt-1">{t('stats.growth', { pct: s.growth })}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.pub_per_month')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={publicationsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.sdg_contrib')}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sdgContribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {sdgContribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-900">
                      {stats.articles}
                    </text>
                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
                      {t('sections.articles')}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-grow space-y-2">
                  {sdgContribution.map((sdg, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[15px]">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sdg.color }} />
                      <span className="text-gray-600">{sdg.name}</span>
                      <span className="font-semibold text-gray-900">({sdg.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Articles & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.top_articles')}</h3>
              <div className="space-y-4">
                {popularArticles.map((article, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-gray-900 text-[15px] mb-1">{article.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{article.journal}</p>
                    <div className="flex gap-4 text-[15px]">
                      <span className="text-gray-600">{t('article_meta.citations')}: <span className="font-semibold text-gray-900">{article.citations}</span></span>
                      <span className="text-gray-600">{t('article_meta.downloads')}: <span className="font-semibold text-gray-900">{article.downloads}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/my-articles" className="inline-flex items-center gap-1 text-[15px] text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                {t('sections.see_all')} <Chevron />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.recent')}</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3">
                    <img src={activity.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-grow">
                      <p className="text-[15px] text-gray-900">{activity.text}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/my-activity" className="inline-flex items-center gap-1 text-[15px] text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                {t('sections.see_all_activity')} <Chevron />
              </Link>
            </div>
          </div>

          {/* Map & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.author_map')}</h3>
              <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[15px]">{t('sections.map_placeholder')}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-200 rounded"></div>
                  <span className="text-gray-600">{t('sections.map_high')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-50 rounded"></div>
                  <span className="text-gray-600">{t('sections.map_low')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.sdg_dist')}</h3>
              <div className="space-y-3">
                {articleDistribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[15px] mb-1">
                      <span className="text-gray-600">{item.sdg}</span>
                      <span className="text-gray-900 font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/sdgs" className="inline-flex items-center gap-1 text-[15px] text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                {t('sections.see_all_sdgs')} <Chevron />
              </Link>
            </div>
          </div>

          {/* Citation Trend & Journal Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('sections.citation_trend')}</h3>
                <select className="text-[15px] border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option>{t('trend_range.all')}</option>
                  <option>{t('trend_range.5y')}</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={citationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.journal_perf')}</h3>
              <div className="space-y-4">
                {[
                  { key: 'acceptance',    value: `${journalPerformance.acceptanceRate}%`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { key: 'review_time',   value: `${journalPerformance.avgReviewTime} ${t('journal.days')}`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { key: 'publish_time',  value: `${journalPerformance.avgPublishTime} ${t('journal.days')}`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { key: 'citations_per', value: journalPerformance.citationsPerArticle, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                  { key: 'hindex',        value: journalPerformance.hIndex, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', last: true },
                ].map(row => (
                  <div key={row.key} className={`flex justify-between items-center py-2 ${row.last ? '' : 'border-b border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={row.icon} />
                      </svg>
                      <span className="text-[15px] text-gray-600">{t(`journal.${row.key}`)}</span>
                    </div>
                    <span className="text-[15px] font-bold text-indigo-600">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">{t('cta.title')}</h3>
              <p className="text-indigo-100 text-[15px]">{t('cta.subtitle')}</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                type="text"
                placeholder={t('cta.input_ph')}
                className="flex-grow lg:w-80 px-4 py-2.5 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none text-[15px]"
              />
              <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2 text-[15px]">
                {t('cta.button')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
};

export default Dashboard;