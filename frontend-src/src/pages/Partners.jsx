import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared';

const Partners = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch partners from API
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/partners.php?limit=100');
        const data = await response.json();
        if (data.status === 'success' && data.partners) {
          setPartners(data.partners);
          setError(null);
        } else {
          setPartners(getDefaultPartners());
        }
      } catch (err) {
        console.error('Error fetching partners:', err);
        setPartners(getDefaultPartners());
        setError('Failed to load partners');
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // Default/Fallback Partner Data
  const getDefaultPartners = () => [
    {
      id: 1,
      name: 'University of Melbourne',
      category: 'academic',
      logo: 'https://via.placeholder.com/150x60/ef4444/ffffff?text=UoM',
      description: 'Kolaborasi riset iklim dan keberlanjutan',
      website: 'https://www.unimelb.edu.au',
      partnership_type: 'Research',
      start_date: '2022-01-15'
    },
    {
      id: 2,
      name: 'UNEP - United Nations Environment Programme',
      category: 'ngo',
      logo: 'https://via.placeholder.com/150x60/10b981/ffffff?text=UNEP',
      description: 'Program lingkungan dan SDGs',
      website: 'https://www.unep.org',
      partnership_type: 'Policy',
      start_date: '2023-06-01'
    },
    {
      id: 3,
      name: 'World Bank',
      category: 'organization',
      logo: 'https://via.placeholder.com/150x60/0ea5e9/ffffff?text=WorldBank',
      description: 'Program pembangunan berkelanjutan',
      website: 'https://www.worldbank.org',
      partnership_type: 'Development',
      start_date: '2023-03-01'
    }
  ];

  // Dynamic category counts
  const categoryCounts = {
    all: partners.length,
    academic: partners.filter(p => p.category === 'academic').length,
    ngo: partners.filter(p => p.category === 'ngo').length,
    organization: partners.filter(p => p.category === 'organization').length
  };

  // Partner Categories with dynamic counts
  const categories = [
    { id: 'all', label: 'Semua Mitra', count: categoryCounts.all },
    { id: 'academic', label: 'Academic', count: categoryCounts.academic },
    { id: 'ngo', label: 'NGO', count: categoryCounts.ngo },
    { id: 'organization', label: 'Organization', count: categoryCounts.organization }
  ];

  // Filter Logic
  const filteredPartners = partners.filter(partner => {
    const matchesCategory = activeCategory === 'all' || partner.category === activeCategory;
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Stats
  const stats = {
    totalPartners: partners.length,
    dataProviders: categoryCounts.academic || 0,
    institutions: categoryCounts.ngo || 0,
    countries: Math.max(3, Math.ceil(partners.length / 2))
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span className="text-gray-900 font-medium">Mitra Kami</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mitra & Kolaborator</h1>
        <p className="text-gray-600 mt-2 max-w-3xl">
          WIZDAM berkolaborasi dengan institusi riset, penyedia data, pemerintah, dan organisasi masyarakat
          untuk memperkuat ekosistem analisis SDGs berbasis bukti di Indonesia dan Global South.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!loading && (
      <>

      {/* Main Content */}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Mitra', value: stats.totalPartners, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Penyedia Data', value: stats.dataProviders, icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', color: 'bg-purple-50 text-purple-600' },
          { label: 'Institusi Riset', value: stats.institutions, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'bg-green-50 text-green-600' },
          { label: 'Negara Mitra', value: stats.countries, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-amber-50 text-amber-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input 
              type="text" 
              placeholder="Cari mitra, institusi, atau organisasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeCategory === cat.id ? 'bg-indigo-500' : 'bg-gray-200'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              {/* Logo Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50 group-hover:bg-indigo-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-12 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {e.target.src = 'https://via.placeholder.com/150x60/9ca3af/ffffff?text=Logo'}}
                  />
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    partner.category === 'academic' ? 'bg-green-100 text-green-700' :
                    partner.category === 'ngo' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {partner.partnership_type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{partner.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{partner.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Mitra sejak {partner.start_date ? new Date(partner.start_date).getFullYear() : 'N/A'}</span>
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    Kunjungi Website
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                    Detail Kolaborasi
                  </button>
                  <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                    Hubungi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada mitra ditemukan</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori lain untuk menemukan mitra yang Anda cari.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      </>
      )}

      {/* Become a Partner CTA */}
      <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Ingin Bermitra dengan WIZDAM?</h3>
            <p className="text-indigo-100 text-sm max-w-xl">
              Kami terbuka untuk kolaborasi dengan institusi riset, penyedia data, pemerintah, dan organisasi 
              yang berkomitmen pada pencapaian SDGs. Mari bersama memperkuat ekosistem riset berbasis bukti.
            </p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <Link 
              to="/contact?subject=partnership" 
              className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2 text-sm"
            >
              Ajukan Kemitraan
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <a 
              href="/docs/partnership-guide.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-500/30 text-white rounded-xl font-semibold hover:bg-indigo-500/50 transition-colors whitespace-nowrap text-sm border border-white/30"
            >
              Panduan Kemitraan
            </a>
          </div>
        </div>
      </div>

      {/* Partner Benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            title: 'Akses Data Terintegrasi',
            description: 'Dapatkan akses ke platform analitik WIZDAM untuk visualisasi dan klasifikasi SDGs otomatis.'
          },
          {
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            title: 'Kolaborasi Riset',
            description: 'Terlibat dalam proyek riset bersama, publikasi joint, dan pengembangan metodologi inovatif.'
          },
          {
            icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            title: 'Dampak Global',
            description: 'Perluas jangkauan karya Anda melalui jaringan mitra WIZDAM di Indonesia dan Global South.'
          }
        ].map((benefit, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={benefit.icon} />
              </svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{benefit.title}</h4>
            <p className="text-sm text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Partners;