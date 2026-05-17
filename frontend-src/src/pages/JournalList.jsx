import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const JournalList = () => {
  // State untuk filter dan pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuartile, setSelectedQuartile] = useState('all');
  const [sortBy, setSortBy] = useState('citescore');
  const [page, setPage] = useState(1);

  // API State
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Fetch data from API
  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page,
          limit: 20,
          sort: sortBy,
          search: searchQuery,
          sdg: 0,
        });

        const response = await fetch(`/api/journals.php?${params}`);
        if (!response.ok) throw new Error('Failed to fetch journals');

        const data = await response.json();
        if (data.status === 'success') {
          const sourceList = Array.isArray(data.data) ? data.data : [];
          const transformedJournals = sourceList.map(journal => ({
            id: journal.id,
            name: journal.name,
            issn: journal.issn || '',
            publisher: journal.publisher || '',
            quartile: journal.quartile || 'N/A',
            sjr: journal.sjr?.toFixed(2) || '0.00',
            hIndex: journal.total_articles?.toString() || '0',
            citescore: journal.citescore || 0,
            sdgFocus: journal.focus_sdgs || [],
          }));

          setJournals(transformedJournals);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total || 0);
        } else {
          throw new Error(data.message || 'Failed to load journals');
        }
      } catch (err) {
        setError(err.message);
        setJournals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [page, sortBy, searchQuery]);

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900">Data Jurnal</span>
      </div>

      {/* Header Halaman */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Data Jurnal</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">Temukan jurnal bereputasi berdasarkan kesesuaian target SDGs.</p>
      </div>

      {/* Filter Bar Sederhana (Mengikuti desain ResearchExplorer Anda) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Cari nama jurnal atau ISSN..."
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <select
          value={sortBy}
          onChange={(e) => {setSortBy(e.target.value); setPage(1);}}
          className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium text-gray-600 outline-none"
        >
          <option value="citescore">CiteScore (Tinggi)</option>
          <option value="quartile">Quartile (Q1→Q4)</option>
          <option value="name">Nama (A-Z)</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <p className="text-red-700 font-medium">Error loading journals: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
      <div className="mb-6 text-sm text-gray-600">
        Menampilkan <span className="font-bold text-gray-900">{journals.length}</span> dari <span className="font-bold text-gray-900">{totalResults}</span> jurnal
      </div>
      )}

      {/* Grid Daftar Jurnal */}
      {!loading && !error && journals.length > 0 && (
      <div className="grid grid-cols-1 gap-6">
        {journals.map((journal) => (
          <Link 
            key={journal.id} 
            to={`/journals/${journal.id}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex gap-5 items-start">
              {/* Ikon/Logo Jurnal Dummy */}
              <div className="w-16 h-20 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-400 border border-indigo-100 shrink-0">
                <span className="text-[10px] font-bold">JOURNAL</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-lg transition-colors leading-tight mb-1">
                  {journal.name}
                </h3>
                <p className="text-gray-500 text-sm mb-3">ISSN: {journal.issn} • {journal.publisher}</p>
                <div className="flex gap-2">
                  {journal.sdgFocus.map(sdg => {
                    const sdgColors = {
                      1: 'bg-red-500',
                      2: 'bg-orange-500',
                      3: 'bg-green-500',
                      6: 'bg-blue-400',
                      7: 'bg-yellow-500',
                      9: 'bg-orange-600',
                      11: 'bg-orange-500',
                      12: 'bg-yellow-600',
                      13: 'bg-green-600',
                      14: 'bg-blue-600',
                      15: 'bg-green-500'
                    };
                    return (
                      <span key={sdg} className={`px-2 py-0.5 ${sdgColors[sdg] || 'bg-gray-500'} text-white rounded text-[10px] font-bold`}>
                        SDG {sdg}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metrik Jurnal (Samping Kanan) */}
            <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-50">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quartile</p>
                <span className="text-lg font-black text-emerald-600">{journal.quartile}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">SJR</p>
                <span className="text-lg font-black text-gray-900">{journal.sjr}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">H-Index</p>
                <span className="text-lg font-black text-gray-900">{journal.hIndex}</span>
              </div>
              <div className="ml-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && !error && journals.length === 0 && (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak ada jurnal ditemukan</h3>
        <p className="text-gray-500 text-sm mb-4">Coba ubah kata kunci pencarian Anda.</p>
        <button
          onClick={() => {setSearchQuery(''); setPage(1);}}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Reset Pencarian
        </button>
      </div>
      )}

      {/* Pagination */}
      {!loading && !error && journals.length > 0 && (
      <div className="mt-10 flex justify-center items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-4 py-2 rounded-lg font-medium ${
                page === pageNum
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        {totalPages > 5 && (
          <>
            <span className="px-2 text-gray-400">...</span>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Selanjutnya
        </button>
      </div>
      )}
    </main>
  );
};

export default JournalList;