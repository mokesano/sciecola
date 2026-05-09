import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const JournalProfile = () => {
  const { journalId } = useParams();
  
  // Simulasi data jurnal - nanti bisa diganti dengan API call
  const [journal] = useState({
    id: "jess-2024",
    name: "Journal of Environmental Science and Sustainability",
    eissn: "1234-5678",
    pissn: "1234-5679",
    publisher: "Sangia Research Media and Publishing",
    website: "https://journals.sangia.org/jess",
    subject: "Environmental Science",
    country: "Indonesia",
    language: "English",
    established: "2018",
    frequency: "4 issue / tahun",
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop&q=80",
    
    // Stats
    totalArticles: 356,
    totalAuthors: 1248,
    totalCitations: 5732,
    totalViews: 98732,
    impactScore: 2.48,
    sdgsCovered: 15,
    
    // Performance metrics
    acceptanceRate: "24%",
    avgReviewTime: "28 Hari",
    avgPublishTime: "4 Hari",
    citationsPerArticle: "16.1",
    hIndex: "17",
    
    // SDG Distribution
    sdgDistribution: [
      { name: "Climate Action", value: 28, color: "#10b981" },
      { name: "Sustainable Cities", value: 20, color: "#f59e0b" },
      { name: "Good Health", value: 16, color: "#ef4444" },
      { name: "Clean Energy", value: 12, color: "#fbbf24" },
      { name: "Quality Education", value: 10, color: "#3b82f6" },
      { name: "Industry, Innovation", value: 8, color: "#8b5cf6" },
      { name: "Lainnya", value: 6, color: "#6b7280" }
    ],
    
    // Publication trend
    publicationTrend: [
      { year: "2018", count: 45 },
      { year: "2019", count: 48 },
      { year: "2020", count: 52 },
      { year: "2021", count: 58 },
      { year: "2022", count: 65 },
      { year: "2023", count: 68 },
      { year: "2024", count: 85 }
    ],
    
    // Citation trend
    citationTrend: [
      { year: "2018", citations: 450 },
      { year: "2019", citations: 520 },
      { year: "2020", citations: 780 },
      { year: "2021", citations: 1050 },
      { year: "2022", citations: 1280 },
      { year: "2023", citations: 1450 },
      { year: "2024", citations: 1680 }
    ],
    
    // Top articles
    topArticles: [
      {
        id: 1,
        title: "Climate Change Adaptation in Coastal Communities",
        volume: "Vol. 6 No. 2 (2020)",
        citations: 124,
        thumbnail: "https://via.placeholder.com/60x60/3b82f6/ffffff?text=CC"
      },
      {
        id: 2,
        title: "Sustainable Urban Transport Systems in Indonesia",
        volume: "Vol. 5 No. 1 (2019)",
        citations: 98,
        thumbnail: "https://via.placeholder.com/60x60/10b981/ffffff?text=UT"
      },
      {
        id: 3,
        title: "Renewable Energy Policy and Its Impact",
        volume: "Vol. 4 No. 2 (2018)",
        citations: 76,
        thumbnail: "https://via.placeholder.com/60x60/f59e0b/ffffff?text=RE"
      },
      {
        id: 4,
        title: "Mangrove Restoration and Coastal Resilience",
        volume: "Vol. 6 No. 3 (2020)",
        citations: 65,
        thumbnail: "https://via.placeholder.com/60x60/14b8a6/ffffff?text=MR"
      },
      {
        id: 5,
        title: "Waste Management Strategies for Sustainable Cities",
        volume: "Vol. 8 No. 2 (2022)",
        citations: 59,
        thumbnail: "https://via.placeholder.com/60x60/8b5cf6/ffffff?text=WM"
      }
    ],
    
    // Access stats monthly
    accessStats: [
      { month: "Jan", views: 6500 },
      { month: "Feb", views: 7200 },
      { month: "Mar", views: 8100 },
      { month: "Apr", views: 9800 },
      { month: "Mei", views: 11200 },
      { month: "Jun", views: 13500 },
      { month: "Jul", views: 12800 },
      { month: "Agu", views: 14200 },
      { month: "Sep", views: 15800 },
      { month: "Okt", views: 17200 },
      { month: "Nov", views: 16500 },
      { month: "Des", views: 15900 }
    ],
    
    // Indexing databases
    indexing: ["Scopus", "DOAJ", "Dimensions", "Google Scholar", "Crossref", "GARUDA", "Sinta"]
  });

  const [activeTab, setActiveTab] = useState('ringkasan');

  // Custom tooltip for charts
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
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Journal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Journal Cover & Basic Info */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Cover Image */}
            <div className="shrink-0">
              <img
                src={journal.coverImage}
                alt={journal.name}
                onError={(e) => { e.target.src = '/assets/img/journal-default.svg'; }}
                className="w-full sm:w-48 h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
            
            {/* Journal Details */}
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{journal.name}</h1>
              <p className="text-gray-600 mb-4">
                EISSN: {journal.eissn} | PISSN: {journal.pissn}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-gray-600">Penerbit: <span className="font-medium text-gray-900">{journal.publisher}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <a href={journal.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Website: {journal.website}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-gray-600">Subject: <span className="font-medium text-gray-900">{journal.subject}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <span className="text-gray-600">Negara: <span className="font-medium text-gray-900">{journal.country}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-gray-600">Bahasa: <span className="font-medium text-gray-900">{journal.language}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">Terbit Sejak: <span className="font-medium text-gray-900">{journal.established}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Frekuensi Terbit: <span className="font-medium text-gray-900">{journal.frequency}</span></span>
                </div>
              </div>
              
              <button className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                <span>Kunjungi Website</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.totalArticles}</p>
              <p className="text-sm text-gray-600 mt-1">Artikel</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.totalAuthors.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Penulis</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.totalCitations.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Sitasi</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.totalViews.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Views</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.impactScore}</p>
              <p className="text-sm text-gray-600 mt-1">Impact Score</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.sdgsCovered}</p>
              <p className="text-sm text-gray-600 mt-1">SDGs Tercakup</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'ringkasan', label: 'Ringkasan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'artikel', label: 'Artikel', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
            { id: 'statistik', label: 'Statistik', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'sdgs', label: 'SDGs', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'editorial', label: 'Editorial Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'informasi', label: 'Informasi', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((tab) => (
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Artikel', value: journal.totalArticles, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Total Penulis', value: journal.totalAuthors, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Total Sitasi', value: journal.totalCitations, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
          { label: 'Total Views', value: journal.totalViews, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          { label: 'Impact Score', value: journal.impactScore, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'SDGs Tercakup', value: journal.sdgsCovered, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Publication Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Publikasi</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Semua Tahun</option>
              <option>5 Tahun Terakhir</option>
              <option>10 Tahun Terakhir</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={journal.publicationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SDG Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Artikel per SDGs</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={journal.sdgDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {journal.sdgDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-grow space-y-2">
              {journal.sdgDistribution.map((sdg, idx) => (
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

      {/* Indexing & Citation Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Indexing */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Indeksasi & Database</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {journal.indexing.map((db, idx) => (
              <div key={idx} className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-700">{db}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Citation Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Sitasi</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Semua Tahun</option>
              <option>5 Tahun Terakhir</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={journal.citationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance & Top Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Journal Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Performa Jurnal</h3>
          <div className="space-y-4">
            {[
              { label: 'Acceptance Rate', value: journal.acceptanceRate },
              { label: 'Waktu Review Rata-rata', value: journal.avgReviewTime },
              { label: 'Waktu Terbit Rata-rata', value: journal.avgPublishTime },
              { label: 'Tingkat Sitasi per Artikel', value: journal.citationsPerArticle },
              { label: 'H-Index', value: journal.hIndex }
            ].map((metric, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-gray-600">{metric.label}</span>
                </div>
                <span className="font-bold text-gray-900">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Articles */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Artikel Berdasarkan Sitasi</h3>
            <Link to="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Lihat semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {journal.topArticles.map((article) => (
              <div key={article.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={article.thumbnail} alt={article.title} onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{article.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{article.volume}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                      {article.citations} Sitasi
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* World Map & Access Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Author Contribution Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peta Kontribusi Penulis</h3>
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <svg className="w-full h-48 text-gray-300" fill="currentColor" viewBox="0 0 1200 600">
              {/* Simplified world map placeholder */}
              <path d="M150,200 Q200,150 250,200 T350,200 T450,180 T550,200 T650,190 T750,210 T850,200 T950,190" stroke="currentColor" strokeWidth="2" fill="none" />
              <text x="50%" y="50%" textAnchor="middle" className="text-gray-400 text-sm">World Map Visualization</text>
            </svg>
            <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-200 rounded"></div>
                1-100
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-400 rounded"></div>
                101-500
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                500+
              </span>
            </div>
          </div>
        </div>

        {/* Access Statistics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Statistik Akses</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Tahun 2024</option>
              <option>Tahun 2023</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={journal.accessStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="views" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Ingin menganalisis artikel dari jurnal ini?</h3>
            <p className="text-indigo-100">Masukkan DOI atau ORCID untuk mendapatkan analisis dan klasifikasi SDGs secara instan.</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <input 
              type="text" 
              placeholder="Masukkan DOI atau ORCID"
              className="flex-grow lg:w-80 px-4 py-3 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
              Analisis Sekarang
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