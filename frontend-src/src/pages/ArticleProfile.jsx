import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

// Mock Database Artikel
const articlesDatabase = [
  {
    id: "10.1234/jess.2024.1002",
    title: "Climate Change Adaptation in Coastal Communities: A Systematic Review",
    doi: "10.1234/jess.2024.1002",
    articleType: "Review Article",
    language: "English",
    publishedDate: "15 Mei 2024",
    publisher: "Sangia Research Media and Publishing",
    coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=400&fit=crop&q=80",

    authors: [
      { name: "Andi Rahman", affiliation: "Department of Environmental Science, Universitas Indonesia, Indonesia", id: 1 },
      { name: "Budi Santoso", affiliation: "Faculty of Geography, Universitas Gadjah Mada, Indonesia", id: 2 },
      { name: "Siti Nurhaliza", affiliation: "Research Center for Climate Change, BRIN, Indonesia", id: 3 }
    ],

    citations: 652,
    hIndex: 24,
    views: 98732,
    downloads: 12843,
    altmetricScore: 124,
    impactScore: 2.48,

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

    abstract: "Artikel ini melakukan tinjauan sistematis terhadap strategi adaptasi perubahan iklim di komunitas pesisir. Hasil penelitian menunjukkan bahwa pendekatan berbasis ekosistem dan kearifan lokal memiliki peran penting dalam meningkatkan ketahanan masyarakat pesisir terhadap perubahan iklim. Studi ini menganalisis 87 publikasi dari tahun 2010-2024 dan mengidentifikasi 5 kategori utama strategi adaptasi yang telah diimplementasikan di berbagai wilayah pesisir Indonesia.",
    keywords: ["Climate Change", "Adaptation", "Coastal Communities", "Resilience", "Ecosystem-based Adaptation", "Indonesia", "Local Knowledge"],

    sdgDistribution: [
      { name: "Climate Action", value: 52, color: "#10b981", sdg: 13 },
      { name: "Sustainable Cities & Communities", value: 28, color: "#f59e0b", sdg: 11 },
      { name: "Life on Land", value: 20, color: "#84cc16", sdg: 15 }
    ],

    citationTrend: [
      { year: "2019", citations: 25 },
      { year: "2020", citations: 58 },
      { year: "2021", citations: 112 },
      { year: "2022", citations: 185 },
      { year: "2023", citations: 245 },
      { year: "2024", citations: 298 }
    ],

    performanceMetrics: [
      { year: "2019", citations: 25, views: 12500, downloads: 1200 },
      { year: "2020", citations: 58, views: 18200, downloads: 1850 },
      { year: "2021", citations: 112, views: 24800, downloads: 2450 },
      { year: "2022", citations: 185, views: 32100, downloads: 3280 },
      { year: "2023", citations: 245, views: 38500, downloads: 4120 },
      { year: "2024", citations: 298, views: 42800, downloads: 4890 }
    ],

    versions: [
      { date: "15 Mei 2024", event: "Versi Online (Published)", type: "published" },
      { date: "10 Mei 2024", event: "Versi Final", type: "final" },
      { date: "20 April 2024", event: "Revisi Setelah Review", type: "revision" },
      { date: "15 April 2024", event: "Versi Review", type: "review" },
      { date: "20 Maret 2024", event: "Versi Awal (Submitted)", type: "submitted" }
    ],

    topCitations: [
      { title: "Nature-based solutions for coastal adaptation: A global meta-analysis", journal: "Nature Climate Change, 2023", citations: 124 },
      { title: "Local knowledge and community resilience in climate adaptation", journal: "Environmental Science & Policy, 2023", citations: 98 },
      { title: "Mangrove ecosystems as climate buffer for coastal communities", journal: "Marine Policy, 2022", citations: 76 },
      { title: "Adaptation pathways in Southeast Asian coastal regions", journal: "Regional Environmental Change, 2022", citations: 65 },
      { title: "Integrating traditional and modern knowledge for climate resilience", journal: "Sustainability, 2021", citations: 54 }
    ],

    relatedArticles: [
      { title: "Community-based adaptation to sea level rise in Indonesia", journal: "Environmental Science & Policy, 2024", sdgs: [13, 11], doi: "10.1234/esp.2024.0011" },
      { title: "Ecosystem-based adaptation in coastal areas: A review", journal: "Ocean & Coastal Management, 2023", sdgs: [13, 15], doi: "10.1234/ocm.2023.0042" },
      { title: "Climate resilience through local wisdom in coastal communities", journal: "Sustainability, 2023", sdgs: [11, 15], doi: "10.1234/su.2023.0178" },
      { title: "Blue carbon and coastal adaptation strategies", journal: "Journal of Cleaner Production, 2022", sdgs: [13, 14], doi: "10.1234/jcp.2022.0889" }
    ]
  },
  {
    id: "10.1234/jess.2024.1003",
    title: "Sustainable Urban Transport Systems in Indonesia: Challenges and Opportunities",
    doi: "10.1234/jess.2024.1003",
    articleType: "Research Article",
    language: "English",
    publishedDate: "10 Maret 2024",
    publisher: "Sangia Research Media and Publishing",
    coverImage: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&h=400&fit=crop&q=80",

    authors: [
      { name: "Dewi Lestari", affiliation: "Department of Urban Planning, Institut Teknologi Bandung, Indonesia", id: 1 },
      { name: "Ahmad Fauzi", affiliation: "School of Architecture, Universitas Gadjah Mada, Indonesia", id: 2 }
    ],

    citations: 428,
    hIndex: 18,
    views: 76543,
    downloads: 9876,
    altmetricScore: 95,
    impactScore: 2.15,

    journal: {
      name: "Journal of Environmental Science and Sustainability",
      eissn: "1234-5678",
      pissn: "1234-5679",
      volume: "10",
      issue: "1",
      pages: "45-62",
      quartile: "Q2 (Environmental Science)",
      country: "Indonesia"
    },

    abstract: "Penelitian ini menganalisis tantangan dan peluang sistem transportasi berkelanjutan di kota-kota besar Indonesia. Studi ini menyoroti pentingnya integrasi moda transportasi publik dan kebijakan ramah lingkungan.",
    keywords: ["Urban Transport", "Sustainability", "Public Transit", "Indonesia", "Green Mobility"],

    sdgDistribution: [
      { name: "Sustainable Cities & Communities", value: 55, color: "#f59e0b", sdg: 11 },
      { name: "Climate Action", value: 30, color: "#10b981", sdg: 13 },
      { name: "Industry & Innovation", value: 15, color: "#f97316", sdg: 9 }
    ],

    citationTrend: [
      { year: "2020", citations: 15 },
      { year: "2021", citations: 45 },
      { year: "2022", citations: 98 },
      { year: "2023", citations: 165 },
      { year: "2024", citations: 210 }
    ],

    performanceMetrics: [
      { year: "2020", citations: 15, views: 8500, downloads: 980 },
      { year: "2021", citations: 45, views: 15200, downloads: 1650 },
      { year: "2022", citations: 98, views: 22800, downloads: 2450 },
      { year: "2023", citations: 165, views: 31500, downloads: 3280 },
      { year: "2024", citations: 210, views: 38200, downloads: 3890 }
    ],

    versions: [
      { date: "10 Maret 2024", event: "Versi Online (Published)", type: "published" },
      { date: "5 Maret 2024", event: "Versi Final", type: "final" },
      { date: "15 Februari 2024", event: "Revisi Setelah Review", type: "revision" },
      { date: "20 Januari 2024", event: "Versi Awal (Submitted)", type: "submitted" }
    ],

    topCitations: [
      { title: "Smart city transportation frameworks in developing countries", journal: "Cities, 2023", citations: 87 },
      { title: "Electric vehicle adoption in Southeast Asia", journal: "Transport Policy, 2023", citations: 65 }
    ],

    relatedArticles: [
      { title: "Bus rapid transit systems in Asian megacities", journal: "Transport Reviews, 2023", sdgs: [11, 13], doi: "10.1234/tr.2023.0021" },
      { title: "Cycling infrastructure and urban mobility", journal: "Journal of Transport Geography, 2023", sdgs: [11, 3], doi: "10.1234/jtg.2023.0055" }
    ]
  }
];

const ArticleProfile = () => {
  const location = useLocation();
  const doi = location.pathname.replace('/doi/', '');
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ringkasan');

  useEffect(() => {
    setLoading(true);
    const decodedDoi = decodeURIComponent(doi);
    const foundArticle = articlesDatabase.find(art =>
      art.doi === decodedDoi || art.id === decodedDoi
    );
    if (foundArticle) {
      setArticle(foundArticle);
    } else {
      console.error(`Artikel dengan DOI ${decodedDoi} tidak ditemukan`);
    }
    setLoading(false);
  }, [doi]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString?.() ?? entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat artikel...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Maaf, artikel dengan DOI {doi} tidak tersedia dalam database kami.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/articles')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Kembali ke Daftar Artikel
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Ke Beranda
            </button>
          </div>
        </div>
      </main>
    );
  }

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
                onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
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
            { id: 'sitasi', label: 'Sitasi' },
            { id: 'metrik', label: 'Metrik' },
            { id: 'versi', label: 'Versi' },
            { id: 'terkait', label: 'Artikel Terkait' }
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

      {/* Tab: Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Abstract & Keywords */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Abstrak</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{article.abstract}</p>
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
          </div>

          {/* Journal & Article Info + Version */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journal Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Jurnal & Penerbit</h3>
              <div className="flex gap-4 mb-4">
                <img
                  src={article.coverImage}
                  alt={article.journal.name}
                  className="w-20 h-24 object-cover rounded-lg"
                  onError={(e) => { e.target.src = '/assets/img/journal-default.svg'; }}
                />
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
              <Link
                to="/journals/jess-2024"
                className="mt-4 w-full py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm text-center block"
              >
                Lihat Profil Jurnal
              </Link>
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
                  <span className="text-gray-600">Diterbitkan</span>
                  <span className="font-semibold text-gray-900">{article.publishedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipe</span>
                  <span className="font-semibold text-gray-900">{article.articleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lisensi</span>
                  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline text-xs">CC BY 4.0</a>
                </div>
              </div>
            </div>

            {/* Version History Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Versi & Riwayat</h3>
                <button onClick={() => setActiveTab('versi')} className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
              </div>
              <div className="space-y-4">
                {article.versions.slice(0, 3).map((version, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        version.type === 'published' ? 'bg-green-500' :
                        version.type === 'final' ? 'bg-blue-500' :
                        version.type === 'revision' ? 'bg-yellow-500' :
                        version.type === 'review' ? 'bg-purple-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{version.date}</p>
                      <p className="text-xs text-gray-600">{version.event}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('versi')}
                className="mt-6 w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Lihat Semua Versi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sitasi */}
      {activeTab === 'sitasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Citation Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tren Sitasi per Tahun</h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option>Semua Tahun</option>
                <option>5 Tahun Terakhir</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={article.citationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} name="Sitasi" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xl font-bold text-indigo-700">{article.citations}</p>
                <p className="text-xs text-gray-600">Total Sitasi</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xl font-bold text-purple-700">{article.hIndex}</p>
                <p className="text-xs text-gray-600">h-Index</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xl font-bold text-green-700">{article.citationTrend.length}</p>
                <p className="text-xs text-gray-600">Tahun Data</p>
              </div>
            </div>
          </div>

          {/* Top Citations List */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Kutipan Teratas</h3>
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
            </div>
            <div className="space-y-4">
              {article.topCitations.map((citation, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 font-bold text-sm">#{idx + 1}</span>
                  </div>
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
        </div>
      )}

      {/* Tab: Metrik */}
      {activeTab === 'metrik' && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Views', value: article.views.toLocaleString(), bgColor: 'bg-blue-50', textColor: 'text-blue-600', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
              { label: 'Total Downloads', value: article.downloads.toLocaleString(), bgColor: 'bg-green-50', textColor: 'text-green-600', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
              { label: 'Total Sitasi', value: article.citations.toLocaleString(), bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
              { label: 'Altmetric Score', value: article.altmetricScore, bgColor: 'bg-orange-50', textColor: 'text-orange-600', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${metric.bgColor}`}>
                  <svg className={`w-6 h-6 ${metric.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={metric.icon} />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Combined Performance Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Performa Metrik per Tahun</h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
                <option>Semua Tahun</option>
                <option>5 Tahun Terakhir</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={article.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="citations" fill="#6366f1" name="Sitasi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="downloads" fill="#10b981" name="Downloads" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Views Trend */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Tren Views per Tahun</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={article.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Versi */}
      {activeTab === 'versi' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Riwayat Versi Artikel</h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {article.versions.map((version, idx) => (
                  <div key={idx} className="flex gap-6 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      version.type === 'published' ? 'bg-green-500' :
                      version.type === 'final' ? 'bg-blue-500' :
                      version.type === 'revision' ? 'bg-yellow-500' :
                      version.type === 'review' ? 'bg-purple-500' : 'bg-gray-400'
                    }`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-grow pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{version.event}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          version.type === 'published' ? 'bg-green-50 text-green-700' :
                          version.type === 'final' ? 'bg-blue-50 text-blue-700' :
                          version.type === 'revision' ? 'bg-yellow-50 text-yellow-700' :
                          version.type === 'review' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'
                        }`}>{version.type}</span>
                      </div>
                      <p className="text-sm text-gray-500">{version.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Artikel Terkait */}
      {activeTab === 'terkait' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Artikel Terkait ({article.relatedArticles.length})</h2>
            <Link to="/articles" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              Jelajahi semua artikel
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.relatedArticles.map((related, idx) => (
              <Link
                key={idx}
                to={`/doi/${related.doi}`}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all block"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-indigo-700 transition-colors">{related.title}</h4>
                    <p className="text-xs text-gray-500 mb-3">{related.journal}</p>
                    <div className="flex gap-1 flex-wrap">
                      {related.sdgs.map((sdg) => (
                        <span key={sdg} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">
                          SDG {sdg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/articles" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Lihat semua artikel
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg mt-8">
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
