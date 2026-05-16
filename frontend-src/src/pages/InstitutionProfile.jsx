import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { LoadingSpinner } from '../components/shared';

// ==========================================
// INSTITUTION PROFILE COMPONENT
// ==========================================
const InstitutionProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Default/fallback data
  const defaultInstitution = {
    id: 1,
    name: "Universitas Indonesia",
    logo: "https://via.placeholder.com/150x150/fbbf24/ffffff?text=UI",
    type: "Perguruan Tinggi Negeri",
    country: "Indonesia",
    website: "https://www.ui.ac.id",
    location: "Depok, Jawa Barat, Indonesia",
    established: "2 Februari 1849",
    institutionType: "Universitas",
    rector: "Prof. Ari Kuncoro, S.E., M.A., Ph.D.",
    faculties: 14,
    students: "46,812 (2024)",
    lecturers: "2,503 (2024)",
    motto: "Veritas, Probitas, Iustitia",
    
    // Stats
    publications: 5732,
    researchers: 2841,
    citations: 21897,
    hIndex: 42,
    i10Index: 89,
    journals: 78,
    collaborations: 126,
    sdgs: 15,
    
    // Social links
    social: {
      globe: "#",
      linkedin: "#",
      youtube: "#",
      instagram: "#"
    }
  };

  // Fetch institution profile from API
  useEffect(() => {
    const fetchInstitutionProfile = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/institution_profile.php?id=${id}`);
        const data = await response.json();

        if (data.status === 'success' && data.institution) {
          // Map API response to component structure
          const mappedData = {
            institution: {
              ...data.institution,
              publications: data.statistics?.publications || 0,
              researchers: data.statistics?.researchers || 0,
              citations: data.statistics?.citations || 0,
              hIndex: data.statistics?.hIndex || 0,
              i10Index: data.statistics?.i10Index || 0,
              journals: data.statistics?.journals || 0,
              collaborations: data.statistics?.collaborations || 0,
              sdgs: (data.statistics?.sdg_focus || []).length,
              location: `${data.institution.city || ''}, ${data.institution.country || ''}`.trim(),
              established: data.institution.established_year ? `Tahun ${data.institution.established_year}` : 'N/A',
              students: `${data.institution.students || 0} (2024)`,
              lecturers: `${data.institution.lecturers || 0} (2024)`
            },
            publication_trend: data.publication_trend || [],
            top_researchers: data.top_researchers || [],
            top_publications: data.top_publications || [],
            news: data.news || [],
            sdg_list: data.statistics?.sdg_focus || []
          };

          setProfileData(mappedData);
          setError(null);
        } else {
          setProfileData(null);
          setError('Failed to load institution data');
        }
      } catch (err) {
        console.error('Error fetching institution:', err);
        setProfileData(null);
        setError('Failed to load institution data');
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionProfile();
  }, [id]);

  const institution = profileData?.institution || defaultInstitution;

  // Publication trend data
  const publicationTrend = [
    { year: "2018", count: 580 },
    { year: "2019", count: 720 },
    { year: "2020", count: 810 },
    { year: "2021", count: 950 },
    { year: "2022", count: 1100 },
    { year: "2023", count: 1250 },
    { year: "2024", count: 1400 }
  ];

  // SDG distribution data
  const sdgDistribution = [
    { name: "Good Health & Well-being", value: 18, sdg: 3, color: "#14b8a6" },
    { name: "Quality Education", value: 16, sdg: 4, color: "#ef4444" },
    { name: "Climate Action", value: 14, sdg: 13, color: "#10b981" },
    { name: "Affordable & Clean Energy", value: 11, sdg: 7, color: "#fbbf24" },
    { name: "Sustainable Cities", value: 10, sdg: 11, color: "#f59e0b" },
    { name: "Lainnya", value: 31, sdg: 0, color: "#6366f1" }
  ];

  // Citation trend data
  const citationTrend = [
    { year: "2018", citations: 1800 },
    { year: "2019", citations: 2400 },
    { year: "2020", citations: 3200 },
    { year: "2021", citations: 4100 },
    { year: "2022", citations: 5300 },
    { year: "2023", citations: 6800 },
    { year: "2024", citations: 7500 }
  ];

  // Top collaborators
  const topCollaborators = [
    { name: "University of Melbourne", country: "Australia", publications: 156, logo: "https://via.placeholder.com/40x40/ef4444/ffffff?text=UoM" },
    { name: "Nanyang Technological University", country: "Singapore", publications: 132, logo: "https://via.placeholder.com/40x40/f97316/ffffff?text=NTU" },
    { name: "Universiti Malaya", country: "Malaysia", publications: 128, logo: "https://via.placeholder.com/40x40/8b5cf6/ffffff?text=UM" },
    { name: "The University of Tokyo", country: "Jepang", publications: 97, logo: "https://via.placeholder.com/40x40/ef4444/ffffff?text=UT" },
    { name: "Massachusetts Institute of Technology", country: "Amerika Serikat", publications: 85, logo: "https://via.placeholder.com/40x40/6366f1/ffffff?text=MIT" }
  ];

  // Published journals
  const journals = [
    { name: "Indonesian Journal of Environmental Management", eissn: "2549-5798", publications: 432, color: "bg-blue-500" },
    { name: "Jurnal Kesehatan Masyarakat Indonesia", eissn: "2355-0256", publications: 389, color: "bg-green-500" },
    { name: "Indonesian Journal of Science Education", eissn: "2407-795X", publications: 287, color: "bg-emerald-500" },
    { name: "Journal of Engineering and Technological Sciences", eissn: "2337-5779", publications: 256, color: "bg-teal-500" },
    { name: "Jurnal Manajemen dan Organisasi", eissn: "2598-7232", publications: 213, color: "bg-red-500" }
  ];

  // News & activities
  const news = [
    { title: "UI Raih Penghargaan Green Campus Award 2024", date: "10 Mei 2024", image: "https://via.placeholder.com/80x60/10b981/ffffff?text=News" },
    { title: "Konferensi Internasional UI: Sustainability in Action", date: "28 April 2024", image: "https://via.placeholder.com/80x60/6366f1/ffffff?text=News" },
    { title: "Peneliti UI Kembangkan Teknologi Energi Terbarukan", date: "15 April 2024", image: "https://via.placeholder.com/80x60/f59e0b/ffffff?text=News" },
    { title: "Kolaborasi Riset UI dan MIT dalam AI for Health", date: "5 April 2024", image: "https://via.placeholder.com/80x60/8b5cf6/ffffff?text=News" }
  ];

  // Research topics word cloud (simplified as tags)
  const researchTopics = [
    { text: "Climate Change", size: 48 },
    { text: "Public Health", size: 36 },
    { text: "Sustainable Cities", size: 32 },
    { text: "Renewable Energy", size: 28 },
    { text: "Environmental Policy", size: 24 },
    { text: "Artificial Intelligence", size: 22 },
    { text: "Urban Planning", size: 20 },
    { text: "Water Management", size: 18 },
    { text: "Biodiversity", size: 16 },
    { text: "Ocean Science", size: 14 },
    { text: "Digital Learning", size: 12 },
    { text: "Circular Economy", size: 10 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-indigo-600">
            {payload[0].name}: {payload[0].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/institutions" className="hover:text-indigo-600 transition-colors">Institutions</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Profile Institusi</span>
      </nav>

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Logo & Basic Info */}
        <div className="flex gap-6 lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-center mb-6">
              <img 
                src={institution.logo} 
                alt={institution.name}
                className="w-32 h-32 object-contain mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{institution.name}</h1>
              <div className="flex gap-2 justify-center mt-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium">
                  {institution.type}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">
                  {institution.country}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-2">
            <p className="text-m text-gray-600 mb-6 leading-relaxed">
              Universitas Indonesia (UI) adalah perguruan tinggi negeri tertua di Indonesia yang berkomitmen untuk menghasilkan penelitian berkualitas dan memberikan kontribusi nyata bagi masyarakat dan pembangunan berkelanjutan.
            </p>
            <div className="space-y-3 text-m">
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href={institution.website} className="text-indigo-600 hover:underline truncate">
                  {institution.website}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{institution.location}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Didirikan: {institution.established}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Tipe Institusi: {institution.institutionType}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">Rektor: {institution.rector}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Jumlah Fakultas: {institution.faculties}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Jumlah Mahasiswa: {institution.students}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Jumlah Dosen: {institution.lecturers}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <a href={institution.social.globe} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
              <a href={institution.social.linkedin} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
                </svg>
              </a>
              <a href={institution.social.youtube} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href={institution.social.instagram} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Stats Cards */}
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Total Publikasi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.publications.toLocaleString()}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Peneliti</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.researchers.toLocaleString()}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Jurnal Terafiliasi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.journals}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Kolaborasi Institusi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.collaborations}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Sitasi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.citations.toLocaleString()}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">SDGs Terlibat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{institution.sdgs}</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-gray-600">h-index</span>
              <span className="text-xl font-bold text-gray-900">{institution.hIndex}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-gray-600">i10-index</span>
              <span className="text-xl font-bold text-gray-900">{institution.i10Index}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {[
            { id: 'ringkasan', label: 'Ringkasan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'publikasi', label: 'Publikasi', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { id: 'peneliti', label: 'Peneliti', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'sdgs', label: 'SDGs', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'kolaborasi', label: 'Kolaborasi', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { id: 'jurnal', label: 'Jurnal', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
            { id: 'berita', label: 'Berita', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        {[
          { label: 'Total Publikasi', value: institution.publications, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Total Sitasi', value: institution.citations, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
          { label: 'h-index', value: institution.hIndex, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'Peneliti', value: institution.researchers, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Jurnal', value: institution.journals, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
          { label: 'SDGs Terlibat', value: institution.sdgs, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
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
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={publicationTrend}>
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
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Publikasi per SDGs</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sdgDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sdgDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-grow space-y-2">
              {sdgDistribution.map((sdg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sdg.color }} />
                  <span className="text-gray-600">SDG {sdg.sdg} {sdg.name}</span>
                  <span className="font-semibold text-gray-900">({sdg.value}%)</span>
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
          <div className="flex flex-wrap justify-center items-center gap-4 py-6 bg-gray-50 rounded-xl">
            {researchTopics.map((topic, idx) => (
              <span 
                key={idx}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors font-medium"
                style={{ fontSize: `${topic.size / 48 * 1.5}rem` }}
              >
                {topic.text}
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
            <AreaChart data={citationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="citations" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collaboration Map & Top Collaborators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Kolaborasi Institusi</h3>
          <div className="bg-gray-50 rounded-xl p-8 h-64 flex items-center justify-center relative">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">World Collaboration Map</p>
            </div>
            <div className="absolute right-4 bottom-4 flex flex-col gap-1">
              <button className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-200 rounded"></div>
              <span className="text-gray-600">Kontribusi Tinggi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-50 rounded"></div>
              <span className="text-gray-600">Kontribusi Rendah</span>
            </div>
          </div>
        </div>

        {/* Top Collaborators */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Kolaborator</h3>
            <Link to="#" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              Lihat semua kolaborator
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-3">
            {topCollaborators.map((collab, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={collab.logo} alt={collab.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{collab.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{collab.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{collab.publications}</p>
                  <p className="text-xs text-gray-500">publikasi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Journals & News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Journals */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Jurnal yang Diterbitkan</h3>
          <div className="space-y-3">
            {journals.map((journal, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${journal.color} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                    JR
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{journal.name}</h4>
                    <p className="text-xs text-gray-500">E-ISSN: {journal.eissn}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{journal.publications}</p>
                  <p className="text-xs text-gray-500">artikel</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="#" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat semua jurnal
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* News */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Berita & Kegiatan Terbaru</h3>
          <div className="space-y-4">
            {news.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img src={item.image} alt={item.title} className="w-20 h-16 object-cover rounded-lg shrink-0" />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="#" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Lihat semua berita
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Jelajahi riset dan kolaborasi {institution.name} di Sciecola</h3>
            <p className="text-indigo-100">Temukan publikasi, peneliti, dan dampak riset untuk masa depan berkelanjutan.</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <input 
              type="text" 
              placeholder="Cari publikasi atau peneliti dari institusi ini..."
              className="flex-grow lg:w-80 px-4 py-3 rounded-xl text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cari Sekarang
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default InstitutionProfile;