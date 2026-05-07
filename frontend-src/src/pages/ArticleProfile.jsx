import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const ArticleProfile = () => {
  const { doi } = useParams();
  
  // Simulasi data artikel
  const [article] = useState({
    title: "Climate Change Adaptation in Coastal Communities: A Systematic Review",
    doi: "10.1234/jess.2024.1002",
    articleType: "Review Article",
    language: "English",
    publishedDate: "15 Mei 2024",
    publisher: "Sangia Research Media and Publishing",
    coverImage: "https://via.placeholder.com/300x400/1e40af/ffffff?text=Article",
    
    // Authors
    authors: [
      { name: "Andi Rahman", affiliation: "Department of Environmental Science, Universitas Indonesia, Indonesia", id: 1 },
      { name: "Budi Santoso", affiliation: "Faculty of Geography, Universitas Gadjah Mada, Indonesia", id: 2 },
      { name: "Siti Nurhaliza", affiliation: "Research Center for Climate Change, BRIN, Indonesia", id: 3 }
    ],
    
    // Stats
    citations: 652,
    hIndex: 24,
    views: 98732,
    downloads: 12843,
    altmetricScore: 124,
    impactScore: 2.48,
    
    // Journal info
    journal: {
      name: "Journal of Environmental Science and Sustainability",
      eissn: "1234-5678",
      pissn: "1234-5679",
      volume: "10",
      issue: "2",
      pages: "123-145",
      quartile: "Q2 (Environmental Science)",
      country: "Indonesia"
    },
    
    // Article details
    abstract: "Artikel ini melakukan tinjauan sistematis terhadap strategi adaptasi perubahan iklim di komunitas pesisir. Hasil penelitian menunjukkan bahwa pendekatan berbasis ekosistem dan kearifan lokal memiliki peran penting dalam meningkatkan ketahanan masyarakat pesisir terhadap perubahan iklim.",
    keywords: ["Climate Change", "Adaptation", "Coastal Communities", "Resilience", "Ecosystem-based Adaptation", "Indonesia", "Local Knowledge"],
    
    // SDG Distribution
    sdgDistribution: [
      { name: "Climate Action", value: 52, color: "#10b981", sdg: 13 },
      { name: "Sustainable Cities & Communities", value: 28, color: "#f59e0b", sdg: 11 },
      { name: "Life on Land", value: 20, color: "#84cc16", sdg: 15 }
    ],
    
    // Citation trend
    citationTrend: [
      { year: "2019", citations: 25 },
      { year: "2020", citations: 58 },
      { year: "2021", citations: 112 },
      { year: "2022", citations: 185 },
      { year: "2023", citations: 245 },
      { year: "2024", citations: 298 }
    ],
    
    // Performance metrics
    performanceMetrics: [
      { year: "2019", citations: 25, views: 12500, downloads: 1200 },
      { year: "2020", citations: 58, views: 18200, downloads: 1850 },
      { year: "2021", citations: 112, views: 24800, downloads: 2450 },
      { year: "2022", citations: 185, views: 32100, downloads: 3280 },
      { year: "2023", citations: 245, views: 38500, downloads: 4120 },
      { year: "2024", citations: 298, views: 42800, downloads: 4890 }
    ],
    
    // Version history
    versions: [
      { date: "15 Mei 2024", event: "Versi Online (Published)", type: "published" },
      { date: "10 Mei 2024", event: "Versi Final", type: "final" },
      { date: "20 April 2024", event: "Revisi Setelah Review", type: "revision" },
      { date: "15 April 2024", event: "Versi Review", type: "review" },
      { date: "20 Maret 2024", event: "Versi Awal (Submitted)", type: "submitted" }
    ],
    
    // Top citations
    topCitations: [
      { title: "Nature-based solutions for coastal adaptation: A global meta-analysis", journal: "Nature Climate Change, 2023", citations: 124 },
      { title: "Local knowledge and community resilience in climate adaptation", journal: "Environmental Science & Policy, 2023", citations: 98 },
      { title: "Mangrove ecosystems as climate buffer for coastal communities", journal: "Marine Policy, 2022", citations: 76 },
      { title: "Adaptation pathways in Southeast Asian coastal regions", journal: "Regional Environmental Change, 2022", citations: 65 },
      { title: "Integrating traditional and modern knowledge for climate resilience", journal: "Sustainability, 2021", citations: 54 }
    ],
    
    // Related articles
    relatedArticles: [
      { title: "Community-based adaptation to sea level rise in Indonesia", journal: "Environmental Science & Policy, 2024", sdgs: [13, 11] },
      { title: "Ecosystem-based adaptation in coastal areas: A review", journal: "Ocean & Coastal Management, 2023", sdgs: [13, 15] },
      { title: "Climate resilience through local wisdom in coastal communities", journal: "Sustainability, 2023", sdgs: [11, 15] },
      { title: "Blue carbon and coastal adaptation strategies", journal: "Journal of Cleaner Production, 2022", sdgs: [13, 14] }
    ]
  });

  const [activeTab, setActiveTab] = useState('ringkasan');

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Article Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Article Cover & Basic Info */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Cover Image */}
            <div className="shrink-0">
              <img 
                src={article.coverImage} 
                alt={article.title}
                className="w-full sm:w-48 h-64 object-cover rounded-xl shadow-lg"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">Open Access</span>
              </div>
            </div>
            
            {/* Article Details */}
            <div className="flex-grow">
              <div className="mb-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  Artikel Terklasifikasi
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>
              
              {/* Authors */}
              <div className="mb-4">
                {article.authors.map((author, idx) => (
                  <div key={author.id} className="flex items-start gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{author.name}</span>
                    <span className="text-xs text-gray-500">⁰{idx + 1}</span>
                  </div>
                ))}
                {article.authors.map((author, idx) => (
                  <div key={idx} className="text-xs text-gray-600 ml-4">
                    <span className="text-gray-400 mr-1">{idx + 1}</span>
                    {author.affiliation}
                  </div>
                ))}
                <button className="text-indigo-600 text-sm font-medium mt-2 hover:text-indigo-700">
                  + Lihat semua penulis
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Unduh PDF
                </button>
                <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Kutip
                </button>
                <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Bagikan
                </button>
              </div>
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Jenis Artikel</p>
                  <p className="font-semibold text-gray-900">{article.articleType}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Bahasa</p>
                  <p className="font-semibold text-gray-900">{article.language}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Diterbitkan</p>
                  <p className="font-semibold text-gray-900">{article.publishedDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Penerbit</p>
                  <p className="font-semibold text-gray-900 text-xs">{article.publisher}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-2xl font-bold text-gray-900">{article.citations}</p>
              </div>
              <p className="text-xs text-gray-600">Sitasi</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={article.citationTrend.slice(-5)}>
                    <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-2xl font-bold text-gray-900">{article.hIndex}</p>
              </div>
              <p className="text-xs text-gray-600">h-Index</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={article.citationTrend.slice(-5)}>
                    <Line type="monotone" dataKey="citations" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-2xl font-bold text-gray-900">{article.views.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-600">Views</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={article.performanceMetrics.slice(-5)}>
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <p className="text-2xl font-bold text-gray-900">{article.downloads.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-600">Downloads</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={article.performanceMetrics.slice(-5)}>
                    <Line type="monotone" dataKey="downloads" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Altmetric Score</p>
                <p className="text-2xl font-bold text-gray-900">{article.altmetricScore}</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 transform rotate-45"></div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Impact Score</p>
                <p className="text-2xl font-bold text-gray-900">{article.impactScore}</p>
              </div>
            </div>
            <div className="h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={article.citationTrend.slice(-5)}>
                  <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analisis Artikel
        </button>
        <button className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Tambahkan ke Koleksi
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'ringkasan', label: 'Ringkasan' },
            { id: 'teks', label: 'Teks & Kutipan' },
            { id: 'sdgs', label: 'SDGs' },
            { id: 'metrik', label: 'Metrik' },
            { id: 'kolaborasi', label: 'Kolaborasi' },
            { id: 'versi', label: 'Versi' },
            { id: 'informasi', label: 'Informasi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Abstract */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{article.abstract}</p>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1">
              Lihat selengkapnya
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Kata Kunci</h4>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SDG Classification */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Klasifikasi SDGs</h3>
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat detail</button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={article.sdgDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {article.sdgDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-grow space-y-3">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-gray-900">{article.sdgDistribution.length}</p>
                  <p className="text-xs text-gray-500">SDGs</p>
                </div>
                {article.sdgDistribution.map((sdg, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: sdg.color }}>
                      {sdg.sdg}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900">{sdg.name}</p>
                      <p className="text-xs text-gray-500">({sdg.value}%)</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <LineChart data={article.citationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Performa Metrik</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={article.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="citations" fill="#6366f1" name="Sitasi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="views" fill="#3b82f6" name="Views" radius={[4, 4, 0, 0]} />
                <Bar dataKey="downloads" fill="#10b981" name="Downloads" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Journal & Article Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Journal Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Jurnal & Penerbit</h3>
          <div className="flex gap-4 mb-4">
            <img src={article.coverImage} alt={article.journal.name} className="w-20 h-24 object-cover rounded-lg" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{article.journal.name}</h4>
              <p className="text-xs text-gray-600 mb-1">EISSN: {article.journal.eissn}</p>
              <p className="text-xs text-gray-600 mb-1">PISSN: {article.journal.pissn}</p>
              <p className="text-xs text-gray-600 mb-1">Penerbit: {article.publisher}</p>
              <p className="text-xs text-gray-600">Negara: {article.journal.country}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Quartile:</span> {article.journal.quartile}
            </p>
          </div>
          <button className="mt-4 w-full py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm">
            Lihat Profil Jurnal
          </button>
        </div>

        {/* Article Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Artikel</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">DOI</span>
              <span className="font-semibold text-gray-900 text-xs">{article.doi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EISSN</span>
              <span className="font-semibold text-gray-900">{article.journal.eissn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PISSN</span>
              <span className="font-semibold text-gray-900">{article.journal.pissn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume</span>
              <span className="font-semibold text-gray-900">{article.journal.volume}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Issue</span>
              <span className="font-semibold text-gray-900">{article.journal.issue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Halaman</span>
              <span className="font-semibold text-gray-900">{article.journal.pages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Diterima</span>
              <span className="font-semibold text-gray-900">20 Maret 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Diterbitkan</span>
              <span className="font-semibold text-gray-900">{article.publishedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipe</span>
              <span className="font-semibold text-gray-900">{article.articleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hak Cipta</span>
              <span className="font-semibold text-gray-900">© 2024 Penulis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lisensi</span>
              <a href="#" className="font-semibold text-indigo-600 hover:underline text-xs">CC BY 4.0</a>
            </div>
          </div>
        </div>

        {/* Version History */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Versi & Riwayat</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
          </div>
          <div className="space-y-4">
            {article.versions.map((version, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    version.type === 'published' ? 'bg-green-500' :
                    version.type === 'final' ? 'bg-blue-500' :
                    version.type === 'revision' ? 'bg-yellow-500' :
                    version.type === 'review' ? 'bg-purple-500' : 'bg-gray-400'
                  }`}></div>
                  {idx !== article.versions.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 ml-1"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{version.date}</p>
                  <p className="text-xs text-gray-600">{version.event}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
            Lihat Semua Versi
          </button>
        </div>
      </div>

      {/* Citations & Related Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Citations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Kutipan Teratas</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
          </div>
          <div className="space-y-4">
            {article.topCitations.map((citation, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={`https://via.placeholder.com/60x60/${['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6'][idx]}/ffffff?text=C${idx + 1}`} alt="" className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{citation.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{citation.journal}</p>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                    {citation.citations} Sitasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Artikel Terkait</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
          </div>
          <div className="space-y-4">
            {article.relatedArticles.map((related, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={`https://via.placeholder.com/60x60/${['10b981', '84cc16', 'f59e0b', '3b82f6'][idx]}/ffffff?text=A${idx + 1}`} alt="" className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{related.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{related.journal}</p>
                  <div className="flex gap-1">
                    {related.sdgs.map((sdg) => (
                      <span key={sdg} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Ingin menganalisis artikel ini lebih dalam?</h3>
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

export default ArticleProfile;