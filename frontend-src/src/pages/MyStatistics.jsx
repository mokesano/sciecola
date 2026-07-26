import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Line, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const MyStatistics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('12');

  useEffect(() => {
    if (!user?.orcid) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/my_statistics.php?orcid=${encodeURIComponent(user.orcid)}&range=${timeRange}`)
      .then(r => r.json())
      .then(resp => {
        if (resp.status === 'success') {
          setData(resp);
        } else {
          setError(resp.message || 'Gagal memuat statistik');
        }
      })
      .catch(err => setError('Gagal memuat: ' + err.message))
      .finally(() => setLoading(false));
  }, [user?.orcid, timeRange]);

  if (!user?.orcid && !loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ORCID Belum Terhubung</h2>
          <Link to="/settings" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Hubungkan ORCID</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-28 pb-12 px-4 flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-gray-600">Memuat statistik…</span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-28 pb-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">{error}</div>
      </main>
    );
  }

  const impactTrends = data?.impactTrends || [];
  const sdgData = data?.sdgRadar || [
    { subject: 'SDG 11\nCities', A: 78, fullMark: 100 },
    { subject: 'SDG 7\nEnergy', A: 65, fullMark: 100 },
    { subject: 'SDG 4\nEducation', A: 40, fullMark: 100 },
    { subject: 'SDG 3\nHealth', A: 30, fullMark: 100 },
    { subject: 'SDG 14\nWater', A: 20, fullMark: 100 },
  ];
  const demographics = data?.demographics || [
    { country: 'Indonesia', views: 12500 },
    { country: 'Malaysia', views: 4200 },
    { country: 'Singapore', views: 3100 },
    { country: 'Thailand', views: 2400 },
    { country: 'Philippines', views: 1800 },
  ];
  const sources = data?.citationSources || [
    { source: 'Google Scholar', count: 4500 },
    { source: 'Scopus', count: 2100 },
    { source: 'Web of Science', count: 1200 },
    { source: 'ResearchGate', count: 800 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Statistik</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistik Performa</h1>
          <p className="text-gray-600 mt-1">Analisis mendalam mengenai dampak dan jangkauan publikasi Anda.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          >
            <option value="12">12 Bulan Terakhir</option>
            <option value="6">6 Bulan Terakhir</option>
            <option value="1">30 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Views', value: (data?.summary?.views || 0).toLocaleString(), growth: data?.summary?.viewsGrowth || '+0%', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Total Citations', value: (data?.summary?.citations || 0).toLocaleString(), growth: data?.summary?.citationsGrowth || '+0%', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', color: 'bg-purple-50 text-purple-600' },
          { label: 'h-Index', value: data?.summary?.hIndex || '0', growth: data?.summary?.hIndexGrowth || '+0', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'bg-amber-50 text-amber-600' },
          { label: 'Avg. Impact Score', value: (data?.summary?.avgImpactScore || 0).toFixed(1), growth: data?.summary?.impactGrowth || '+0%', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'bg-green-50 text-green-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
              </div>
              <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <span className="text-xs flex items-end gap-1 font-bold text-green-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> 
                {stat.growth}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart: Impact Trends */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Tren Dampak Riset</h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Views
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> Citations
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={impactTrends}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            <Line type="monotone" dataKey="citations" name="Citations" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Row: SDG Radar & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SDG Radar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Profil SDG</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sdgData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#4b5563' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Kontribusi" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Berdasarkan skor klasifikasi artikel</p>
        </div>

        {/* Audience Demographics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Negara Pembaca</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demographics} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis dataKey="country" type="category" stroke="#6b7280" fontSize={12} width={80} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" name="Views" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tertiary Row: Citation Sources & Top Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citation Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sumber Sitasi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sources} margin={{ top: 5, right: 20, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="source" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Sitasi" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Articles Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Artikel Teratas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Judul</th>
                  <th className="px-4 py-3 font-medium text-center">Views</th>
                  <th className="px-4 py-3 font-medium text-center">Sitasi</th>
                  <th className="px-4 py-3 font-medium text-center rounded-tr-lg">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.topArticles || []).slice(0, 4).map((article, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{article.title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{(article.views || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{(article.citations || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${(article.impactScore || 0) >= 85 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {(article.impactScore || 0).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/my-articles" className="block text-center text-sm text-indigo-600 font-medium hover:text-indigo-700 mt-4">
            Lihat semua artikel →
          </Link>
        </div>
      </div>
    </main>
  );
};

export default MyStatistics;