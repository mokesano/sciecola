import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('01 Jan 2024 - 31 Des 2024');

  // Mock Data
  const stats = {
    articles: 42,
    citations: 1248,
    reads: 3562,
    downloads: 2109,
    articleGrowth: 12,
    citationGrowth: 18,
    readGrowth: 24,
    downloadGrowth: 16
  };

  const publicationsPerMonth = [
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 9 },
    { month: 'Mar', count: 12 },
    { month: 'Apr', count: 4 },
    { month: 'Mei', count: 5 },
    { month: 'Jun', count: 10 },
    { month: 'Jul', count: 5 },
    { month: 'Agt', count: 9 },
    { month: 'Sep', count: 5 },
    { month: 'Okt', count: 9 },
    { month: 'Nov', count: 15 },
    { month: 'Des', count: 4 }
  ];

  const sdgContribution = [
    { name: 'Climate Action', value: 28, color: '#10b981' },
    { name: 'Sustainable Cities', value: 22, color: '#f59e0b' },
    { name: 'Good Health', value: 16, color: '#14b8a6' },
    { name: 'Clean Energy', value: 12, color: '#fbbf24' },
    { name: 'Life on Land', value: 10, color: '#ef4444' },
    { name: 'Lainnya', value: 12, color: '#8b5cf6' }
  ];

  const popularArticles = [
    {
      title: 'Climate Change Adaptation in Coastal Communities',
      journal: 'Journal of Environmental Science, 2024',
      citations: 24,
      downloads: 652
    },
    {
      title: 'Sustainable Urban Transport Systems in Indonesia',
      journal: 'Sustainable Cities Review, 2023',
      citations: 18,
      downloads: 210
    },
    {
      title: 'Renewable Energy Policy and Its Impact',
      journal: 'Journal of Urbanism, Econ., 2024',
      citations: 32,
      downloads: 411
    }
  ];

  const recentActivities = [
    {
      type: 'citation',
      text: 'Artikel Anda "Climate Change Adaptation..." mendapat 15 sitasi baru',
      time: '2 jam yang lalu',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
      type: 'save',
      text: 'User Budi Santoso menyimpan artikel Anda',
      time: '5 jam yang lalu',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    {
      type: 'download',
      text: 'Artikel Anda diunduh 23 kali',
      time: '1 hari yang lalu',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  ];

  const articleDistribution = [
    { sdg: 'Climate Action', count: 12, percentage: 28 },
    { sdg: 'Sustainable Cities', count: 9, percentage: 22 },
    { sdg: 'Good Health', count: 7, percentage: 16 },
    { sdg: 'Clean Energy', count: 5, percentage: 12 },
    { sdg: 'Life on Land', count: 4, percentage: 10 },
    { sdg: 'Lainnya', count: 5, percentage: 12 }
  ];

  const citationTrend = [
    { year: '2018', count: 580 },
    { year: '2019', count: 520 },
    { year: '2020', count: 1100 },
    { year: '2021', count: 1350 },
    { year: '2022', count: 1300 },
    { year: '2023', count: 1800 },
    { year: '2024', count: 2000 }
  ];

  const journalPerformance = {
    acceptanceRate: 24,
    avgReviewTime: 28,
    avgPublishTime: 4,
    citationsPerArticle: 16.1,
    hIndex: 17
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-indigo-600">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
          <span className="text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </span>
          <span className="text-gray-900 font-medium">Dashboard</span>
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
                  <p className="font-semibold text-gray-900">Profil</p>
                  <p className="text-xs text-gray-500">Peneliti</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
                <Link to="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notifications
                </Link>
                <Link to="/my-articles" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Artikel Saya
                </Link>
                <Link to="/my-collections" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Koleksi
                </Link>
                <Link to="/my-statistics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Statistik
                </Link>
                <Link to="/my-activity" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Aktivitas Saya
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pengaturan
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>01 Jan 2024 - 31 Des 2024</option>
                <option>01 Jan 2023 - 31 Des 2023</option>
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Artikel Saya</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.articles}</p>
                <p className="text-xs font-medium text-green-600 mt-1">↑ {stats.articleGrowth}% dari tahun lalu</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Total Sitasi</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.citations.toLocaleString()}</p>
                <p className="text-xs font-medium text-green-600 mt-1">↑ {stats.citationGrowth}% dari tahun lalu</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Dibaca</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.reads.toLocaleString()}</p>
                <p className="text-xs font-medium text-green-600 mt-1">↑ {stats.readGrowth}% dari tahun lalu</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Diunduh</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.downloads.toLocaleString()}</p>
                <p className="text-xs font-medium text-green-600 mt-1">↑ {stats.downloadGrowth}% dari tahun lalu</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Publikasi per Bulan</h3>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">SDGs Kontribusi</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sdgContribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sdgContribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-900">
                        {stats.articles}
                      </text>
                      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-500">
                        Artikel
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-grow space-y-2">
                    {sdgContribution.map((sdg, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Artikel Terpopuler</h3>
                <div className="space-y-4">
                  {popularArticles.map((article, idx) => (
                    <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{article.title}</h4>
                      <p className="text-xs text-gray-500 mb-2">{article.journal}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-600">Sitasi: <span className="font-semibold text-gray-900">{article.citations}</span></span>
                        <span className="text-gray-600">Diunduh: <span className="font-semibold text-gray-900">{article.downloads}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/my-articles" className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                  Lihat semua
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex gap-3">
                      <img src={activity.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-grow">
                        <p className="text-sm text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/my-activity" className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                  Lihat semua aktivitas
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Map & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Peta Kontribusi Penulis</h3>
                <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">World Map Visualization</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-200 rounded"></div>
                    <span className="text-gray-600">Kontribusi Tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-50 rounded"></div>
                    <span className="text-gray-600">Kontribusi Rendah</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Distribusi Artikel per SDGs</h3>
                <div className="space-y-3">
                  {articleDistribution.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.sdg}</span>
                        <span className="text-gray-900 font-medium">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/sdgs" className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 mt-4">
                  Lihat semua SDGs
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Citation Trend & Journal Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Tren Sitasi</h3>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Semua Tahun</option>
                    <option>5 Tahun Terakhir</option>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performa Jurnal</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Acceptance Rate</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{journalPerformance.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Waktu Review Rata-rata</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{journalPerformance.avgReviewTime} Hari</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Waktu Terbit Rata-rata</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{journalPerformance.avgPublishTime} Hari</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="text-sm text-gray-600">Tingkat Sitasi per Artikel</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{journalPerformance.citationsPerArticle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-sm text-gray-600">H-Index</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{journalPerformance.hIndex}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Ingin menganalisis artikel Anda lebih dalam?</h3>
                <p className="text-indigo-100 text-sm">Masukkan DOI atau ORCID untuk mendapatkan analisis dan klasifikasi SDGs secara instan.</p>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <input 
                  type="text" 
                  placeholder="Masukkan DOI atau ORCID"
                  className="flex-grow lg:w-80 px-4 py-2.5 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none text-sm"
                />
                <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2 text-sm">
                  Analisis Sekarang
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