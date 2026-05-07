import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ArticleList = () => {
  // Simulasi data artikel
  const [articles] = useState([
    {
      id: "10.1234/jess.2024.1002",
      title: "Climate Change Adaptation in Coastal Communities: A Systematic Review",
      authors: ["Andi Rahman", "Budi Santoso", "Siti Nurhaliza"],
      journal: "Journal of Environmental Science and Sustainability",
      volume: "Vol. 10 No. 2 (2024)",
      publishedDate: "15 Mei 2024",
      citations: 652,
      views: 98732,
      downloads: 12843,
      sdgFocus: [13, 11, 15],
      articleType: "Review Article",
      openAccess: true,
      thumbnail: "https://via.placeholder.com/300x200/1e40af/ffffff?text=Article+1"
    },
    {
      id: "10.1234/jess.2024.1003",
      title: "Sustainable Urban Transport Systems in Indonesia: Challenges and Opportunities",
      authors: ["Dewi Lestari", "Ahmad Fauzi"],
      journal: "Journal of Environmental Science and Sustainability",
      volume: "Vol. 10 No. 1 (2024)",
      publishedDate: "10 Maret 2024",
      citations: 428,
      views: 76543,
      downloads: 9876,
      sdgFocus: [11, 13, 9],
      articleType: "Research Article",
      openAccess: true,
      thumbnail: "https://via.placeholder.com/300x200/059669/ffffff?text=Article+2"
    },
    {
      id: "10.5678/sustain.2024.2045",
      title: "Renewable Energy Policy and Its Impact on Rural Development",
      authors: ["Rina Wijaya", "Hendra Gunawan", "Maya Kusuma"],
      journal: "Sustainability",
      volume: "Vol. 16 No. 8 (2024)",
      publishedDate: "22 April 2024",
      citations: 315,
      views: 54321,
      downloads: 7654,
      sdgFocus: [7, 1, 13],
      articleType: "Research Article",
      openAccess: true,
      thumbnail: "https://via.placeholder.com/300x200/d97706/ffffff?text=Article+3"
    },
    {
      id: "10.9012/marine.2024.3012",
      title: "Mangrove Restoration and Coastal Resilience in Southeast Asia",
      authors: ["Agus Setiawan", "Lina Marlina"],
      journal: "Marine Policy",
      volume: "Vol. 162 (2024)",
      publishedDate: "5 Februari 2024",
      citations: 287,
      views: 45678,
      downloads: 6543,
      sdgFocus: [14, 15, 13],
      articleType: "Research Article",
      openAccess: false,
      thumbnail: "https://via.placeholder.com/300x200/0891b2/ffffff?text=Article+4"
    },
    {
      id: "10.3456/climate.2024.4089",
      title: "Nature-based Solutions for Urban Heat Island Mitigation",
      authors: ["Putri Andini", "Rudi Hartono", "Sri Wahyuni"],
      journal: "Nature Climate Change",
      volume: "Vol. 14 No. 3 (2024)",
      publishedDate: "18 Januari 2024",
      citations: 542,
      views: 87654,
      downloads: 11234,
      sdgFocus: [11, 13, 15],
      articleType: "Review Article",
      openAccess: true,
      thumbnail: "https://via.placeholder.com/300x200/7c3aed/ffffff?text=Article+5"
    },
    {
      id: "10.7890/water.2024.5067",
      title: "Water Resource Management in Drought-Prone Areas",
      authors: ["Bambang Sutrisno", "Nurul Hidayah"],
      journal: "Water Resources Management",
      volume: "Vol. 38 No. 4 (2024)",
      publishedDate: "12 Maret 2024",
      citations: 198,
      views: 34567,
      downloads: 5432,
      sdgFocus: [6, 2, 13],
      articleType: "Research Article",
      openAccess: false,
      thumbnail: "https://via.placeholder.com/300x200/2563eb/ffffff?text=Article+6"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSDG, setSelectedSDG] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // SDG mapping
  const sdgMap = {
    1: { name: "No Poverty", color: "bg-red-500" },
    2: { name: "Zero Hunger", color: "bg-orange-500" },
    3: { name: "Good Health", color: "bg-green-500" },
    6: { name: "Clean Water", color: "bg-blue-400" },
    7: { name: "Clean Energy", color: "bg-yellow-500" },
    9: { name: "Industry & Innovation", color: "bg-orange-600" },
    11: { name: "Sustainable Cities", color: "bg-orange-500" },
    13: { name: "Climate Action", color: "bg-green-600" },
    14: { name: "Life Below Water", color: "bg-blue-600" },
    15: { name: "Life on Land", color: "bg-green-500" }
  };

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Database Artikel</h1>
        <p className="text-gray-500 mt-2 text-lg">Jelajahi artikel penelitian terklasifikasi berdasarkan target SDGs.</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-grow relative">
            <input 
              type="text" 
              placeholder="Cari judul artikel, DOI, atau kata kunci..." 
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
              value={selectedSDG}
              onChange={(e) => setSelectedSDG(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua SDGs</option>
              <option value="13">SDG 13 - Climate Action</option>
              <option value="11">SDG 11 - Sustainable Cities</option>
              <option value="7">SDG 7 - Clean Energy</option>
              <option value="14">SDG 14 - Life Below Water</option>
              <option value="15">SDG 15 - Life on Land</option>
            </select>
            
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="relevance">Relevansi</option>
              <option value="citations">Sitasi Tertinggi</option>
              <option value="views">Views Tertinggi</option>
              <option value="date">Terbaru</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Filter aktif:</span>
          {selectedSDG !== 'all' && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              SDG {selectedSDG}
              <button onClick={() => setSelectedSDG('all')} className="hover:text-indigo-900">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {selectedYear !== 'all' && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              Tahun {selectedYear}
              <button onClick={() => setSelectedYear('all')} className="hover:text-indigo-900">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {(selectedSDG !== 'all' || selectedYear !== 'all') && (
            <button 
              onClick={() => {setSelectedSDG('all'); setSelectedYear('all');}}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2"
            >
              Reset semua
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          Menampilkan <span className="font-bold text-gray-900">{articles.length}</span> artikel
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

      {/* Grid Daftar Artikel */}
      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <Link 
            key={article.id} 
            to={`/doi/${article.id}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              <div className="shrink-0">
                <img 
                  src={article.thumbnail} 
                  alt={article.title}
                  className="w-full md:w-48 h-32 object-cover rounded-xl"
                />
                {article.openAccess && (
                  <span className="inline-block mt-2 px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">
                    Open Access
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-grow">
                {/* Title */}
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-xl mb-2 leading-tight transition-colors">
                  {article.title}
                </h3>
                
                {/* Authors */}
                <p className="text-gray-600 text-sm mb-2">
                  {article.authors.join(", ")}
                </p>
                
                {/* Journal Info */}
                <p className="text-gray-500 text-sm mb-3">
                  <span className="font-medium text-gray-700">{article.journal}</span> • {article.volume} • {article.publishedDate}
                </p>
                
                {/* SDG Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.sdgFocus.map(sdg => (
                    <span 
                      key={sdg} 
                      className={`px-2.5 py-1 ${sdgMap[sdg]?.color || 'bg-gray-500'} text-white rounded-lg text-[10px] font-bold shadow-sm`}
                    >
                      SDG {sdg}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium">
                    {article.articleType}
                  </span>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:gap-3 pt-4 md:pt-0 border-t md:border-0 border-gray-50 shrink-0">
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-lg font-bold text-gray-900">{article.citations}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Sitasi</p>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-lg font-bold text-gray-900">{(article.views / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Views</p>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-lg font-bold text-gray-900">{(article.downloads / 1000).toFixed(1)}K</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Downloads</p>
                </div>
                
                <div className="md:ml-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-10 flex justify-center items-center gap-2">
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>
          Sebelumnya
        </button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">1</button>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">2</button>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">3</button>
        <span className="px-2 text-gray-400">...</span>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">12</button>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
          Selanjutnya
        </button>
      </div>
    </main>
  );
};

export default ArticleList;