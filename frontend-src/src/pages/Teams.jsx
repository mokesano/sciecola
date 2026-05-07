import React from 'react';
import { Link } from 'react-router-dom';

const Teams = () => {
  // Data Tim Kepemimpinan
  const leadership = [
    {
      id: 1,
      name: "Dr. Andi Rahman",
      role: "Co-Founder & CEO",
      avatar: "https://i.pravatar.cc/300?img=11",
      linkedin: "#",
      email: "#"
    },
    {
      id: 2,
      name: "Dr. Siti Nurhaliza",
      role: "Co-Founder & CTO",
      avatar: "https://i.pravatar.cc/300?img=5",
      linkedin: "#",
      email: "#"
    },
    {
      id: 3,
      name: "Budi Santoso",
      role: "Head of Research",
      avatar: "https://i.pravatar.cc/300?img=12",
      linkedin: "#",
      email: "#"
    },
    {
      id: 4,
      name: "Dewi Setiawan",
      role: "Head of Data Science",
      avatar: "https://i.pravatar.cc/300?img=9",
      linkedin: "#",
      email: "#"
    },
    {
      id: 5,
      name: "Rizky Pratama",
      role: "Head of Product",
      avatar: "https://i.pravatar.cc/300?img=3",
      linkedin: "#",
      email: "#"
    }
  ];

  // Data Divisi
  const divisions = [
    {
      id: 1,
      name: "Riset & Akademik",
      description: "Mengelola kemitraan dengan institusi dan memastikan kualitas konten ilmiah.",
      members: 7,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 2,
      name: "Data Science",
      description: "Mengembangkan algoritma klasifikasi, analitik, dan visualisasi data.",
      members: 6,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 3,
      name: "Engineering",
      description: "Membangun dan memelihara platform dengan performa tinggi dan aman.",
      members: 8,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 4,
      name: "Produk & Desain",
      description: "Merancang pengalaman pengguna yang intuitif dan solusi yang berdampak.",
      members: 4,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    }
  ];

  // Data Konsultan & Penasihat
  const advisors = [
    {
      id: 1,
      name: "Prof. Dr. Arief Rachman",
      role: "Pakar Keberlanjutan",
      affiliation: "Universitas Indonesia",
      expertise: "Sustainability & SDGs",
      avatar: "https://i.pravatar.cc/300?img=60"
    },
    {
      id: 2,
      name: "Prof. Dr. Michiko Tanaka",
      role: "Data Science Advisor",
      affiliation: "The University of Tokyo",
      expertise: "AI & Big Data",
      avatar: "https://i.pravatar.cc/300?img=44"
    },
    {
      id: 3,
      name: "Dr. Maria Fernandez",
      role: "Research Advisor",
      affiliation: "University of Melbourne",
      expertise: "Environmental Science",
      avatar: "https://i.pravatar.cc/300?img=47"
    },
    {
      id: 4,
      name: "Prof. Dr. Bambang Supriyadi",
      role: "Policy Advisor",
      affiliation: "BRIN",
      expertise: "Kebijakan & Inovasi",
      avatar: "https://i.pravatar.cc/300?img=53"
    }
  ];

  // Data Nilai Kami
  const values = [
    {
      id: 1,
      name: "Integritas",
      description: "Kami menjunjung tinggi kejujuran, transparansi, dan etika dalam setiap langkah.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 2,
      name: "Kolaborasi",
      description: "Kami percaya kolaborasi adalah kunci untuk menghasilkan dampak yang lebih besar.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 3,
      name: "Inovasi",
      description: "Kami terus berinovasi memanfaatkan teknologi untuk memajukan riset dan keberlanjutan.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 4,
      name: "Dampak",
      description: "Kami berkomitmen memberikan kontribusi nyata bagi masyarakat dan lingkungan global.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  // Data Pencapaian
  const achievements = [
    { value: "10K+", label: "Pengguna Terdaftar", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { value: "98K+", label: "Artikel Terindeks", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { value: "120+", label: "Institusi Mitra", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { value: "50+", label: "Negara Terhubung", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span>›</span>
        <Link to="/about" className="hover:text-indigo-600 transition-colors">Tentang Kami</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Tim Kami</span>
      </div>

      {/* Hero Section */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tim di Balik Sciecola
            </h1>
            <p className="text-lg font-semibold text-gray-800 mb-3">
              Berkomitmen untuk mendukung riset dan inovasi berbasis data demi pencapaian SDGs.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Kami adalah tim multidisiplin yang terdiri dari peneliti, data scientist, engineer, dan desainer yang bekerja bersama untuk membangun platform analitik riset terpercaya dan berdampak global.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">25+</p>
                <p className="text-sm text-gray-500">Anggota Tim</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-sm text-gray-500">Negara</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-500">Bidang Keahlian</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">3+</p>
                <p className="text-sm text-gray-500">Tahun Berkarya</p>
              </div>
            </div>
          </div>

          {/* Illustration Placeholder */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="w-full max-w-lg">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 relative">
                {/* Team Illustration SVG */}
                <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                  {/* Background Elements */}
                  <circle cx="350" cy="50" r="40" fill="#e0e7ff" opacity="0.5" />
                  <circle cx="50" cy="250" r="60" fill="#ddd6fe" opacity="0.3" />
                  
                  {/* Team Members */}
                  <g transform="translate(50, 80)">
                    <circle cx="30" cy="40" r="30" fill="#6366f1" />
                    <circle cx="30" cy="35" r="15" fill="#c7d2fe" />
                    <rect x="50" y="50" width="80" height="60" rx="8" fill="white" />
                    <rect x="60" y="60" width="60" height="4" rx="2" fill="#e5e7eb" />
                    <rect x="60" y="70" width="40" height="4" rx="2" fill="#e5e7eb" />
                  </g>
                  
                  <g transform="translate(150, 60)">
                    <circle cx="30" cy="40" r="30" fill="#8b5cf6" />
                    <circle cx="30" cy="35" r="15" fill="#ddd6fe" />
                    <rect x="50" y="50" width="80" height="60" rx="8" fill="white" />
                    <rect x="60" y="60" width="60" height="4" rx="2" fill="#e5e7eb" />
                    <rect x="60" y="70" width="50" height="4" rx="2" fill="#e5e7eb" />
                  </g>
                  
                  <g transform="translate(250, 70)">
                    <circle cx="30" cy="40" r="30" fill="#a78bfa" />
                    <circle cx="30" cy="35" r="15" fill="#ede9fe" />
                    <rect x="50" y="50" width="80" height="60" rx="8" fill="white" />
                    <rect x="60" y="60" width="55" height="4" rx="2" fill="#e5e7eb" />
                    <rect x="60" y="70" width="45" height="4" rx="2" fill="#e5e7eb" />
                  </g>
                  
                  <g transform="translate(100, 140)">
                    <circle cx="30" cy="40" r="30" fill="#7c3aed" />
                    <circle cx="30" cy="35" r="15" fill="#ddd6fe" />
                    <rect x="50" y="50" width="80" height="60" rx="8" fill="white" />
                    <rect x="60" y="60" width="65" height="4" rx="2" fill="#e5e7eb" />
                    <rect x="60" y="70" width="35" height="4" rx="2" fill="#e5e7eb" />
                  </g>
                  
                  <g transform="translate(200, 150)">
                    <circle cx="30" cy="40" r="30" fill="#6d28d9" />
                    <circle cx="30" cy="35" r="15" fill="#ddd6fe" />
                    <rect x="50" y="50" width="80" height="60" rx="8" fill="white" />
                    <rect x="60" y="60" width="50" height="4" rx="2" fill="#e5e7eb" />
                    <rect x="60" y="70" width="55" height="4" rx="2" fill="#e5e7eb" />
                  </g>
                </svg>
                
                {/* Decorative Leaves */}
                <svg className="absolute -bottom-4 -right-4 w-32 h-32 opacity-50" viewBox="0 0 100 100" fill="none">
                  <path d="M50 0C50 27.6 27.6 50 0 50C27.6 50 50 72.4 50 100C50 72.4 72.4 50 100 50C72.4 50 50 27.6 50 0Z" fill="#a78bfa" opacity="0.3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Kepemimpinan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {leadership.map((person) => (
            <div key={person.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="mb-4 relative inline-block">
                <img 
                  src={person.avatar} 
                  alt={person.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-indigo-50 group-hover:border-indigo-100 transition-colors"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{person.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-4">{person.role}</p>
              <div className="flex justify-center gap-3">
                <a href={person.linkedin} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href={person.email} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divisions Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Divisi Kami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {divisions.map((div) => (
            <div key={div.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                {div.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{div.name}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{div.description}</p>
              <p className="text-sm font-semibold text-indigo-600">{div.members} Anggota</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advisors Section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Konsultan & Penasihat</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-md transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advisors.map((advisor) => (
            <div key={advisor.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center">
              <img 
                src={advisor.avatar} 
                alt={advisor.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-gray-50"
              />
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{advisor.name}</h3>
              <p className="text-xs text-indigo-600 font-medium mb-2">{advisor.role}</p>
              <p className="text-xs text-gray-500 mb-1">{advisor.affiliation}</p>
              <p className="text-xs text-gray-400">{advisor.expertise}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values & Achievements */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Nilai Kami</h2>
          <div className="space-y-6">
            {values.map((value) => (
              <div key={value.id} className="flex gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  {value.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{value.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Pencapaian Kami</h2>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={achievement.icon} />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{achievement.value}</p>
                </div>
                <p className="text-sm text-gray-600">{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Bergabunglah bersama kami</h3>
            <p className="text-indigo-100">Mari berkolaborasi untuk riset yang lebih baik dan masa depan yang berkelanjutan.</p>
          </div>
          <button className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2">
            Hubungi Kami
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Teams;