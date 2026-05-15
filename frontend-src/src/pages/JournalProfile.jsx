import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// Helper function to extract ISSN from journal ID
const extractISSNFromId = (journalId) => {
  if (!journalId) return null;

  // If format is XXXX-XXXX (ISSN format), use directly
  if (/^\d{4}-\d{4}$/.test(journalId)) {
    return journalId;
  }

  // If format is XXXXXXXX (ISSN without dashes), format it
  if (/^\d{8}$/.test(journalId)) {
    return journalId.slice(0, 4) + '-' + journalId.slice(4);
  }

  // For slug format, we'd need a mapping (for now return null)
  // In the future, could query an API to resolve slug to ISSN
  return null;
};

const JournalProfile = () => {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ringkasan');

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        // Extract ISSN from journalId (format: issn or journal slug)
        // If journalId looks like ISSN (contains digits/dashes), use it directly
        // Otherwise treat it as a slug that needs to be resolved
        const issn = extractISSNFromId(journalId);

        if (!issn) {
          throw new Error('Format ISSN tidak valid');
        }

        const response = await fetch(`/api/journal_profile.php?issn=${encodeURIComponent(issn)}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Jurnal tidak ditemukan' : 'Gagal memuat jurnal');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setJournal(data);
        } else {
          setError(data.message || 'Gagal memuat jurnal');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching journal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [journalId]);

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

  if (loading) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat jurnal...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !journal) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Jurnal Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">
            {error || `Maaf, jurnal dengan ID ${journalId} tidak tersedia.`}
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
                className="w-full sm:w-48 h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => { e.target.src = '/assets/img/journal-default.svg'; }}
              />
            </div>

            {/* Journal Details */}
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{journal.name ?? 'Unknown Journal'}</h1>
              <p className="text-gray-600 mb-4">
                ISSN: {journal.issn ?? 'N/A'}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-gray-600">Penerbit: <span className="font-medium text-gray-900">{journal.publisher ?? 'Unknown'}</span></span>
                </div>
                {journal.website && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={journal.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Website: {journal.website}
                    </a>
                  </div>
                )}
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
                {journal.frequency && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">Frekuensi Terbit: <span className="font-medium text-gray-900">{journal.frequency}</span></span>
                  </div>
                )}
              </div>

              {journal.website && (
                <a
                  href={journal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <span>Kunjungi Website</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.totalArticles ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">Artikel</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{(journal.totalAuthors ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Penulis</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{(journal.totalCitations ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Sitasi</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{(journal.totalViews ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Views</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{(journal.citescore ?? journal.impactScore ?? 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">CiteScore</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{journal.sdgsCovered ?? 0}</p>
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

      {/* Tab: Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div>
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
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={journal.publicationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Artikel" />
                </BarChart>
              </ResponsiveContainer>
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
                  <Line type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Sitasi" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance & Top Articles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Top Articles Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Top Artikel Berdasarkan Sitasi</h3>
                <button onClick={() => setActiveTab('artikel')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  Lihat semua
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {journal.topArticles.slice(0, 3).map((art) => (
                  <Link key={art.id} to={`/doi/${art.doi}`} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors block">
                    <img
                      src={art.thumbnail}
                      alt={art.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
                    />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-indigo-700 transition-colors">{art.title}</h4>
                      <p className="text-xs text-gray-500 mb-2">{art.volume}</p>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                        {art.citations} Sitasi
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Artikel */}
      {activeTab === 'artikel' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Artikel Teratas ({journal.topArticles.length} ditampilkan)</h2>
            <div className="flex gap-3">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                <option>Semua Tahun</option>
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
                <option>Urutkan: Sitasi Terbanyak</option>
                <option>Urutkan: Terbaru</option>
                <option>Urutkan: Views Terbanyak</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            {journal.topArticles.map((art) => (
              <Link
                key={art.id}
                to={`/doi/${art.doi}`}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all block"
              >
                <div className="flex gap-5">
                  <img
                    src={art.thumbnail}
                    alt={art.title}
                    className="w-24 h-20 object-cover rounded-xl shrink-0"
                    onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 hover:text-indigo-700 transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{art.volume}</p>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                        {art.citations} Sitasi
                      </span>
                      <span className="text-sm text-gray-500">DOI: {art.doi}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/articles" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Lihat semua artikel di basis data
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Statistik */}
      {activeTab === 'statistik' && (
        <div>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Publication Trend */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Tren Publikasi per Tahun</h3>
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
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Artikel" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Citation Trend */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Tren Sitasi per Tahun</h3>
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
                  <Line type="monotone" dataKey="citations" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Sitasi" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Access Stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Statistik Akses Bulanan</h3>
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
                <Area type="monotone" dataKey="views" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Performa Jurnal</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Acceptance Rate', value: journal.acceptanceRate },
                { label: 'Waktu Review', value: journal.avgReviewTime },
                { label: 'Waktu Terbit', value: journal.avgPublishTime },
                { label: 'Sitasi/Artikel', value: journal.citationsPerArticle },
                { label: 'H-Index', value: journal.hIndex }
              ].map((metric, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-indigo-700 mb-1">{metric.value}</p>
                  <p className="text-xs text-gray-600">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: SDGs */}
      {activeTab === 'sdgs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SDG Distribution Pie */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Artikel per SDGs</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={journal.sdgDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
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
              <div className="flex-grow space-y-3">
                {journal.sdgDistribution.map((sdg, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sdg.color }} />
                    <span className="text-gray-700 text-sm flex-grow">{sdg.name}</span>
                    <span className="font-bold text-gray-900 text-sm">{sdg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SDG Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Persentase SDGs dalam Artikel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={journal.sdgDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={120} />
                <Tooltip />
                {journal.sdgDistribution.map((entry, index) => (
                  <Bar key={index} dataKey="value" fill={entry.color} radius={[0, 4, 4, 0]} name="Persentase" />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 text-center">Total {journal.sdgsCovered} SDGs tercakup dalam publikasi jurnal ini</p>
          </div>
        </div>
      )}

      {/* Tab: Informasi */}
      {activeTab === 'informasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indexing Databases */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Indeksasi & Database</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {journal.indexing.map((db, idx) => (
                <div key={idx} className="flex items-center justify-center p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                  <span className="font-semibold text-indigo-700">{db}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journal Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Informasi Jurnal</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">EISSN</span>
                <span className="font-semibold text-gray-900">{journal.eissn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">PISSN</span>
                <span className="font-semibold text-gray-900">{journal.pissn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Penerbit</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs">{journal.publisher}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Negara</span>
                <span className="font-semibold text-gray-900">{journal.country}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Bahasa</span>
                <span className="font-semibold text-gray-900">{journal.language}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Terbit Sejak</span>
                <span className="font-semibold text-gray-900">{journal.established}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Frekuensi</span>
                <span className="font-semibold text-gray-900">{journal.frequency}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Jumlah Indeksasi</span>
                <span className="font-semibold text-gray-900">{journal.indexing.length} database</span>
              </div>
            </div>

            {/* Scope */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Ruang Lingkup</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{journal.scope}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg mt-8">
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
