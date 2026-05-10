import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ResearchersList = () => {
  // State untuk filter dan pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSdg, setSelectedSdg] = useState('all');
  const [sortBy, setSortBy] = useState('citations');
  const [page, setPage] = useState(1);

  // API State
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Fetch data from API
  useEffect(() => {
    const fetchResearchers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page,
          limit: 20,
          sort: sortBy === 'relevance' ? 'citations' : sortBy,
          search: searchQuery,
          sdg: selectedSdg === 'all' ? 0 : selectedSdg,
        });

        const response = await fetch(`/api/researchers.php?${params}`);
        if (!response.ok) throw new Error('Failed to fetch researchers');

        const data = await response.json();
        if (data.status === 'success') {
          const transformedResearchers = data.data.map(researcher => ({
            id: researcher.id,
            name: researcher.name,
            orcid: researcher.orcid,
            avatar: researcher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(researcher.name)}&background=random&size=128`,
            title: 'Researcher',
            univ: researcher.affiliation || '',
            country: 'Indonesia',
            department: '',
            email: '',
            citations: researcher.citations || 0,
            hIndex: researcher.hindex || 0,
            publications: researcher.publications || 0,
            collaborators: 0,
            views: 0,
            researchInterests: [],
            sdgFocus: researcher.focus_sdgs || [],
            topKeywords: [],
            recentPublications: [],
            topCollaborators: [],
            institutions: [],
            yearsActive: '',
            firstPublication: 0,
            latestPublication: 0
          }));

          setResearchers(transformedResearchers);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total || 0);
        }
      } catch (err) {
        setError(err.message);
        setResearchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResearchers();
  }, [page, sortBy, searchQuery, selectedSdg]);

  // Hardcoded sample list for countries and SDGs extraction (temporary, until we populate database)
  const mockResearchers = [
    {
      id: 1,
      name: "Dr. Andi Rahman",
      orcid: "0000-0002-1825-0097",
      country: "Indonesia",
      sdgFocus: [13, 14, 15],
    },
    {
      id: 2,
      name: "Prof. Budi Santoso",
      orcid: "0000-0001-5543-2210",
      country: "Indonesia",
      sdgFocus: [11, 9, 13],
    },
    {
      id: 3,
      name: "Dr. Siti Nurhaliza",
      orcid: "0000-0003-9981-4456",
      country: "Indonesia",
      sdgFocus: [7, 13, 1],
    },
    {
      id: 4,
      name: "Dr. Maria Garcia",
      orcid: "0000-0004-1122-3344",
      country: "Philippines",
      sdgFocus: [14, 15, 2],
    },
  ];

  // SDG Mapping untuk tampilan visual
  const sdgMap = {
    1: { name: "No Poverty", color: "bg-red-500" },
    2: { name: "Zero Hunger", color: "bg-orange-500" },
    3: { name: "Good Health", color: "bg-green-500" },
    6: { name: "Clean Water", color: "bg-blue-400" },
    7: { name: "Clean Energy", color: "bg-yellow-500" },
    9: { name: "Industry & Innovation", color: "bg-orange-600" },
    11: { name: "Sustainable Cities", color: "bg-orange-500" },
    12: { name: "Responsible Consumption", color: "bg-yellow-600" },
    13: { name: "Climate Action", color: "bg-green-600" },
    14: { name: "Life Below Water", color: "bg-blue-600" },
    15: { name: "Life on Land", color: "bg-green-500" }
  };

  // Extract unique countries from mock data for filter
  const countries = ['all', ...new Set(mockResearchers.map(r => r.country))];

  // Extract unique SDGs from mock data for filter
  const sdgs = ['all', ...new Set(mockResearchers.flatMap(r => r.sdgFocus)).sort((a, b) => a - b)];

  // Helper: Format angka besar
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600">Beranda</Link>
        <span>›</span>
        <span className="text-gray-900">Database Peneliti</span>
      </div>
      
      {/* Header Halaman */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Database Peneliti</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1 max-w-2xl">Jelajahi profil peneliti dan kontribusi mereka terhadap target SDGs.</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-grow relative">
            <input 
              type="text" 
              placeholder="Cari nama, institusi, atau topik penelitian..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? 'Semua Negara' : country}
                </option>
              ))}
            </select>
            
            <select 
              value={selectedSdg}
              onChange={(e) => setSelectedSdg(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              {sdgs.map(sdg => (
                <option key={sdg} value={sdg}>
                  {sdg === 'all' ? 'Semua SDGs' : `SDG ${sdg}`}
                </option>
              ))}
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
              <option value="relevance">Relevansi</option>
              <option value="citations">Sitasi Tertinggi</option>
              <option value="hIndex">H-Index Tertinggi</option>
              <option value="publications">Publikasi Terbanyak</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
          <span className="text-sm text-gray-500">Filter aktif:</span>
          {selectedCountry !== 'all' && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              {selectedCountry}
              <button onClick={() => setSelectedCountry('all')} className="hover:text-indigo-900">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {selectedSdg !== 'all' && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              SDG {selectedSdg}
              <button onClick={() => setSelectedSdg('all')} className="hover:text-indigo-900">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {(selectedCountry !== 'all' || selectedSdg !== 'all' || searchQuery) && (
            <button 
              onClick={() => {setSelectedCountry('all'); setSelectedSdg('all'); setSearchQuery('');}}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2"
            >
              Reset semua
            </button>
          )}
        </div>
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
          <p className="text-red-700 font-medium">Error loading researchers: {error}</p>
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
        <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          Menampilkan <span className="font-bold text-gray-900">{researchers.length}</span> dari <span className="font-bold text-gray-900">{totalResults}</span> peneliti
        </p>
        <div className="flex gap-2">
          <button className="p-2 border border-gray-200 rounded-lg bg-indigo-50 text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
        </div>

        {/* Grid Daftar Peneliti */}
        {researchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchers.map((pro) => (
          <Link 
            key={pro.orcid} 
            to={`/orcid/${pro.orcid}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col"
          >
            {/* Header: Avatar + Name + Title */}
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={pro.avatar} 
                alt={pro.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random&size=128`; }}
              />
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-lg leading-tight mb-0.5 truncate">
                  {pro.name}
                </h3>
                <p className="text-sm text-indigo-600 font-medium">{pro.title}</p>
                <p className="text-xs text-gray-500 truncate">{pro.univ}</p>
              </div>
            </div>

            {/* SDG Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {pro.sdgFocus.map(sdg => (
                <span 
                  key={sdg} 
                  className={`px-2 py-0.5 ${sdgMap[sdg]?.color || 'bg-gray-500'} text-white rounded text-[10px] font-bold`}
                  title={sdgMap[sdg]?.name}
                >
                  {sdg}
                </span>
              ))}
            </div>

            {/* Research Interests (Truncated) */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Fokus Penelitian</p>
              <div className="flex flex-wrap gap-1">
                {pro.researchInterests.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px]">
                    {interest}
                  </span>
                ))}
                {pro.researchInterests.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-[10px]">+{pro.researchInterests.length - 3}</span>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{formatNumber(pro.citations)}</p>
                <p className="text-[10px] text-gray-500 uppercase">Sitasi</p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-lg font-bold text-gray-900">{pro.hIndex}</p>
                <p className="text-[10px] text-gray-500 uppercase">H-Index</p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-lg font-bold text-gray-900">{pro.publications}</p>
                <p className="text-[10px] text-gray-500 uppercase">Publikasi</p>
              </div>
            </div>

            {/* Footer: Country + Arrow */}
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{pro.country}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            </Link>
            ))}
          </div>
        ) : !loading && !error && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak ada peneliti ditemukan</h3>
            <p className="text-gray-500 text-sm mb-4">Coba ubah filter atau kata kunci pencarian Anda.</p>
            <button
              onClick={() => {setSearchQuery(''); setSelectedCountry('all'); setSelectedSdg('all');}}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
      )}
      </div>

      {/* Pagination */}
      {!loading && !error && researchers.length > 0 && (
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

export default ResearchersList;