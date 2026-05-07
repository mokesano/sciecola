import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const ResearchersList = () => {
  // State untuk filter dan pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSdg, setSelectedSdg] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Mock Database Peneliti (Enriched Data)
  const researchers = [
    {
      id: 1,
      name: "Dr. Andi Rahman",
      orcid: "0000-0002-1825-0097",
      avatar: "https://ui-avatars.com/api/?name=Andi+Rahman&background=6366f1&color=fff&size=128",
      title: "Associate Professor",
      univ: "Universitas Indonesia",
      country: "Indonesia",
      department: "Department of Environmental Science",
      email: "andi.rahman@ui.ac.id",
      
      // Metrics
      citations: 3245,
      hIndex: 28,
      publications: 42,
      collaborators: 156,
      views: 125000,
      
      // Research Focus
      researchInterests: ["Climate Change Adaptation", "Coastal Ecology", "Environmental Policy", "Sustainable Development"],
      sdgFocus: [13, 14, 15],
      topKeywords: ["climate resilience", "mangrove restoration", "carbon sequestration"],
      
      // Recent Activity
      recentPublications: [
        { title: "Coastal adaptation strategies in Southeast Asia", year: 2024, citations: 45 },
        { title: "Ecosystem-based approaches to climate resilience", year: 2023, citations: 78 }
      ],
      
      // Collaboration Network
      topCollaborators: ["Prof. Budi Santoso", "Dr. Siti Nurhaliza", "Dr. Maria Garcia"],
      institutions: ["Universitas Indonesia", "BRIN", "ASEAN Centre for Biodiversity"],
      
      // Timeline
      yearsActive: "2015 - Present",
      firstPublication: 2015,
      latestPublication: 2024
    },
    {
      id: 2,
      name: "Prof. Budi Santoso",
      orcid: "0000-0001-5543-2210",
      avatar: "https://ui-avatars.com/api/?name=Budi+Santoso&background=10b981&color=fff&size=128",
      title: "Full Professor",
      univ: "Universitas Gadjah Mada",
      country: "Indonesia",
      department: "Faculty of Geography",
      email: "budi.santoso@ugm.ac.id",
      
      citations: 5678,
      hIndex: 42,
      publications: 89,
      collaborators: 234,
      views: 287000,
      
      researchInterests: ["Urban Sustainability", "GIS & Remote Sensing", "Transport Planning", "Smart Cities"],
      sdgFocus: [11, 9, 13],
      topKeywords: ["urban mobility", "spatial analysis", "green infrastructure"],
      
      recentPublications: [
        { title: "Smart city frameworks for developing nations", year: 2024, citations: 92 },
        { title: "GIS-based urban heat island mapping", year: 2023, citations: 67 }
      ],
      
      topCollaborators: ["Dr. Andi Rahman", "Prof. Ahmad Fauzi", "Dr. Lisa Wong"],
      institutions: ["Universitas Gadjah Mada", "ITB", "World Bank"],
      
      yearsActive: "2008 - Present",
      firstPublication: 2008,
      latestPublication: 2024
    },
    {
      id: 3,
      name: "Dr. Siti Nurhaliza",
      orcid: "0000-0003-9981-4456",
      avatar: "https://ui-avatars.com/api/?name=Siti+Nurhaliza&background=f59e0b&color=fff&size=128",
      title: "Senior Researcher",
      univ: "Institut Teknologi Bandung",
      country: "Indonesia",
      department: "Research Center for Climate Change",
      email: "siti.nurhaliza@itb.ac.id",
      
      citations: 2156,
      hIndex: 22,
      publications: 34,
      collaborators: 98,
      views: 98000,
      
      researchInterests: ["Renewable Energy", "Energy Policy", "Climate Mitigation", "Just Transition"],
      sdgFocus: [7, 13, 1],
      topKeywords: ["solar energy", "energy access", "policy analysis"],
      
      recentPublications: [
        { title: "Renewable energy transition in Indonesia", year: 2024, citations: 34 },
        { title: "Community-based solar microgrids", year: 2023, citations: 56 }
      ],
      
      topCollaborators: ["Dr. Andi Rahman", "Prof. Hendra Gunawan", "Dr. Yuki Tanaka"],
      institutions: ["Institut Teknologi Bandung", "BRIN", "IRENA"],
      
      yearsActive: "2018 - Present",
      firstPublication: 2018,
      latestPublication: 2024
    },
    {
      id: 4,
      name: "Dr. Maria Garcia",
      orcid: "0000-0004-1122-3344",
      avatar: "https://ui-avatars.com/api/?name=Maria+Garcia&background=ef4444&color=fff&size=128",
      title: "Research Fellow",
      univ: "University of the Philippines",
      country: "Philippines",
      department: "Institute of Environmental Science",
      email: "maria.garcia@up.edu.ph",
      
      citations: 1890,
      hIndex: 19,
      publications: 28,
      collaborators: 67,
      views: 76000,
      
      researchInterests: ["Marine Conservation", "Biodiversity", "Fisheries Management", "Blue Economy"],
      sdgFocus: [14, 15, 2],
      topKeywords: ["coral reefs", "sustainable fisheries", "marine protected areas"],
      
      recentPublications: [
        { title: "Coral reef resilience in the Coral Triangle", year: 2024, citations: 28 },
        { title: "Community-based marine conservation", year: 2023, citations: 41 }
      ],
      
      topCollaborators: ["Dr. Andi Rahman", "Prof. Juan dela Cruz", "Dr. Lisa Wong"],
      institutions: ["University of the Philippines", "ASEAN Centre for Biodiversity", "WWF"],
      
      yearsActive: "2019 - Present",
      firstPublication: 2019,
      latestPublication: 2024
    },
    {
      id: 5,
      name: "Prof. Ahmad Fauzi",
      orcid: "0000-0005-6677-8899",
      avatar: "https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=8b5cf6&color=fff&size=128",
      title: "Full Professor",
      univ: "Universitas Gadjah Mada",
      country: "Indonesia",
      department: "School of Architecture",
      email: "ahmad.fauzi@ugm.ac.id",
      
      citations: 4321,
      hIndex: 35,
      publications: 67,
      collaborators: 189,
      views: 198000,
      
      researchInterests: ["Sustainable Architecture", "Green Building", "Urban Design", "Cultural Heritage"],
      sdgFocus: [11, 12, 13],
      topKeywords: ["passive design", "vernacular architecture", "low-carbon building"],
      
      recentPublications: [
        { title: "Vernacular architecture for climate adaptation", year: 2024, citations: 56 },
        { title: "Green building certification in tropical climates", year: 2023, citations: 73 }
      ],
      
      topCollaborators: ["Prof. Budi Santoso", "Dr. Dewi Lestari", "Prof. Kenji Yamamoto"],
      institutions: ["Universitas Gadjah Mada", "IABSE", "UNESCO"],
      
      yearsActive: "2010 - Present",
      firstPublication: 2010,
      latestPublication: 2024
    },
    {
      id: 6,
      name: "Dr. Lisa Wong",
      orcid: "0000-0006-9988-7766",
      avatar: "https://ui-avatars.com/api/?name=Lisa+Wong&background=06b6d4&color=fff&size=128",
      title: "Associate Professor",
      univ: "National University of Singapore",
      country: "Singapore",
      department: "Department of Biological Sciences",
      email: "lisa.wong@nus.edu.sg",
      
      citations: 3567,
      hIndex: 31,
      publications: 52,
      collaborators: 145,
      views: 156000,
      
      researchInterests: ["Conservation Biology", "Ecological Modeling", "Species Distribution", "Climate Impacts"],
      sdgFocus: [15, 13, 6],
      topKeywords: ["species extinction", "habitat fragmentation", "conservation planning"],
      
      recentPublications: [
        { title: "Modeling species distribution under climate change", year: 2024, citations: 67 },
        { title: "Connectivity conservation in Southeast Asia", year: 2023, citations: 89 }
      ],
      
      topCollaborators: ["Prof. Budi Santoso", "Dr. Maria Garcia", "Dr. Yuki Tanaka"],
      institutions: ["National University of Singapore", "ASEAN Centre for Biodiversity", "IUCN"],
      
      yearsActive: "2016 - Present",
      firstPublication: 2016,
      latestPublication: 2024
    }
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

  // Extract unique countries for filter
  const countries = useMemo(() => {
    const unique = [...new Set(researchers.map(r => r.country))];
    return ['all', ...unique.sort()];
  }, []);

  // Extract unique SDGs for filter
  const sdgs = useMemo(() => {
    const unique = [...new Set(researchers.flatMap(r => r.sdgFocus))];
    return ['all', ...unique.sort((a, b) => a - b)];
  }, []);

  // Filter & Sort Logic
  const filteredResearchers = useMemo(() => {
    let result = [...researchers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.univ.toLowerCase().includes(query) ||
        r.researchInterests.some(i => i.toLowerCase().includes(query)) ||
        r.topKeywords.some(k => k.toLowerCase().includes(query))
      );
    }

    // Country filter
    if (selectedCountry !== 'all') {
      result = result.filter(r => r.country === selectedCountry);
    }

    // SDG filter
    if (selectedSdg !== 'all') {
      result = result.filter(r => r.sdgFocus.includes(Number(selectedSdg)));
    }

    // Sorting
    switch (sortBy) {
      case 'citations':
        result.sort((a, b) => b.citations - a.citations);
        break;
      case 'publications':
        result.sort((a, b) => b.publications - a.publications);
        break;
      case 'hIndex':
        result.sort((a, b) => b.hIndex - a.hIndex);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevance: simple scoring based on search match + metrics
        if (searchQuery) {
          result.sort((a, b) => {
            const scoreA = (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 10 : 0) + 
                          (a.citations / 100);
            const scoreB = (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 10 : 0) + 
                          (b.citations / 100);
            return scoreB - scoreA;
          });
        }
        break;
    }

    return result;
  }, [searchQuery, selectedCountry, selectedSdg, sortBy]);

  // Helper: Format angka besar
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Database Peneliti</h1>
        <p className="text-gray-500 mt-2 text-lg">Jelajahi profil peneliti dan kontribusi mereka terhadap target SDGs.</p>
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

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          Menampilkan <span className="font-bold text-gray-900">{filteredResearchers.length}</span> dari {researchers.length} peneliti
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResearchers.map((pro) => (
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

      {/* Empty State */}
      {filteredResearchers.length === 0 && (
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

      {/* Pagination (Placeholder) */}
      {filteredResearchers.length > 0 && (
        <div className="mt-10 flex justify-center items-center gap-2">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>
            Sebelumnya
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">1</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">2</button>
          <span className="px-2 text-gray-400">...</span>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">5</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            Selanjutnya
          </button>
        </div>
      )}
    </main>
  );
};

export default ResearchersList;