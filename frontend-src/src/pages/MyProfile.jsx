import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ringkasan');
  const [isSyncing, setIsSyncing] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [externalIds, setExternalIds] = useState([
    { type: 'Scopus Author ID', key: 'scopusId',    value: '', status: 'not_set', lastSync: '-' },
    { type: 'ResearcherID',     key: 'researcherId', value: '', status: 'not_set', lastSync: '-' },
    { type: 'Loop Profile',     key: 'loopId',       value: '', status: 'not_set', lastSync: '-' },
    { type: 'SINTA ID',         key: 'sintaId',      value: '', status: 'not_set', lastSync: '-' },
    { type: 'Google Scholar ID', key: 'scholarId',   value: '', status: 'not_set', lastSync: '-' },
  ]);

  // Fetch real profile via /api/my_profile.php
  useEffect(() => {
    if (!user?.orcid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/my_profile.php?orcid=${encodeURIComponent(user.orcid)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success' && data.profile) {
          const p = data.profile;
          setProfile(p);

          // Pre-populate external IDs from ORCID profile
          setExternalIds(prev => prev.map(id => {
            if (id.key === 'scopusId' && p.scopusId) {
              return { ...id, value: p.scopusId, status: 'synced', lastSync: 'Via ORCID' };
            }
            if (id.key === 'researcherId' && p.researcherId) {
              return { ...id, value: p.researcherId, status: 'synced', lastSync: 'Via ORCID' };
            }
            return id;
          }));

          // Update auth context with enriched name
          if (p.name && (!user.name || user.name !== p.name)) {
            updateUser({ name: p.name, avatar: p.avatar });
          }
        } else {
          setError(data.message || 'Profil tidak ditemukan');
        }
      })
      .catch(err => setError('Gagal memuat profil: ' + err.message))
      .finally(() => setLoading(false));
  }, [user?.orcid]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleSyncId = async (key) => {
    setIsSyncing(prev => ({ ...prev, [key]: true }));
    // Enqueue to crawl_queue for background processing
    try {
      await fetch('/api/cache_handler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', type: 'orcid', limit: 1 }),
      });
      setExternalIds(prev => prev.map(id =>
        id.key === key ? { ...id, status: 'synced', lastSync: 'Baru saja' } : id
      ));
      showToast(`Data ${externalIds.find(id => id.key === key)?.type} berhasil disinkronisasi`);
    } catch {
      showToast('Gagal sinkronisasi, coba lagi', 'error');
    } finally {
      setIsSyncing(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSyncAll = async () => {
    const idsToSync = externalIds.filter(id => id.value && id.status !== 'synced').map(id => id.key);
    if (idsToSync.length === 0) { showToast('Semua ID sudah tersinkronisasi', 'info'); return; }
    idsToSync.forEach(key => setIsSyncing(prev => ({ ...prev, [key]: true })));
    await Promise.all(idsToSync.map(key => handleSyncId(key)));
    showToast(`${idsToSync.length} ID berhasil disinkronisasi`);
  };

  const handleAnalyze = async () => {
    if (!user?.orcid) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/my_profile.php?orcid=${encodeURIComponent(user.orcid)}&action=get`);
      const data = await res.json();
      if (data.status === 'success') {
        setProfile(data.profile);
        showToast('Analisis selesai! Data profil diperbarui dari ORCID.');
      }
    } catch {
      showToast('Gagal menganalisis, coba lagi', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditId = (idObj) => { setEditingId(idObj.key); setEditValue(idObj.value); };
  const handleSaveId = () => {
    if (!editValue.trim()) { showToast('Nilai ID tidak boleh kosong', 'error'); return; }
    setExternalIds(prev => prev.map(id =>
      id.key === editingId ? { ...id, value: editValue.trim(), status: 'pending', lastSync: 'Menunggu sinkronisasi' } : id
    ));
    setEditingId(null); setEditValue('');
    showToast('ID berhasil diperbarui. Klik Sinkronisasi untuk mengambil data.');
  };

  const getStatusBadge = (s) => ({
    synced: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    not_set: 'bg-gray-100 text-gray-600 border-gray-200',
  }[s] ?? 'bg-gray-100 text-gray-600 border-gray-200');

  const getStatusLabel = (s) => ({
    synced: 'Tersinkron', pending: 'Menunggu', error: 'Gagal', not_set: 'Belum Diatur',
  }[s] ?? s);

  // ── No ORCID linked yet ──────────────────────────────────────────────────────

  if (!user?.orcid && !loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ORCID Belum Terhubung</h2>
          <p className="text-gray-600 mb-6">Hubungkan ORCID Anda untuk menampilkan profil riset, publikasi, dan statistik dampak.</p>
          <Link to="/settings" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Hubungkan ORCID
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat profil dari ORCID…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error || 'Profil tidak dapat dimuat'}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  const stats = {
    publications: profile.publications ?? 0,
    citations: profile.citations ?? 0,
    hIndex: profile.hIndex ?? 0,
    views: profile.views ?? 0,
    downloads: profile.downloads ?? 0,
    wis: profile.wis ?? ((profile.hIndex ?? 0) * 4.5 + Math.min(30, (profile.citations ?? 0) / 50)).toFixed(1),
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Profil Saya</span>
      </nav>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start gap-4 md:w-64">
            <div className="relative">
              <img
                src={profile.avatar ?? '/assets/img/researcher-default.svg'}
                alt={profile.name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                onError={(e) => { e.target.src = '/assets/img/researcher-default.svg'; }}
              />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-indigo-600 font-medium text-sm">{profile.title}</p>
              <p className="text-gray-500 text-sm mt-1">{profile.univ}</p>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Link to={`/orcid/${user.orcid}`} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Lihat Profil Publik
              </Link>
              <Link to="/settings" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                Edit Profil
              </Link>
            </div>
          </div>

          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-3">
              {profile.location && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <div><p className="text-xs text-gray-500">Lokasi</p><p className="text-sm text-gray-900">{profile.location}</p></div>
                </div>
              )}
              {(profile.email ?? user?.email) && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{profile.email ?? user.email}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <div><p className="text-xs text-gray-500">ORCID</p><p className="text-sm text-indigo-600 font-mono">{user.orcid}</p></div>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Publikasi', value: stats.publications },
                { label: 'Sitasi', value: stats.citations.toLocaleString() },
                { label: 'h-Index', value: stats.hIndex },
                { label: 'WIS Skor', value: stats.wis, highlight: true },
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
            <p className="text-sm text-gray-600">ID yang telah tersinkronisasi dari ORCID atau diatur manual.</p>
          </div>
          <button onClick={handleSyncAll}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
            <svg className={`w-4 h-4 ${Object.values(isSyncing).some(v => v) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
                      <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-full max-w-xs" autoFocus />
                    ) : (
                      <span className={id.value ? 'font-mono text-gray-700' : 'text-gray-400 italic'}>
                        {id.value || 'Belum diatur'}
                      </span>
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
                          <button onClick={() => handleEditId(id)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => id.value ? handleSyncId(id.key) : showToast('Isi nilai ID terlebih dahulu', 'error')}
                            disabled={!id.value || isSyncing[id.key]}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-40" title="Sinkronisasi">
                            {isSyncing[id.key]
                              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            }
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 pt-4 overflow-x-auto">
          <nav className="flex gap-6 min-w-max">
            {['ringkasan', 'publikasi', 'sdgs', 'kolaborasi'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'ringkasan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Ringkasan Profil</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.bio || `Peneliti di bidang ${profile.department || 'riset'} dari ${profile.univ || 'institusi'}. Aktif sejak ${profile.yearsActive || 'N/A'}.`}
                </p>
                {(profile.researchInterests?.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.researchInterests.slice(0, 8).map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">SDG Fokus</h3>
                {profile.sdgFocus?.length > 0 ? (
                  <div className="space-y-2">
                    {profile.sdgFocus.slice(0, 5).map(s => (
                      <div key={s.sdg} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ background: s.color }}>SDG {s.sdg}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${s.percentage}%`, background: s.color }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada data SDG. Analisis diperlukan.</p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'publikasi' && (
            <div className="text-center py-12 text-gray-500">
              Preview publikasi dimuat dari ORCID. <Link to="/my-articles" className="text-indigo-600 hover:underline">Kelola Artikel →</Link>
            </div>
          )}
          {activeTab === 'sdgs' && (
            <div className="text-center py-12 text-gray-500">
              Visualisasi SDG berdasarkan hasil analisis ORCID. <Link to="/my-statistics" className="text-indigo-600 hover:underline">Lihat Statistik →</Link>
            </div>
          )}
          {activeTab === 'kolaborasi' && (
            <div>
              {profile.collaborators?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.collaborators.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <img src={c.avatar ?? '/assets/img/researcher-default.svg'} alt={c.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={e => { e.target.src = '/assets/img/researcher-default.svg'; }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        {c.orcid ? (
                          <Link to={`/orcid/${c.orcid}`} className="text-xs text-indigo-600 hover:underline">{c.orcid}</Link>
                        ) : (
                          <p className="text-xs text-gray-500">{c.collaborations} kolaborasi</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Data kolaborator belum tersedia. Jalankan analisis untuk memuat data.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            Data dimuat langsung dari ORCID API melalui cache-first system.
            {profile._source && <span className="ml-2 text-xs text-indigo-500">Sumber: {profile._source}</span>}
          </p>
          <button onClick={handleAnalyze} disabled={isAnalyzing}
            className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md flex items-center gap-2 transition-all ${
              isAnalyzing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800'
            }`}>
            {isAnalyzing ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menganalisis dari ORCID...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Refresh & Hitung Wizdam Impact Score
              </>
            )}
          </button>
        </div>
      </div>

      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 ${
          toast.type === 'success' ? 'bg-gray-900 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={toast.type === 'success' ? 'M5 13l4 4L19 7' : toast.type === 'error' ? 'M6 18L18 6M6 6l12 12' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </main>
  );
};

export default MyProfile;
