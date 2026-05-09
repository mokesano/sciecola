import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MyProfile = () => {
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [isSyncing, setIsSyncing] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Mock User Profile
  const [profile, setProfile] = useState({
    name: 'Dr. Andi Rahman',
    title: 'Associate Professor',
    affiliation: 'Universitas Indonesia',
    department: 'Department of Environmental Science',
    location: 'Depok, Indonesia',
    email: 'andi.rahman@ui.ac.id',
    orcid: '0000-0002-1825-0097',
    avatar: 'https://i.pravatar.cc/300?img=11',
    verified: true,
    stats: {
      publications: 42,
      citations: 1248,
      hIndex: 17,
      views: 98732,
      downloads: 12843,
      wis: 87.4
    }
  });

  // External IDs State
  const [externalIds, setExternalIds] = useState([
    { type: 'Scopus Author ID', key: 'scopusId', value: '57219929925', status: 'synced', lastSync: '2 jam lalu' },
    { type: 'ResearcherID', key: 'researcherId', value: 'A-1234-2019', status: 'synced', lastSync: '1 hari lalu' },
    { type: 'Loop Profile', key: 'loopId', value: '', status: 'not_set', lastSync: '-' },
    { type: 'SINTA ID', key: 'sintaId', value: '6023456', status: 'pending', lastSync: 'Menunggu crawl' },
    { type: 'Google Scholar ID', key: 'scholarId', value: 'abc123xyz', status: 'synced', lastSync: '5 jam lalu' }
  ]);

  // Handlers
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleSyncId = async (key) => {
    setIsSyncing(prev => ({ ...prev, [key]: true }));
    await new Promise(res => setTimeout(res, 1500)); // Simulate API call
    setExternalIds(prev => prev.map(id => 
      id.key === key ? { ...id, status: 'synced', lastSync: 'Baru saja' } : id
    ));
    setIsSyncing(prev => ({ ...prev, [key]: false }));
    showToast(`Data ${externalIds.find(id => id.key === key)?.type} berhasil disinkronisasi`);
  };

  const handleSyncAll = async () => {
    const idsToSync = externalIds.filter(id => id.value && id.status !== 'synced').map(id => id.key);
    if (idsToSync.length === 0) {
      showToast('Semua ID sudah tersinkronisasi', 'info');
      return;
    }
    idsToSync.forEach(key => setIsSyncing(prev => ({ ...prev, [key]: true })));
    await new Promise(res => setTimeout(res, 2000));
    setExternalIds(prev => prev.map(id => 
      idsToSync.includes(id.key) ? { ...id, status: 'synced', lastSync: 'Baru saja' } : id
    ));
    idsToSync.forEach(key => setIsSyncing(prev => ({ ...prev, [key]: false })));
    showToast(`${idsToSync.length} ID berhasil disinkronisasi`);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(res => setTimeout(res, 2500)); // Simulate WIS calculation
    setProfile(prev => ({ ...prev, stats: { ...prev.stats, wis: 89.2, citations: prev.stats.citations + 15 } }));
    setIsAnalyzing(false);
    showToast('Analisis selesai! Wizdam Impact Score diperbarui ke 89.2');
  };

  const handleEditId = (idObj) => {
    setEditingId(idObj.key);
    setEditValue(idObj.value);
  };

  const handleSaveId = () => {
    if (!editValue.trim()) {
      showToast('Nilai ID tidak boleh kosong', 'error');
      return;
    }
    setExternalIds(prev => prev.map(id => 
      id.key === editingId ? { ...id, value: editValue.trim(), status: 'pending', lastSync: 'Menunggu sinkronisasi' } : id
    ));
    setEditingId(null);
    setEditValue('');
    showToast('ID berhasil diperbarui. Klik Sinkronisasi untuk mengambil data.');
  };

  const getStatusBadge = (status) => {
    const styles = {
      synced: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      not_set: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return styles[status] || styles.not_set;
  };

  const getStatusLabel = (status) => {
    const labels = { synced: 'Tersinkron', pending: 'Menunggu', error: 'Gagal', not_set: 'Belum Diatur' };
    return labels[status] || status;
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Profil Saya</span>
      </nav>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center md:items-start gap-4 md:w-64">
            <div className="relative">
              <img src={profile.avatar} alt={profile.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg" />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-indigo-600 font-medium text-sm">{profile.title}</p>
              <p className="text-gray-500 text-sm mt-1">{profile.affiliation}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Link to={`/orcid/${profile.orcid}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Lihat Profil Publik
              </Link>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Edit Profil</button>
            </div>
          </div>

          {/* Details & Contact */}
          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div><p className="text-xs text-gray-500">Lokasi</p><p className="text-sm text-gray-900">{profile.location}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{profile.email}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                <div><p className="text-xs text-gray-500">ORCID</p><p className="text-sm text-indigo-600 font-mono">{profile.orcid}</p></div>
              </div>
            </div>
            
            {/* Stats Mini */}
            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Publikasi', value: profile.stats.publications },
                { label: 'Sitasi', value: profile.stats.citations.toLocaleString() },
                { label: 'h-Index', value: profile.stats.hIndex },
                { label: 'WIS Skor', value: profile.stats.wis, highlight: true }
              ].map((stat, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${stat.highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-lg font-bold ${stat.highlight ? 'text-indigo-700' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* External IDs Manager */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Manajemen ID Eksternal</h2>
            <p className="text-sm text-gray-600">Tambahkan ID akademik untuk sinkronisasi data dan crawling otomatis.</p>
          </div>
          <button 
            onClick={handleSyncAll}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${Object.values(isSyncing).some(v => v) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Sinkronisasi Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Platform</th>
                <th className="px-4 py-3 text-left font-medium">ID / Nilai</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Terakhir Sync</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {externalIds.map((id) => (
                <tr key={id.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{id.type}</td>
                  <td className="px-4 py-3">
                    {editingId === id.key ? (
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <span className={id.value ? 'font-mono text-gray-700' : 'text-gray-400 italic'}>{id.value || 'Belum diatur'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(id.status)}`}>
                      {getStatusLabel(id.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{id.lastSync}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === id.key ? (
                        <>
                          <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                          <button onClick={handleSaveId} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Simpan</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditId(id)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => id.value ? handleSyncId(id.key) : showToast('Isi nilai ID terlebih dahulu', 'error')}
                            disabled={!id.value || isSyncing[id.key]}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                            title="Sinkronisasi"
                          >
                            {isSyncing[id.key] ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Tabs & Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 pt-4 overflow-x-auto">
          <nav className="flex gap-6 min-w-max">
            {['ringkasan', 'publikasi', 'sdgs', 'kolaborasi'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'ringkasan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Ringkasan Profil</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Peneliti di bidang Environmental Science dengan fokus pada adaptasi perubahan iklim pesisir, manajemen sumber daya air, dan kebijakan lingkungan berkelanjutan. Memiliki pengalaman lebih dari 10 tahun dalam publikasi internasional bereputasi.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Climate Change', 'Coastal Ecology', 'Environmental Policy', 'Water Resources', 'SDG 13', 'SDG 6'].map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Aktivitas Terbaru</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3"><span className="text-gray-400">•</span> Artikel "Ecosystem-based adaptation..." disitasi 5 kali <span className="text-gray-500 ml-auto text-xs">2 jam lalu</span></li>
                  <li className="flex gap-3"><span className="text-gray-400">•</span> Profil Scopus tersinkronisasi otomatis <span className="text-gray-500 ml-auto text-xs">Kemarin</span></li>
                  <li className="flex gap-3"><span className="text-gray-400">•</span> Mengunggah dataset kualitas air Teluk Jakarta <span className="text-gray-500 ml-auto text-xs">3 hari lalu</span></li>
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'publikasi' && <div className="text-center py-12 text-gray-500">Preview publikasi akan dimuat dari database terintegrasi. <Link to="/my-articles" className="text-indigo-600 hover:underline">Kelola Artikel →</Link></div>}
          {activeTab === 'sdgs' && <div className="text-center py-12 text-gray-500">Visualisasi kontribusi SDG akan ditampilkan berdasarkan hasil crawling. <Link to="/dashboard" className="text-indigo-600 hover:underline">Lihat Statistik →</Link></div>}
          {activeTab === 'kolaborasi' && <div className="text-center py-12 text-gray-500">Jaringan kolaborasi dan co-author akan ditampilkan setelah sinkronisasi data. <Link to="/feed" className="text-indigo-600 hover:underline">Jelajahi Komunitas →</Link></div>}
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-m text-gray-600">Pastikan semua ID eksternal tersinkronisasi untuk hasil analisis yang akurat.</p>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md flex items-center gap-2 transition-all ${isAnalyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:shadow-lg'}`}
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Menganalisis & Menghitung WIS...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analisis & Hitung Wizdam Impact Score
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-fade-in ${toast.type === 'success' ? 'bg-gray-900 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={toast.type === 'success' ? 'M5 13l4 4L19 7' : toast.type === 'error' ? 'M6 18L18 6M6 6l12 12' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </main>
  );
};

export default MyProfile;