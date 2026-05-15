import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const ArticleProfile = () => {
  const location = useLocation();
  const doiCode = location.pathname.replace('/doi/', '');
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ringkasan');

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        const decodedDoi = decodeURIComponent(doiCode);
        const response = await fetch(`/api/article_profile.php?doi=${encodeURIComponent(decodedDoi)}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Artikel tidak ditemukan' : 'Gagal memuat artikel');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setArticle(data);
        } else {
          setError(data.message || 'Gagal memuat artikel');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [doiCode]);

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

  if (error || !article) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">
            {error || `Maaf, artikel dengan DOI ${decodeURIComponent(doiCode)} tidak tersedia.`}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Coba Lagi
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
                src={article.coverImage ?? '/assets/img/article-default.svg'}
                alt={article.title ?? 'Article'}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {article.title ?? 'Untitled Article'}
              </h1>

              {/* Authors */}
              <div className="mb-4">
                {article.authors && article.authors.length > 0 ? (
                  <>
                    {article.authors.map((author, idx) => (
                      <div key={author.id ?? idx} className="flex items-start gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{author.name}</span>
                        <span className="text-xs text-gray-500">⁰{idx + 1}</span>
                      </div>
                    ))}
                    {article.authors.map((author, idx) => (
                      <div key={`aff-${idx}`} className="text-xs text-gray-600 ml-4">
                        <span className="text-gray-400 mr-1">{idx + 1}</span>
                        {author.affiliation ?? 'Unknown Affiliation'}
                      </div>
                    ))}
                    {article.authors.length > 1 && (
                      <button className="text-indigo-600 text-sm font-medium mt-2 hover:text-indigo-700">
                        + Lihat semua penulis
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No authors information available</p>
                )}
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
                  <p className="font-semibold text-gray-900">{article.articleType ?? 'Research Article'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Bahasa</p>
                  <p className="font-semibold text-gray-900">{article.language ?? 'English'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Diterbitkan</p>
                  <p className="font-semibold text-gray-900">{article.publishedDate ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Penerbit</p>
                  <p className="font-semibold text-gray-900 text-xs">{article.publisher ?? 'CrossRef'}</p>
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
                <p className="text-2xl font-bold text-gray-900">{article.citations ?? 0}</p>
              </div>
              <p className="text-xs text-gray-600">Sitasi</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(article.citationTrend ?? []).slice(-5)}>
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
                <p className="text-2xl font-bold text-gray-900">{article.hIndex ?? 0}</p>
              </div>
              <p className="text-xs text-gray-600">h-Index</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(article.citationTrend ?? []).slice(-5)}>
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
                <p className="text-2xl font-bold text-gray-900">{(article.views ?? 0).toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-600">Views</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(article.performanceMetrics ?? []).slice(-5)}>
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
                <p className="text-2xl font-bold text-gray-900">{(article.downloads ?? 0).toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-600">Downloads</p>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(article.performanceMetrics ?? []).slice(-5)}>
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
                <p className="text-2xl font-bold text-gray-900">{article.altmetricScore ?? 0}</p>
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
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { id: 'ringkasan',    label: 'Ringkasan',      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'teks-kutipan', label: 'Teks & Kutipan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'sdgs',         label: 'SDGs',           icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'metrik',       label: 'Metrik',         icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'kolaborasi',   label: 'Kolaborasi',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'versi',        label: 'Versi',          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'informasi',    label: 'Informasi',      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
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
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {article.abstract ?? 'No abstract available'}
              </p>
              {article.keywords && article.keywords.length > 0 && (
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
              )}
            </div>

            {/* SDG Classification */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Klasifikasi SDGs</h3>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat detail</button>
              </div>
              {article.sdgDistribution && article.sdgDistribution.length > 0 ? (
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
              ) : (
                <p className="text-gray-500 text-sm">No SDG classification available</p>
              )}
            </div>
          </div>

          {/* Journal & Article Info + Version */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journal Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Jurnal & Penerbit</h3>
              <div className="flex gap-4 mb-4">
                <img
                  src={article.coverImage ?? '/assets/img/journal-default.svg'}
                  alt={article.journal?.name ?? 'Journal'}
                  className="w-20 h-24 object-cover rounded-lg"
                  onError={(e) => { e.target.src = '/assets/img/journal-default.svg'; }}
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    {article.journal?.name ?? 'Unknown Journal'}
                  </h4>
                  {article.journal?.issn && (
                    <p className="text-xs text-gray-600 mb-1">ISSN: {article.journal.issn}</p>
                  )}
                  <p className="text-xs text-gray-600 mb-1">Penerbit: {article.publisher ?? 'CrossRef'}</p>
                </div>
              </div>
              {article.journal?.quartile && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Quartile:</span> {article.journal.quartile}
                  </p>
                </div>
              )}
              <Link
                to="/journals"
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

            {/* Preprint Links Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Preprint</h3>
                <button onClick={() => setActiveTab('versi')} className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua</button>
              </div>
              <div className="space-y-4">
                {article.preprintLinks && article.preprintLinks.length > 0 ? (
                  article.preprintLinks.slice(0, 3).map((preprint, idx) => (
                    <a key={idx} href={preprint.preprint_url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors block">
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                          {preprint.preprint_server.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{preprint.preprint_server}</p>
                        <p className="text-xs text-gray-500">{preprint.publication_date}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Tidak ada preprint yang tersedia</p>
                )}
              </div>
              {article.preprintLinks && article.preprintLinks.length > 3 && (
                <button
                  onClick={() => setActiveTab('versi')}
                  className="mt-6 w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Lihat Semua Preprint
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sitasi */}
      {/* Tab: Teks & Kutipan */}
      {activeTab === 'teks-kutipan' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Abstrak Lengkap</h3>
            <p className="text-gray-700 leading-relaxed text-sm">{article.abstract}</p>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3">Kata Kunci</h4>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">{kw}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Kutipan Teratas</h3>
              <span className="text-sm text-gray-500">{article.citations} total sitasi</span>
            </div>
            <div className="space-y-4">
              {article.topCitations.map((citation, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 font-bold text-sm">#{idx + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{citation.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{citation.journal}</p>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{citation.citations} Sitasi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Tren Sitasi per Tahun</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={article.citationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} name="Sitasi" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: SDGs */}
      {activeTab === 'sdgs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Klasifikasi SDGs</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={article.sdgDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {article.sdgDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Proporsi']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Detail Kontribusi SDG</h3>
              <div className="space-y-4">
                {article.sdgDistribution.map((sdg, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: sdg.color }} />
                        <span className="text-sm font-medium text-gray-800">SDG {sdg.sdg} — {sdg.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{sdg.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${sdg.value}%`, background: sdg.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h3 className="font-bold text-indigo-900 mb-2">Tentang Klasifikasi Ini</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">Klasifikasi SDG dilakukan menggunakan model AI Wizdam yang menganalisis judul, abstrak, dan kata kunci artikel. Skor mencerminkan relevansi konten terhadap masing-masing tujuan pembangunan berkelanjutan PBB.</p>
          </div>
        </div>
      )}

      {/* Tab: Kolaborasi */}
      {activeTab === 'kolaborasi' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Penulis & Afiliasi</h3>
            <div className="space-y-4">
              {article.authors.map((author, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{author.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{author.affiliation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Artikel Terkait</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.relatedArticles.map((related, idx) => (
                <Link key={idx} to={`/doi/${encodeURIComponent(related.doi)}`}
                  className="block p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex gap-2 mb-2">
                    {related.sdgs.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">SDG {s}</span>
                    ))}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{related.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{related.journal}</p>
                </Link>
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

      {/* Tab: Preprint */}
      {activeTab === 'versi' && (
        <div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Tautan Preprint</h3>
            {article.preprintLinks && article.preprintLinks.length > 0 ? (
              <div className="space-y-4">
                {article.preprintLinks.map((preprint, idx) => (
                  <a
                    key={idx}
                    href={preprint.preprint_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{preprint.preprint_server.charAt(0).toUpperCase() + preprint.preprint_server.slice(1)}</h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">Preprint</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{preprint.preprint_doi || preprint.preprint_url}</p>
                      <p className="text-xs text-gray-500 mt-1">Sumber: {preprint.source || 'CrossRef'} · {preprint.publication_date}</p>
                    </div>
                    <div className="shrink-0 text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Tidak ada preprint</p>
                <p className="text-sm text-gray-400 mt-1">Artikel ini tidak memiliki preprint yang terdaftar di server preprint utama (ArXiv, BioRxiv, MedRxiv, SSRN, OSF)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Informasi */}
      {activeTab === 'informasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Informasi Artikel</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'DOI', value: article.doi },
                { label: 'EISSN', value: article.journal.eissn },
                { label: 'PISSN', value: article.journal.pissn },
                { label: 'Volume', value: article.journal.volume },
                { label: 'Issue', value: article.journal.issue },
                { label: 'Halaman', value: article.journal.pages },
                { label: 'Tipe Artikel', value: article.articleType },
                { label: 'Bahasa', value: article.language },
                { label: 'Diterbitkan', value: article.publishedDate },
                { label: 'Penerbit', value: article.publisher },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
                  <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Jurnal & Penerbit</h3>
              <Link to={`/journals/${article.journal.name.toLowerCase().replace(/\s+/g,'-')}`}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 text-sm">{article.journal.name}</p>
                  <p className="text-xs text-gray-500 mt-1">EISSN: {article.journal.eissn} | PISSN: {article.journal.pissn}</p>
                  <p className="text-xs text-gray-500">{article.publisher} · {article.journal.country}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{article.journal.quartile}</span>
                </div>
              </Link>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Hak Cipta & Lisensi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3"><span className="text-gray-500 w-24 shrink-0">Hak Cipta</span><span className="font-medium text-gray-800">© {new Date().getFullYear()} Penulis</span></div>
                <div className="flex gap-3"><span className="text-gray-500 w-24 shrink-0">Lisensi</span><a href="https://creativecommons.org/licenses/by/4.0/" className="font-medium text-indigo-600 hover:underline">CC BY 4.0</a></div>
              </div>
            </div>
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
