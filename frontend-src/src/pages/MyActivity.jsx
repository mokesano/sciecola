import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const MyActivity = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [expandedId, setExpandedId] = useState(null);

  // Mock Activity Data
  const activities = [
    { id: 1, type: 'viewed', category: 'article', title: 'Anda melihat artikel', target: '"Climate Change Adaptation in Coastal Communities"', detail: 'Journal of Environmental Science, 2024', time: '14:32', date: 'Hari Ini', icon: 'eye', metadata: { views: 652, sdgs: [13, 11] } },
    { id: 2, type: 'saved', category: 'collection', title: 'Anda menyimpan artikel ke koleksi', target: '"Mangrove Ecosystem as Climate Buffer"', detail: 'Koleksi: Adaptation Research', time: '13:45', date: 'Hari Ini', icon: 'bookmark', metadata: { collectionId: 'col_3', itemCount: 12 } },
    { id: 3, type: 'downloaded', category: 'dataset', title: 'Anda mengunduh dataset', target: '"Data_Kualitas_Air_Teluk_Jakarta_2024.xlsx"', detail: '2.4 MB • Dari: Kementerian LHK', time: '11:20', date: 'Hari Ini', icon: 'download', metadata: { size: '2.4 MB', format: 'xlsx' } },
    { id: 4, type: 'searched', category: 'search', title: 'Anda melakukan pencarian', target: '"climate adaptation coastal Indonesia"', detail: '3 hasil ditemukan • Filter: Tahun 2024', time: '09:15', date: 'Hari Ini', icon: 'search', metadata: { results: 3, duration: '0.4s' } },
    { id: 5, type: 'analyzed', category: 'analysis', title: 'Anda menganalisis profil ORCID', target: '0000-0002-1825-0097 (Dr. Andi Rahman)', detail: '42 artikel diklasifikasikan • Skor WIS: 87.4', time: '16:40', date: 'Kemarin', icon: 'chart', metadata: { articles: 42, wis: 87.4 } },
    { id: 6, type: 'shared', category: 'article', title: 'Anda membagikan artikel', target: '"Blue Carbon and Coastal Adaptation Strategies"', detail: 'Via: LinkedIn • 15 klik tautan', time: '15:10', date: 'Kemarin', icon: 'share', metadata: { platform: 'LinkedIn', clicks: 15 } },
    { id: 7, type: 'commented', category: 'article', title: 'Anda mengomentari artikel', target: '"Community-Based Adaptation to Sea Level Rise"', detail: 'Komentar: "Sangat relevan dengan studi kasus pesisir utara Jawa..."', time: '14:05', date: 'Kemarin', icon: 'comment', metadata: { commentId: 'cmt_892', likes: 3 } },
    { id: 8, type: 'exported', category: 'report', title: 'Anda mengekspor laporan statistik', target: '"Statistik_Performa_November_2024.pdf"', detail: 'Format PDF • Halaman: 12', time: '10:30', date: '20 Nov 2024', icon: 'file', metadata: { format: 'PDF', pages: 12 } },
    { id: 9, type: 'updated', category: 'profile', title: 'Anda memperbarui profil riset', target: 'Menambahkan 3 minat riset baru', detail: 'Climate Resilience, Marine Policy, SDG 14', time: '08:45', date: '20 Nov 2024', icon: 'edit', metadata: { added: 3, total: 12 } },
    { id: 10, type: 'collaborated', category: 'project', title: 'Anda bergabung dalam proyek kolaborasi', target: '"Green Energy Policy 2024"', detail: 'Diundang oleh: Dr. Siti Nurhaliza (BRIN)', time: '14:20', date: '19 Nov 2024', icon: 'users', metadata: { members: 8, role: 'Co-Researcher' } },
  ];

  // Filter Logic
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Date Filter
    const now = new Date();
    result = result.filter(act => {
      if (dateRange === 'today') return act.date === 'Hari Ini';
      if (dateRange === '7days') return ['Hari Ini', 'Kemarin', '20 Nov 2024', '19 Nov 2024'].includes(act.date);
      if (dateRange === '30days') return true; // Simplified for mock
      return true;
    });

    // Type Filter
    if (activeFilter === 'viewed') result = result.filter(a => a.type === 'viewed');
    if (activeFilter === 'saved') result = result.filter(a => a.type === 'saved' || a.type === 'downloaded');
    if (activeFilter === 'shared') result = result.filter(a => a.type === 'shared' || a.type === 'commented');
    if (activeFilter === 'analysis') result = result.filter(a => a.type === 'analyzed' || a.type === 'exported');

    return result;
  }, [activeFilter, dateRange]);

  // Group by Date
  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(act => {
      if (!groups[act.date]) groups[act.date] = [];
      groups[act.date].push(act);
    });
    return groups;
  }, [filteredActivities]);

  // Icon Component
  const ActivityIcon = ({ type }) => {
    const icons = {
      eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
      download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    };
    return icons[type] || icons.eye;
  };

  // Color by Type
  const getTypeColors = (type) => {
    const colors = {
      viewed: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      saved: 'bg-amber-50 text-amber-600 border-amber-200',
      downloaded: 'bg-green-50 text-green-600 border-green-200',
      searched: 'bg-purple-50 text-purple-600 border-purple-200',
      analyzed: 'bg-blue-50 text-blue-600 border-blue-200',
      shared: 'bg-pink-50 text-pink-600 border-pink-200',
      commented: 'bg-teal-50 text-teal-600 border-teal-200',
      exported: 'bg-orange-50 text-orange-600 border-orange-200',
      updated: 'bg-gray-100 text-gray-600 border-gray-200',
      collaborated: 'bg-violet-50 text-violet-600 border-violet-200'
    };
    return colors[type] || colors.viewed;
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Aktivitas Saya</span>
      </nav>

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aktivitas Saya</h1>
          <p className="text-gray-600 mt-1">Riwayat lengkap interaksi Anda dengan platform Wizdam.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
          <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Ekspor Riwayat
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Aktivitas', value: activities.length, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Artikel Dilihat', value: activities.filter(a => a.type === 'viewed').length, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'bg-purple-50 text-purple-600' },
          { label: 'Analisis Dibuat', value: activities.filter(a => a.type === 'analyzed').length, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-green-50 text-green-600' },
          { label: 'Kolaborasi Aktif', value: activities.filter(a => a.type === 'collaborated').length, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-amber-50 text-amber-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {[
          { id: 'all', label: 'Semua', count: filteredActivities.length },
          { id: 'viewed', label: 'Dilihat', count: activities.filter(a => a.type === 'viewed').length },
          { id: 'saved', label: 'Disimpan', count: activities.filter(a => a.type === 'saved' || a.type === 'downloaded').length },
          { id: 'shared', label: 'Dibagikan', count: activities.filter(a => a.type === 'shared' || a.type === 'commented').length },
          { id: 'analysis', label: 'Analisis', count: activities.filter(a => a.type === 'analyzed' || a.type === 'exported').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeFilter === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeFilter === tab.id ? 'bg-indigo-500' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {Object.keys(groupedActivities).length > 0 ? (
        <div className="relative">
          {/* Timeline Line - Fixed Position */}
          <div className="absolute left-5 sm:left-7 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>

          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date} className="mb-8 last:mb-0">
              {/* Date Header */}
              <div className="relative flex items-center gap-4 mb-6">
                {/* Header Dot */}
                <div className="absolute left-5 sm:left-7 -translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-sm z-10"></div>
                <h3 className="ml-8 sm:ml-10 text-sm font-bold text-gray-900 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full border border-gray-200">{date}</h3>
                <div className="flex-grow h-px bg-gray-200 ml-2"></div>
              </div>

              {/* Items */}
              <div className="space-y-6">
                {items.map((act) => (
                  /* Wrapper Item */
                  <div key={act.id} className="relative pl-12 sm:pl-16">
                    
                    {/* Activity Dot - Centered Vertically & Horizontally */}
                    <div 
                      className={`absolute left-5 sm:left-7 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-200 ${
                        expandedId === act.id 
                          ? 'bg-indigo-600 w-4 h-4 ring-4 ring-indigo-100' 
                          : 'bg-gray-300 w-3 h-3 hover:bg-indigo-400'
                      }`}
                    ></div>

                    {/* Card Content */}
                    <div 
                      className={`bg-white rounded-xl border shadow-sm p-4 transition-all duration-200 ${
                        expandedId === act.id 
                          ? 'border-indigo-300 ring-2 ring-indigo-100 shadow-md' 
                          : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                      }`}
                      onClick={() => setExpandedId(expandedId === act.id ? null : act.id)}
                    >
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getTypeColors(act.type)}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ActivityIcon(act.type)} />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900">
                                <span className="font-semibold">{act.title}</span>{' '}
                                <span className="text-gray-700">{act.target}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{act.detail}</p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{act.time}</span>
                          </div>

                          {/* Expanded Details */}
                          {expandedId === act.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                              {Object.entries(act.metadata).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {Array.isArray(value) ? value.join(', ') : value}
                                  </p>
                                </div>
                              ))}
                              <div className="flex gap-2 sm:col-span-3">
                                <Link 
                                  to={act.metadata.link || '#'} 
                                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors text-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Lihat Detail
                                </Link>
                                <button 
                                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Hapus dari Riwayat
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada aktivitas ditemukan</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Coba ubah filter atau rentang tanggal untuk melihat riwayat aktivitas Anda.
          </p>
          <button 
            onClick={() => { setActiveFilter('all'); setDateRange('all'); }}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-sm">
            Muat Aktivitas Sebelumnya
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </main>
  );
};

export default MyActivity;