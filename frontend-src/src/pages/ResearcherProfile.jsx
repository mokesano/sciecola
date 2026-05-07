import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

// Mock Database Peneliti (Extended dari ResearchersList)
const researchersDatabase = [
  {
    id: 1,
    name: "Dr. Andi Rahman",
    orcid: "0000-0002-1825-0097",
    avatar: "https://i.pravatar.cc/300?img=11",
    verified: true,
    title: "Associate Professor",
    univ: "Universitas Indonesia",
    department: "Department of Environmental Science",
    location: "Depok, Indonesia",
    email: "andi.rahman@ui.ac.id",
    scopusId: "57219929925",
    researcherId: "A-1234-2019",
    country: "Indonesia",
    
    // Metrics
    citations: 1248,
    hIndex: 17,
    i10Index: 21,
    publications: 42,
    collaborators: 156,
    views: 98732,
    downloads: 12843,
    sdgsInvolved: 12,
    yearsActive: "2012 - Sekarang",
    firstPublication: 2012,
    
    // Research Focus
    researchInterests: ["Climate Change Adaptation", "Coastal Ecology", "Environmental Policy", "Sustainable Development"],
    sdgFocus: [
      { sdg: 13, name: "Climate Action", percentage: 26, color: "#10b981" },
      { sdg: 3, name: "Good Health & Well-being", percentage: 19, color: "#14b8a6" },
      { sdg: 11, name: "Sustainable Cities", percentage: 17, color: "#f59e0b" },
      { sdg: 7, name: "Affordable & Clean Energy", percentage: 12, color: "#fbbf24" },
      { sdg: 4, name: "Quality Education", percentage: 10, color: "#ef4444" },
      { sdg: 6, name: "Clean Water & Sanitation", percentage: 8, color: "#3b82f6" },
      { sdg: 15, name: "Lainnya", percentage: 8, color: "#8b5cf6" }
    ],
    topKeywords: [
      { text: "Climate Change", size: 40 },
      { text: "Environmental Policy", size: 30 },
      { text: "Sustainable Cities", size: 25 },
      { text: "Coastal Resilience", size: 20 },
      { text: "Green Technology", size: 18 },
      { text: "Urban Sustainability", size: 16 },
      { text: "Water Management", size: 14 },
      { text: "Biodiversity", size: 12 },
      { text: "Waste Management", size: 10 },
      { text: "Energy Transition", size: 10 },
      { text: "Ecosystem Services", size: 8 },
      { text: "Environmental Education", size: 8 }
    ],
    
    // Publication Trend
    publicationTrend: [
      { year: "2015", count: 4 },
      { year: "2016", count: 6 },
      { year: "2017", count: 7 },
      { year: "2018", count: 8 },
      { year: "2019", count: 9 },
      { year: "2020", count: 10 },
      { year: "2021", count: 11 },
      { year: "2022", count: 13 },
      { year: "2023", count: 14 },
      { year: "2024", count: 17 }
    ],
    
    // Citation Trend
    citationTrend: [
      { year: "2015", citations: 245 },
      { year: "2016", citations: 312 },
      { year: "2017", citations: 398 },
      { year: "2018", citations: 512 },
      { year: "2019", citations: 645 },
      { year: "2020", citations: 789 },
      { year: "2021", citations: 923 },
      { year: "2022", citations: 1056 },
      { year: "2023", citations: 1178 },
      { year: "2024", citations: 1248 }
    ],
    
    // Recent Publications
    recentPublications: [
      {
        id: 1,
        title: "Climate Change Adaptation in Coastal Communities",
        journal: "Journal of Environmental Science",
        year: 2024,
        sdgs: [13, 11, 3],
        views: 652,
        citations: 45,
        thumbnail: "https://via.placeholder.com/80x60/10b981/ffffff?text=CC"
      },
      {
        id: 2,
        title: "Sustainable Urban Transport Systems in Indonesia",
        journal: "Sustainable Cities Review",
        year: 2024,
        sdgs: [11, 9],
        views: 510,
        citations: 38,
        thumbnail: "https://via.placeholder.com/80x60/f59e0b/ffffff?text=UT"
      },
      {
        id: 3,
        title: "Renewable Energy Policy and Its Impact",
        journal: "Energy Policy Journal",
        year: 2023,
        sdgs: [7, 13],
        views: 411,
        citations: 32,
        thumbnail: "https://via.placeholder.com/80x60/fbbf24/ffffff?text=RE"
      },
      {
        id: 4,
        title: "Digital Learning Innovation for Quality Education",
        journal: "Journal of Education Technology",
        year: 2023,
        sdgs: [4, 9],
        views: 398,
        citations: 21,
        thumbnail: "https://via.placeholder.com/80x60/ef4444/ffffff?text=DL"
      },
      {
        id: 5,
        title: "Green Technology Innovation for Sustainable Industry",
        journal: "Journal of Cleaner Production",
        year: 2023,
        sdgs: [9, 12],
        views: 362,
        citations: 17,
        thumbnail: "https://via.placeholder.com/80x60/8b5cf6/ffffff?text=GT"
      }
    ],
    
    // Collaborators
    collaborators: [
      {
        id: 1,
        name: "Prof. Budi Santoso",
        univ: "Universitas Gadjah Mada",
        avatar: "https://i.pravatar.cc/100?img=12",
        collaborations: 18
      },
      {
        id: 2,
        name: "Dr. Siti Nurhaliza",
        univ: "Institut Teknologi Bandung",
        avatar: "https://i.pravatar.cc/100?img=5",
        collaborations: 14
      },
      {
        id: 3,
        name: "Dr. Dwi Setiawan",
        univ: "Universitas Airlangga",
        avatar: "https://i.pravatar.cc/100?img=3",
        collaborations: 12
      },
      {
        id: 4,
        name: "Dr. Fatimah Azzahra",
        univ: "Universitas Hasanuddin",
        avatar: "https://i.pravatar.cc/100?img=9",
        collaborations: 10
      },
      {
        id: 5,
        name: "Prof. Rina Wulandari",
        univ: "IPB University",
        avatar: "https://i.pravatar.cc/100?img=10",
        collaborations: 9
      }
    ],
    
    // Institutional Affiliations
    affiliations: [
      { name: "Universitas Indonesia", articles: 28, percentage: 66.7, logo: "https://via.placeholder.com/40x40/6366f1/ffffff?text=UI" },
      { name: "Institut Teknologi Bandung", articles: 9, percentage: 21.4, logo: "https://via.placeholder.com/40x40/f59e0b/ffffff?text=ITB" },
      { name: "Universitas Gadjah Mada", articles: 5, percentage: 11.9, logo: "https://via.placeholder.com/40x40/10b981/ffffff?text=UGM" }
    ],
    
    // Social Links
    socialLinks: {
      googleScholar: "#",
      scopus: "#",
      orcid: "#",
      linkedin: "#",
      researchgate: "#"
    }
  }
];

const ResearcherProfile = () => {
  const { orcidCode } = useParams();
  const [activeTab, setActiveTab] = useState('ringkasan');
  
  // Find researcher by ORCID
  const researcher = researchersDatabase.find(r => r.orcid === orcidCode || r.id === 1); // Fallback untuk demo
  
  const [article, setArticle] = useState(null);

  if (!researcher) {
    return (
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Peneliti Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Maaf, profil peneliti dengan ORCID {orcidCode} tidak tersedia.</p>
          <Link to="/researchers" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Kembali ke Daftar Peneliti
          </Link>
        </div>
      </main>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-indigo-600">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // SDG Color Mapping
  const sdgColors = {
    1: "#ef4444", 2: "#f97316", 3: "#14b8a6", 4: "#ef4444",
    6: "#3b82f6", 7: "#fbbf24", 9: "#f97316", 11: "#f59e0b",
    12: "#eab308", 13: "#10b981", 14: "#0ea5e9", 15: "#22c55e"
  };

  return (
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img 
                  src={researcher.avatar} 
                  alt={researcher.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {researcher.verified && (
                  <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {researcher.name}
                {researcher.verified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h1>
              
              <p className="text-indigo-600 font-medium mb-4">{researcher.title}</p>
              
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{researcher.univ}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{researcher.department}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{researcher.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${researcher.email}`} className="text-indigo-600 hover:underline">{researcher.email}</a>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span>ORCID: {researcher.orcid}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <span className="text-xs">Scopus ID: {researcher.scopusId}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center">
                  <span className="text-xs">Researcher ID: {researcher.researcherId}</span>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                <a href={researcher.socialLinks.googleScholar} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </a>
                <a href={researcher.socialLinks.scopus} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </a>
                <a href={researcher.socialLinks.orcid} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                </a>
                <a href={researcher.socialLinks.linkedin} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & Actions */}
        <div className="lg:col-span-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Artikel</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.publications}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Sitasi</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.citations.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">h-index</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.hIndex}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">i10-index</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.i10Index}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.views.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.downloads.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">SDGs Terlibat</p>
              <p className="text-2xl font-bold text-gray-900">{researcher.sdgsInvolved}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Tahun Aktif</p>
              <p className="text-2xl font-bold text-gray-900 text-sm">{researcher.yearsActive}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Negara</p>
              <p className="text-2xl font-bold text-gray-900 text-sm">{researcher.country}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh CV
            </button>
            <button className="py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Bagikan Profil
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'ringkasan', label: 'Ringkasan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'artikel', label: 'Artikel', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
            { id: 'sitasi', label: 'Sitasi', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'sdgs', label: 'SDGs', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'kolaborasi', label: 'Kolaborasi', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'publikasi', label: 'Publikasi per Tahun', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'informasi', label: 'Informasi', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Artikel', value: researcher.publications, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Total Sitasi', value: researcher.citations, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
          { label: 'h-index', value: researcher.hIndex, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'i10-index', value: researcher.i10Index, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Total Views', value: researcher.views, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          { label: 'Downloads', value: researcher.downloads, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Publication Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Publikasi per Tahun</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Semua Tahun</option>
              <option>5 Tahun Terakhir</option>
              <option>10 Tahun Terakhir</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={researcher.publicationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SDG Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Artikel per SDGs</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={researcher.sdgFocus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {researcher.sdgFocus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-grow space-y-2">
              {researcher.sdgFocus.map((sdg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sdg.color }} />
                  <span className="text-gray-600">{sdg.name}</span>
                  <span className="font-semibold text-gray-900">({sdg.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Research Topics & Citation Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Word Cloud */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Topik Penelitian Utama</h3>
          <div className="flex flex-wrap justify-center items-center gap-3 py-8">
            {researcher.topKeywords.map((keyword, idx) => (
              <span 
                key={idx}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors font-medium"
                style={{ fontSize: `${keyword.size / 40 * 1.5}rem` }}
              >
                {keyword.text}
              </span>
            ))}
          </div>
        </div>

        {/* Citation Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Tren Sitasi</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Semua Tahun</option>
              <option>5 Tahun Terakhir</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={researcher.citationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="citations" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Articles & Collaborators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Articles */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Artikel Terbaru</h3>
            <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              Lihat semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {researcher.recentPublications.map((pub) => (
              <div key={pub.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={pub.thumbnail} alt={pub.title} className="w-20 h-16 object-cover rounded-lg shrink-0" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{pub.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{pub.journal} • {pub.year}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {pub.sdgs.map(sdg => (
                        <span key={sdg} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: sdgColors[sdg] || '#6b7280' }}>
                          {sdg}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {pub.views}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {pub.citations}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="#" className="text-sm text-indigo-600 font-medium mt-4 inline-flex items-center gap-1 hover:text-indigo-700">
            Lihat semua artikel
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Collaborators */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Kolaborasi Penulis</h3>
            <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              Lihat semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {researcher.collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={collab.avatar} alt={collab.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{collab.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{collab.univ}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                    {collab.collaborations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collaboration Map & Affiliations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Map Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peta Kolaborasi</h3>
          <div className="bg-gray-50 rounded-xl p-8 text-center h-64 flex items-center justify-center">
            <div className="text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">World Collaboration Map</p>
            </div>
          </div>
        </div>

        {/* Affiliations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Afiliasi Institusi</h3>
            <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              Lihat semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {researcher.affiliations.map((aff, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <img src={aff.logo} alt={aff.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{aff.name}</h4>
                  <p className="text-xs text-gray-500">{aff.articles} artikel</p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${aff.percentage}%` }}></div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900">{aff.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Analisis artikel Anda di Wizdam</h3>
            <p className="text-indigo-100">Masukkan DOI atau ORCID untuk melihat analisis dan klasifikasi SDGs secara instan.</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <input 
              type="text" 
              placeholder="Masukkan DOI atau ORCID"
              className="flex-grow lg:w-80 px-4 py-3 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
              Analisis Sekarang
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResearcherProfile;