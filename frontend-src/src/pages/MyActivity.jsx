import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MyActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});

  const [activeFilter, setActiveFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!user?.orcid) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/my_activity.php?orcid=${encodeURIComponent(user.orcid)}&range=${dateRange}&type=${activeFilter}&page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setActivities(data.activities ?? []);
          setSummary(data.summary ?? {});
        } else {
          setError(data.message || 'Gagal memuat aktivitas');
        }
      })
      .catch(err => setError('Gagal memuat: ' + err.message))
      .finally(() => setLoading(false));
  }, [user?.orcid, dateRange, activeFilter, page]);

  const getIcon = (type) => {
    const icons = {
      viewed: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      saved: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
      analyzed: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    };
    return icons[type] || icons.viewed;
  };

  const getColor = (type) => {
    const colors = {
      viewed: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      saved: 'text-amber-600 bg-amber-50 border-amber-200',
      analyzed: 'text-blue-600 bg-blue-50 border-blue-200',
      shared: 'text-pink-600 bg-pink-50 border-pink-200',
    };
    return colors[type] || colors.viewed;
  };

  if (!user?.orcid && !loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ORCID Belum Terhubung</h2>
          <p className="text-gray-600 mb-6">Hubungkan ORCID Anda untuk melihat riwayat aktivitas.</p>
          <Link to="/settings" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Hubungkan ORCID
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Aktivitas Saya</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aktivitas Saya</h1>
        <p className="text-gray-600 text-sm mt-1">Riwayat interaksi dengan artikel, koleksi, dan analisis riset.</p>
      </div>

      {/* Summary Stats */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { key: 'viewed', label: 'Dilihat', color: 'indigo' },
            { key: 'saved', label: 'Disimpan', color: 'amber' },
            { key: 'analyzed', label: 'Dianalisis', color: 'blue' },
            { key: 'shared', label: 'Dibagikan', color: 'pink' },
            { key: 'downloaded', label: 'Diunduh', color: 'green' },
          ].map(({ key, label, color }) => (
            <div key={key} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold text-${color}-700`}>{summary[key] ?? 0}</p>
              <p className={`text-xs text-${color}-600`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <select value={dateRange} onChange={e => { setDateRange(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="today">Hari Ini</option>
          <option value="7days">7 Hari</option>
          <option value="30days">30 Hari</option>
          <option value="all">Semua</option>
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="all">Semua Tipe</option>
          <option value="viewed">Dilihat</option>
          <option value="saved">Disimpan</option>
          <option value="shared">Dibagikan</option>
          <option value="analysis">Analisis</option>
        </select>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-600">Memuat aktivitas…</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>Tidak ada aktivitas untuk periode ini.</p>
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className={`border rounded-lg p-4 ${getColor(act.type)}`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getIcon(act.type)} />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{act.title}</p>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">{act.target}</p>
                  {act.detail && <p className="text-xs text-gray-600 mt-1">{act.detail}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(act.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && activities.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">‹</button>
          <span className="px-3 py-1.5 text-sm text-gray-700">{page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={activities.length < limit}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">›</button>
        </div>
      )}
    </main>
  );
};

export default MyActivity;
