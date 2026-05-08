import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line
} from 'recharts';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [selectedPeriod, setSelectedPeriod] = useState('1 Jan 2024 - 31 Mei 2024');

  // Mock Data
  const summaryStats = [
    { label: 'Publikasi', value: '10,892', change: '+18%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Peneliti', value: '2,841', change: '+12%', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Institusi', value: '1,246', change: '+15%', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Sitasi', value: '21,897', change: '+22%', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { label: 'Unduhan', value: '18,732', change: '+24%', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { label: 'Skor Impact', value: '92.4', change: '+9%', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
  ];

  const publicationTrend = [
    { month: 'Jan 2024', count: 450 },
    { month: 'Feb 2024', count: 800 },
    { month: 'Mar 2024', count: 1100 },
    { month: 'Apr 2024', count: 1500 },
    { month: 'Mei 2024', count: 2213 }
  ];

  const sdgDistribution = [
    { name: 'SDG 13 Climate Action', value: 18, color: '#10b981' },
    { name: 'SDG 3 Good Health', value: 15, color: '#ef4444' },
    { name: 'SDG 11 Sustainable Cities', value: 12, color: '#f59e0b' },
    { name: 'SDG 7 Affordable Energy', value: 10, color: '#fbbf24' },
    { name: 'SDG 14 Life Below Water', value: 9, color: '#3b82f6' },
    { name: 'Lainnya', value: 36, color: '#6366f1' }
  ];

  const topics = [
    { text: 'Climate Change', size: 48 },
    { text: 'Sustainable Cities', size: 32 },
    { text: 'Renewable Energy', size: 28 },
    { text: 'Disaster Risk Reduction', size: 20 },
    { text: 'Water Management', size: 18 },
    { text: 'Environmental Policy', size: 22 },
    { text: 'Coastal Adaptation', size: 16 },
    { text: 'Green Technology', size: 14 },
    { text: 'Carbon Technology', size: 12 },
    { text: 'Biodiversity', size: 10 },
    { text: 'Ocean Science', size: 15 },
    { text: 'Circular Economy', size: 13 }
  ];

  const comparisonData = [
    { category: 'Publikasi', current: 2200, previous: 1800 },
    { category: 'Peneliti', current: 1500, previous: 900 },
    { category: 'Institusi', current: 1000, previous: 600 },
    { category: 'Sitasi', current: 700, previous: 400 },
    { category: 'Unduhan', current: 1400, previous: 1000 },
    { category: 'Skor Impact', current: 1300, previous: 900 }
  ];

  const topResearchers = [
    { rank: 1, name: 'Dr. Siti Nurhaliza', institution: 'BRIN', citations: 1248, avatar: 'https://i.pravatar.cc/100?img=5' },
    { rank: 2, name: 'Prof. Budi Santoso', institution: 'Institut Teknologi Bandung', citations: 1102, avatar: 'https://i.pravatar.cc/100?img=12' },
    { rank: 3, name: 'Dr. Dwi Setiawan', institution: 'Universitas Airlangga', citations: 876, avatar: 'https://i.pravatar.cc/100?img=3' },
    { rank: 4, name: 'Prof. Rizky Pratama', institution: 'IPB University', citations: 764, avatar: 'https://i.pravatar.cc/100?img=11' },
    { rank: 5, name: 'Dr. Fatimah Azzahra', institution: 'Universitas Hasanuddin', citations: 688, avatar: 'https://i.pravatar.cc/100?img=9' }
  ];

  const citationTrend = [
    { month: 'Jan 2024', count: 800 },
    { month: 'Feb 2024', count: 1200 },
    { month: 'Mar 2024', count: 1800 },
    { month: 'Apr 2024', count: 2500 },
    { month: 'Mei 2024', count: 3200 }
  ];

  const topJournals = [
    { rank: 1, name: 'Journal of Environmental Science', count: 1234 },
    { rank: 2, name: 'Sustainability', count: 1876 },
    { rank: 3, name: 'Marine Policy', count: 1243 },
    { rank: 4, name: 'Environmental Science & Policy', count: 987 },
    { rank: 5, name: 'Climate and Development', count: 765 }
  ];

  const documentTypes = [
    { name: 'Artikel Jurnal', value: 72, color: '#10b981' },
    { name: 'Prosiding Konferensi', value: 14, color: '#3b82f6' },
    { name: 'Review', value: 7, color: '#ef4444' },
    { name: 'Buku', value: 4, color: '#fbbf24' },
    { name: 'Lainnya', value: 3, color: '#6366f1' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-indigo-600">
            {payload[0].name}: {payload[0].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">Beranda</Link>
        <span>›</span>
        <span className="text-gray-900">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics</h1>
          <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">
            Jelajahi data dan visualisasi untuk memahami tren, dampak, dan kontribusi riset terhadap pencapaian SDGs.
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 shadow-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{selectedPeriod}</span>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Ekspor Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
              <span className="text-xs text-gray-600 font-medium truncate">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-green-600 font-medium mt-1">{stat.change} dari periode lalu</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-200">
        {['Ringkasan', 'Publikasi', 'SDGs', 'Peneliti', 'Institusi', 'Geografis', 'Tren', 'Perbandingan'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.toLowerCase()
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Publication Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Publikasi</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Per Bulan</option>
              <option>Per Tahun</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={publicationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SDG Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Publikasi per SDGs</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sdgDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sdgDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-grow space-y-2">
              {sdgDistribution.map((sdg, idx) => (
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

      {/* Topics & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Topics Cloud */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Topik Riset Populer</h3>
          <div className="flex flex-wrap justify-center items-center gap-4 py-6 bg-gray-50 rounded-xl">
            {topics.map((topic, idx) => (
              <span 
                key={idx}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors font-medium"
                style={{ fontSize: `${topic.size / 48 * 1.5}rem` }}
              >
                {topic.text}
              </span>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 border border-indigo-200 bg-indigo-50 px-4 py-2 rounded-lg">
              Lihat semua topik
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peta Sebaran Publikasi</h3>
          <div className="bg-gray-50 rounded-xl p-8 h-64 flex items-center justify-center relative">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">World Map Visualization</p>
            </div>
            <div className="absolute right-4 bottom-4 flex flex-col gap-1">
              <button className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
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
      </div>

      {/* Comparison & Top Researchers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Perbandingan Publikasi</h3>
            <div className="flex gap-2">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
                <option>Publikasi</option>
                <option>Peneliti</option>
              </select>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
                <option>Pilih Periode</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="previous" fill="#c7d2fe" name="1 Jan - 31 Mei 2023" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" fill="#6366f1" name="1 Jan - 31 Mei 2024" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Researchers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Peneliti</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
              <option>Berdasarkan Sitasi</option>
              <option>Berdasarkan Publikasi</option>
            </select>
          </div>
          <div className="space-y-4">
            {topResearchers.map((researcher) => (
              <div key={researcher.rank} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                  {researcher.rank}
                </span>
                <img src={researcher.avatar} alt={researcher.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{researcher.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{researcher.institution}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{researcher.citations.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Sitasi</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="#" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat semua peneliti
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Charts Section 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Citation Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Sitasi</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
              <option>Per Bulan</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={citationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Journals */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Sumber Publikasi Teratas</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
              <option>Berdasarkan Publikasi</option>
            </select>
          </div>
          <div className="space-y-3">
            {topJournals.map((journal) => (
              <div key={journal.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-4">{journal.rank}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{journal.name}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700">{journal.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Link to="#" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat semua jurnal
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Document Types */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Jenis Dokumen</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={documentTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-grow space-y-2">
              {documentTypes.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: doc.color }} />
                  <span className="text-gray-600">{doc.name}</span>
                  <span className="font-semibold text-gray-900">({doc.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Butuh data lebih spesifik?</h3>
          <p className="text-indigo-100">Gunakan filter expert untuk mendapatkan data analytics sesuai kebutuhan Anda.</p>
        </div>
        <button className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Ekspor Data
        </button>
      </div>
    </main>
  );
};

export default Analytics;