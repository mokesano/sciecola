import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  // Mission Cards Data
  const missions = [
    {
      id: 1,
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Global Impact',
      description: 'Memberdayakan peneliti di seluruh dunia untuk memahami dan memperkuat kontribusi mereka terhadap pembangunan berkelanjutan.'
    },
    {
      id: 2,
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      title: 'AI Innovation',
      description: 'Memanfaatkan kecerdasan buatan terkini untuk memberikan klasifikasi SDG yang akurat dan komprehensif.'
    },
    {
      id: 3,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      title: 'Community Driven',
      description: 'Membangun platform kolaboratif yang menghubungkan peneliti, institusi, dan pembuat kebijakan.'
    }
  ];

  // Timeline Data
  const timeline = [
    {
      year: '2020',
      title: 'Foundation',
      description: 'Sciecola didirikan oleh tim peneliti dan ahli AI yang bersemangat menggunakan teknologi untuk kebaikan sosial. Ide muncul dari tantangan mengukur dampak riset terhadap SDGs.'
    },
    {
      year: '2021',
      title: 'First Platform',
      description: 'Meluncurkan prototipe klasifikasi SDG pertama, bekerja sama dengan universitas untuk menguji dan menyempurnakan algoritma AI menggunakan ribuan makalah penelitian.'
    },
    {
      year: '2022',
      title: 'API Launch',
      description: 'Merilis API komprehensif kami, memungkinkan institusi mengintegrasikan analisis SDG langsung ke dalam sistem manajemen penelitian mereka.'
    },
    {
      year: '2023',
      title: 'Global Expansion',
      description: 'Bermitra dengan universitas dan lembaga penelitian terkemuka di seluruh dunia, menganalisis lebih dari 1 juta publikasi untuk relevansi SDG.'
    },
    {
      year: '2024',
      title: 'AI Enhancement',
      description: 'Memperkenalkan kemampuan pemrosesan bahasa alami dan machine learning canggih, mencapai akurasi 95%+ dalam klasifikasi SDG.'
    }
  ];

  // Technology Features Data
  const techFeatures = [
    {
      id: 1,
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      title: 'Keyword Analysis',
      description: 'Pencocokan semantik canggih terhadap kosakata dan taksonomi SDG yang komprehensif.',
      weight: 30,
      color: 'bg-indigo-500'
    },
    {
      id: 2,
      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      title: 'Similarity Mapping',
      description: 'Model deep learning yang memahami hubungan kontekstual antara konten penelitian dan tema SDG.',
      weight: 30,
      color: 'bg-emerald-500'
    },
    {
      id: 3,
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      title: 'Substantive Analysis',
      description: 'Evaluasi kedalaman penelitian dan relevansi metodologi terhadap target dan indikator SDG spesifik.',
      weight: 20,
      color: 'bg-amber-500'
    },
    {
      id: 4,
      icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      title: 'Causal Inference',
      description: 'Deteksi hubungan kausal dan bukti dampak langsung terhadap hasil SDG.',
      weight: 20,
      color: 'bg-purple-500'
    }
  ];

  // Team Members Data
  const teamMembers = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      role: 'Chief Technology Officer',
      bio: 'Peneliti AI dengan pengalaman 15+ tahun dalam pemrosesan bahasa alami dan machine learning.',
      avatar: 'https://i.pravatar.cc/300?img=5',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      id: 2,
      name: 'Prof. Michael Rodriguez',
      role: 'Chief Scientific Officer',
      bio: 'Ahli keberlanjutan dan mantan penasihat PBB tentang pengukuran dan pemantauan SDG.',
      avatar: 'https://i.pravatar.cc/300?img=12',
      social: { linkedin: '#', researchgate: '#' }
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'Head of Product',
      bio: 'Strateg produk yang fokus menciptakan alat intuitif untuk peneliti dan institusi.',
      avatar: 'https://i.pravatar.cc/300?img=9',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      id: 4,
      name: 'Dr. James Park',
      role: 'Lead Data Scientist',
      bio: 'Spesialis machine learning dengan keahlian dalam analisis dan klasifikasi teks skala besar.',
      avatar: 'https://i.pravatar.cc/300?img=11',
      social: { linkedin: '#', github: '#' }
    }
  ];

  // Statistics Data
  const stats = [
    { value: '2.5M+', label: 'Publikasi Dianalisis', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { value: '500+', label: 'Institusi Mitra', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { value: '95%', label: 'Akurasi Klasifikasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: '150+', label: 'Negara Dilayani', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  // Values Data
  const values = [
    {
      id: 1,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Transparency',
      description: 'Kami percaya pada AI yang terbuka dan dapat dijelaskan yang dapat dipercaya dan dipahami oleh peneliti.'
    },
    {
      id: 2,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      title: 'Collaboration',
      description: 'Kami bekerja erat dengan komunitas penelitian untuk terus meningkatkan platform kami.'
    },
    {
      id: 3,
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      title: 'Sustainability',
      description: 'Kami berkomitmen pada tanggung jawab lingkungan dalam semua operasi dan keputusan kami.'
    },
    {
      id: 4,
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      title: 'Equity',
      description: 'Kami berupaya membuat alat kami dapat diakses oleh peneliti dan institusi di seluruh dunia.'
    }
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Tentang Kami</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tentang Sciecola</h1>
        </div>
        <p className="text-lg font-semibold text-gray-800 max-w-3xl">
          Memajukan Tujuan Pembangunan Berkelanjutan melalui analisis penelitian berbasis kecerdasan buatan.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Misi Kami</h2>
        </div>
        <p className="text-lg font-semibold text-gray-800 mb-8 leading-relaxed">
          Di Sciecola, kami percaya bahwa kecerdasan buatan dapat menjadi kekuatan kuat untuk perubahan positif di dunia. 
          Misi kami adalah mempercepat kemajuan menuju Tujuan Pembangunan Berkelanjutan Perserikatan Bangsa-Bangsa (SDGs) 
          dengan membuat dampak penelitian lebih terlihat, terukur, dan dapat ditindaklanjuti.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div key={mission.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mission.icon} />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{mission.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{mission.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Timeline */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Perjalanan Kami</h2>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-indigo-200 transform md:-translate-x-1/2"></div>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={item.year} className={`relative flex items-center gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white shadow transform md:-translate-x-1/2 z-10"></div>

                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-3">
                      {item.year}
                    </span>
                    <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Teknologi Kami</h2>
        </div>
        <p className="text-gray-700 mb-8 max-w-3xl">
          Sistem klasifikasi SDG kami menggabungkan beberapa pendekatan AI untuk memberikan analisis yang komprehensif dan akurat:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techFeatures.map((feature) => (
            <div key={feature.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-white shrink-0`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${feature.color} rounded-full transition-all duration-500`}
                        style={{ width: `${feature.weight}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">{feature.weight}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Tim Kami</h2>
        </div>
        <p className="text-gray-700 mb-8 max-w-3xl">
          Kami adalah tim beragam peneliti, insinyur, dan ahli domain yang berkomitmen untuk memberikan dampak positif.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="mb-4 relative inline-block">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-indigo-50 group-hover:border-indigo-100 transition-colors"
                />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{member.name}</h4>
              <p className="text-sm text-indigo-600 font-medium mb-3">{member.role}</p>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">{member.bio}</p>
              <div className="flex justify-center gap-2">
                {member.social.linkedin && (
                  <a href={member.social.linkedin} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {member.social.twitter && (
                  <a href={member.social.twitter} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                    </svg>
                  </a>
                )}
                {member.social.github && (
                  <a href={member.social.github} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
                {member.social.researchgate && (
                  <a href={member.social.researchgate} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3h18v-3h-3V2l-1.5 1.5zM7 17H4v-1h3v1zm0-3H4v-1h3v1zm0-3H4V8h3v3zm0-5H4V5h3v1zm10 9h-3v-1h3v1zm0-3h-3v-1h3v1zm0-3h-3V8h3v3zm0-5h-3V5h3v1z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dampak dalam Angka</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Nilai Kami</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value) => (
            <div key={value.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={value.icon} />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">{value.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Bergabunglah dengan Misi Kami
            </h2>
            <p className="text-indigo-100 max-w-xl">
              Siap untuk menemukan dampak SDG dari penelitian Anda? Mulailah hari ini atau pelajari lebih lanjut tentang solusi enterprise kami.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
            <Link 
              to="/"
              className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mulai Analisis
            </Link>
            <Link 
              to="/contact"
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-400 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Hubungi Kami
            </Link>
            <Link 
              to="/docs"
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-400 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;