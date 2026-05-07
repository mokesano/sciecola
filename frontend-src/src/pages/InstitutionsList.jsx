import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

// ==========================================
// INSTITUTIONS LIST COMPONENT
// ==========================================
const InstitutionsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Mock data institutions
  const institutions = [
    {
      id: 1,
      name: "Universitas Indonesia",
      country: "Indonesia",
      logo: "https://via.placeholder.com/100x100/fbbf24/ffffff?text=UI",
      type: "Perguruan Tinggi Negeri",
      established: 1849,
      publications: 5732,
      researchers: 2841,
      citations: 21897,
      hIndex: 42,
      sdgs: 15,
      journals: 78,
      collaborations: 126,
      website: "https://www.ui.ac.id"
    },
    {
      id: 2,
      name: "Institut Teknologi Bandung",
      country: "Indonesia",
      logo: "https://via.placeholder.com/100x100/6366f1/ffffff?text=ITB",
      type: "Perguruan Tinggi Negeri",
      established: 1920,
      publications: 4521,
      researchers: 2134,
      citations: 18234,
      hIndex: 38,
      sdgs: 14,
      journals: 65,
      collaborations: 98,
      website: "https://www.itb.ac.id"
    },
    {
      id: 3,
      name: "Universitas Gadjah Mada",
      country: "Indonesia",
      logo: "https://via.placeholder.com/100x100/10b981/ffffff?text=UGM",
      type: "Perguruan Tinggi Negeri",
      established: 1949,
      publications: 4123,
      researchers: 1987,
      citations: 16543,
      hIndex: 36,
      sdgs: 13,
      journals: 58,
      collaborations: 87,
      website: "https://www.ugm.ac.id"
    },
    {
      id: 4,
      name: "University of Melbourne",
      country: "Australia",
      logo: "https://via.placeholder.com/100x100/ef4444/ffffff?text=UoM",
      type: "Public University",
      established: 1855,
      publications: 12543,
      researchers: 5432,
      citations: 87654,
      hIndex: 78,
      sdgs: 17,
      journals: 145,
      collaborations: 234,
      website: "https://www.unimelb.edu.au"
    },
    {
      id: 5,
      name: "Nanyang Technological University",
      country: "Singapore",
      logo: "https://via.placeholder.com/100x100/f97316/ffffff?text=NTU",
      type: "Public University",
      established: 1991,
      publications: 9876,
      researchers: 3456,
      citations: 65432,
      hIndex: 65,
      sdgs: 16,
      journals: 112,
      collaborations: 187,
      website: "https://www.ntu.edu.sg"
    },
    {
      id: 6,
      name: "Universiti Malaya",
      country: "Malaysia",
      logo: "https://via.placeholder.com/100x100/8b5cf6/ffffff?text=UM",
      type: "Public University",
      established: 1905,
      publications: 6543,
      researchers: 2876,
      citations: 34567,
      hIndex: 52,
      sdgs: 15,
      journals: 89,
      collaborations: 134,
      website: "https://www.um.edu.my"
    }
  ];

  const countries = ['all', 'Indonesia', 'Australia', 'Singapore', 'Malaysia'];

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || inst.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Institusi</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Institusi</h1>
        <p className="text-gray-600">Jelajahi profil institusi penelitian dan kontribusi mereka terhadap SDGs.</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Cari nama institusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? 'Semua Negara' : country}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="relevance">Relevansi</option>
              <option value="publications">Publikasi Terbanyak</option>
              <option value="citations">Sitasi Tertinggi</option>
              <option value="hIndex">H-Index Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm">
          Menampilkan <span className="font-bold text-gray-900">{filteredInstitutions.length}</span> institusi
        </p>
      </div>

      {/* Institutions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInstitutions.map((inst) => (
          <Link
            key={inst.id}
            to={`/institutions/${inst.id}`}
            className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all"
          >
            <div className="flex gap-6">
              {/* Logo */}
              <div className="shrink-0">
                <img 
                  src={inst.logo} 
                  alt={inst.name}
                  className="w-24 h-24 object-contain rounded-xl bg-gray-50 p-2 group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {inst.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                        {inst.type}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {inst.country}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Berdiri sejak {inst.established} • {inst.website.replace('https://', '').replace('www.', '')}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{inst.publications.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Publikasi</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{inst.researchers.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Peneliti</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{inst.hIndex}</p>
                    <p className="text-[10px] text-gray-500 uppercase">H-Index</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {inst.journals} Jurnal
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {inst.collaborations} Kolaborasi
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {inst.sdgs} SDGs
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredInstitutions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak ada institusi ditemukan</h3>
          <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian Anda.</p>
        </div>
      )}
    </main>
  );
};

export default InstitutionsList;