import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const SdgsCluster = () => {
  const [activeTab, setActiveTab] = useState('semua');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedSdg, setSelectedSdg] = useState('13');

  // Mock Data
  const statsData = {
    totalPublications: 25892,
    publicationsGrowth: 18,
    totalResearchers: 6721,
    researchersGrowth: 14,
    totalInstitutions: 1348,
    institutionsGrowth: 16,
    avgImpactScore: 88.7,
    impactGrowth: 7,
    totalCountries: 89,
    countriesGrowth: 10
  };

  const publicationPerSdg = [
    { sdg: 1, name: 'No Poverty', value: 1245, color: '#ef4444', icon: '🏚️' },
    { sdg: 2, name: 'Zero Hunger', value: 987, color: '#f97316', icon: '🌾' },
    { sdg: 3, name: 'Good Health', value: 2845, color: '#14b8a6', icon: '❤️' },
    { sdg: 4, name: 'Quality Education', value: 2431, color: '#ef4444', icon: '📚' },
    { sdg: 5, name: 'Gender Equality', value: 876, color: '#ec4899', icon: '⚖️' },
    { sdg: 6, name: 'Clean Water', value: 1123, color: '#3b82f6', icon: '💧' },
    { sdg: 7, name: 'Clean Energy', value: 2102, color: '#fbbf24', icon: '⚡' },
    { sdg: 8, name: 'Decent Work', value: 1456, color: '#f97316', icon: '💼' },
    { sdg: 9, name: 'Industry & Innovation', value: 1678, color: '#f97316', icon: '🏭' },
    { sdg: 10, name: 'Reduced Inequalities', value: 743, color: '#ec4899', icon: '🤝' },
    { sdg: 11, name: 'Sustainable Cities', value: 1987, color: '#f59e0b', icon: '🏙️' },
    { sdg: 12, name: 'Responsible Consumption', value: 1234, color: '#eab308', icon: '♻️' },
    { sdg: 13, name: 'Climate Action', value: 3256, color: '#10b981', icon: '🌍' },
    { sdg: 14, name: 'Life Below Water', value: 876, color: '#0ea5e9', icon: '🐟' },
    { sdg: 15, name: 'Life on Land', value: 1543, color: '#22c55e', icon: '🌳' },
    { sdg: 16, name: 'Peace & Justice', value: 654, color: '#6366f1', icon: '⚖️' },
    { sdg: 17, name: 'Partnerships', value: 856, color: '#8b5cf6', icon: '🤝' }
  ];

  const categoryData = [
    { name: 'People', value: 41, color: '#6366f1' },
    { name: 'Planet', value: 32, color: '#10b981' },
    { name: 'Prosperity', value: 17, color: '#fbbf24' },
    { name: 'Peace', value: 6, color: '#3b82f6' },
    { name: 'Partnership', value: 4, color: '#8b5cf6' }
  ];

  const topSdgs = [
    { 
      rank: 1, 
      sdg: 13, 
      name: 'Climate Action', 
      publications: 3256, 
      impactScore: 92.1,
      icon: '🌍',
      color: '#10b981'
    },
    { 
      rank: 2, 
      sdg: 3, 
      name: 'Good Health and Well-being', 
      publications: 2845, 
      impactScore: 91.3,
      icon: '❤️',
      color: '#14b8a6'
    },
    { 
      rank: 3, 
      sdg: 4, 
      name: 'Quality Education', 
      publications: 2431, 
      impactScore: 89.7,
      icon: '📚',
      color: '#ef4444'
    },
    { 
      rank: 4, 
      sdg: 7, 
      name: 'Affordable and Clean Energy', 
      publications: 2102, 
      impactScore: 88.9,
      icon: '⚡',
      color: '#fbbf24'
    },
    { 
      rank: 5, 
      sdg: 11, 
      name: 'Sustainable Cities and Communities', 
      publications: 1987, 
      impactScore: 87.5,
      icon: '🏙️',
      color: '#f59e0b'
    }
  ];

  const topResearchers = [
    { 
      rank: 1, 
      name: 'Dr. Dewi Setiawan', 
      institution: 'Universitas Airlangga',
      publications: 125,
      avatar: 'https://i.pravatar.cc/100?img=5'
    },
    { 
      rank: 2, 
      name: 'Prof. Budi Santoso', 
      institution: 'Institut Teknologi Bandung',
      publications: 98,
      avatar: 'https://i.pravatar.cc/100?img=12'
    },
    { 
      rank: 3, 
      name: 'Dr. Rita Windari', 
      institution: 'Universitas Indonesia',
      publications: 87,
      avatar: 'https://i.pravatar.cc/100?img=9'
    },
    { 
      rank: 4, 
      name: 'Prof. Rizky Pratama', 
      institution: 'IPB University',
      publications: 76,
      avatar: 'https://i.pravatar.cc/100?img=3'
    },
    { 
      rank: 5, 
      name: 'Dr. Muhammad Iqbal', 
      institution: 'Universitas Gadjah Mada',
      publications: 65,
      avatar: 'https://i.pravatar.cc/100?img=11'
    }
  ];

  const featuredPublications = [
    {
      sdg: 13,
      title: 'Climate adaptation strategies for coastal communities in Indonesia',
      journal: 'Environmental Science & Policy',
      year: 2024,
      impactScore: 94.5,
      color: '#10b981'
    },
    {
      sdg: 3,
      title: 'Improving community health through sustainable interventions',
      journal: 'BMC Public Health',
      year: 2024,
      impactScore: 93.2,
      color: '#14b8a6'
    },
    {
      sdg: 4,
      title: 'Digital learning innovation for quality education in Indonesia',
      journal: 'Computers & Education',
      year: 2024,
      impactScore: 92.1,
      color: '#ef4444'
    },
    {
      sdg: 7,
      title: 'Renewable energy potential mapping for Indonesia archipelago',
      journal: 'Renewable Energy',
      year: 2024,
      impactScore: 91.0,
      color: '#fbbf24'
    },
    {
      sdg: 11,
      title: 'Smart and sustainable cities: A systematical review',
      journal: 'Sustainable Cities and Society',
      year: 2024,
      impactScore: 90.3,
      color: '#f59e0b'
    }
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-indigo-600">Beranda</Link>
          <span>›</span>
          <span className="text-gray-900">SDGs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SDGs</h1>
        <p className="text-gray-600 max-w-4xl">
          Jelajahi kontribusi riset dan publikasi terhadap 17 Tujuan Pembangunan Berkelanjutan (Sustainable Development Goals).
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Publikasi Terkait SDGs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsData.totalPublications.toLocaleString()}</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{statsData.publicationsGrowth}% dari tahun lalu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Peneliti Berkontribusi</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsData.totalResearchers.toLocaleString()}</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{statsData.researchersGrowth}% dari tahun lalu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Institusi Berkontribusi</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsData.totalInstitutions.toLocaleString()}</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{statsData.institutionsGrowth}% dari tahun lalu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Rata-rata Skor Impact</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsData.avgImpactScore}</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{statsData.impactGrowth}% dari tahun lalu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Negara Berkontribusi</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsData.totalCountries}</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{statsData.countriesGrowth}% dari tahun lalu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('semua')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'semua' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Semua SDGs
          </button>
          <button 
            onClick={() => setActiveTab('perbandingan')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'perbandingan' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Perbandingan
          </button>
          <button 
            onClick={() => setActiveTab('peta')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'peta' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Peta Sebaran
          </button>
          <button 
            onClick={() => setActiveTab('tren')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'tren' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Tren
          </button>
        </div>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="2024">Tahun 2024</option>
          <option value="2023">Tahun 2023</option>
          <option value="2022">Tahun 2022</option>
          <option value="2021">Tahun 2021</option>
        </select>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Kontribusi Publikasi per SDGs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={publicationPerSdg} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="sdg" 
                stroke="#6b7280" 
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => `SDG ${value}`}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {publicationPerSdg.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Publikasi per Kategori SDGs</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{statsData.totalPublications.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Publikasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top SDGs Ranking */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Peringkat SDGs Berdasarkan Publikasi</h3>
          <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat Semua Peringkat
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topSdgs.map((sdg) => (
            <div key={sdg.sdg} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">
                    {sdg.rank}
                  </span>
                  <span className="text-3xl">{sdg.icon}</span>
                </div>
                <span className="text-xs font-bold text-gray-500">SDG {sdg.sdg}</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-3 line-clamp-2">{sdg.name}</h4>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sdg.publications.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Publikasi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{sdg.impactScore}</p>
                  <p className="text-xs text-gray-500">Skor Impact</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map & Top Researchers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peta Sebaran Kontribusi SDGs</h3>
          <div className="bg-gray-50 rounded-xl p-8 h-80 flex items-center justify-center relative">
            <div className="text-gray-400 text-center">
              <svg className="w-20 h-20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">World Map Visualization</p>
            </div>
            {/* Zoom controls */}
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

        {/* Top Researchers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Peneliti per SDGs</h3>
            <select 
              value={selectedSdg}
              onChange={(e) => setSelectedSdg(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500"
            >
              {publicationPerSdg.map((sdg) => (
                <option key={sdg.sdg} value={sdg.sdg}>
                  {sdg.sdg} - {sdg.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
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
                  <p className="text-sm font-bold text-gray-900">{researcher.publications}</p>
                  <p className="text-xs text-gray-500">Publikasi</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="#" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat Peringkat Lengkap
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Featured Publications */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Publikasi Unggulan untuk SDGs</h3>
          <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat Semua Publikasi
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {featuredPublications.map((pub, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: pub.color }}
                >
                  {pub.sdg}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-3 h-14">
                {pub.title}
              </h4>
              <p className="text-xs text-gray-500 mb-2">{pub.journal}</p>
              <p className="text-xs text-gray-400 mb-4">{pub.year}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Skor Impact</span>
                <span className="text-sm font-bold text-indigo-600">{pub.impactScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Bersama wujudkan masa depan yang berkelanjutan</h3>
          <p className="text-indigo-100">Temukan, kolaborasi, dan tingkatkan dampak riset Anda untuk SDGs.</p>
        </div>
        <button className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
          Mulai Berkontribusi
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </main>
  );
};

export default SdgsCluster;