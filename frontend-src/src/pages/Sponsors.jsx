import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sponsors = () => {
  const [activeTier, setActiveTier] = useState('all');

  // Sponsor Tiers Configuration
  const tiers = [
    { id: 'all', label: 'Semua', count: 24 },
    { id: 'platinum', label: 'Platinum', count: 3, color: 'bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 text-gray-800 border-gray-400' },
    { id: 'gold', label: 'Gold', count: 6, color: 'bg-gradient-to-r from-yellow-200 via-yellow-50 to-yellow-200 text-yellow-800 border-yellow-400' },
    { id: 'silver', label: 'Silver', count: 8, color: 'bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 text-gray-700 border-gray-300' },
    { id: 'bronze', label: 'Bronze', count: 7, color: 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 text-amber-800 border-amber-300' }
  ];

  // Sponsor Data
  const sponsors = [
    {
      id: 1,
      name: "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi",
      tier: 'platinum',
      logo: "https://via.placeholder.com/200x80/fbbf24/ffffff?text=Kemdikbudristek",
      description: "Mendukung digitalisasi riset Indonesia dan akselerasi pencapaian SDGs melalui inovasi teknologi.",
      since: "2021",
      focus: ["Education", "Research", "SDG 4", "SDG 9"],
      website: "https://www.kemdikbud.go.id",
      type: 'Government'
    },
    {
      id: 2,
      name: "Badan Riset dan Inovasi Nasional (BRIN)",
      tier: 'platinum',
      logo: "https://via.placeholder.com/200x80/6366f1/ffffff?text=BRIN",
      description: "Memperkuat ekosistem riset nasional melalui platform analitik berbasis kecerdasan buatan.",
      since: "2022",
      focus: ["Innovation", "AI Research", "SDG 9", "SDG 17"],
      website: "https://www.brin.go.id",
      type: 'Government'
    },
    {
      id: 3,
      name: "Google.org",
      tier: 'platinum',
      logo: "https://via.placeholder.com/200x80/4285f4/ffffff?text=Google.org",
      description: "Mendukung inisiatif teknologi untuk kebaikan sosial dan pembangunan berkelanjutan di Asia Tenggara.",
      since: "2023",
      focus: ["Technology", "AI for Good", "SDG 17"],
      website: "https://www.google.org",
      type: 'Corporate'
    },
    {
      id: 4,
      name: "Universitas Indonesia",
      tier: 'gold',
      logo: "https://via.placeholder.com/200x80/fbbf24/ffffff?text=UI",
      description: "Kontributor utama dalam pengembangan metodologi Wizdam Impact Score dan validasi akademik.",
      since: "2021",
      focus: ["Academic Research", "SDG Classification", "SDG 4"],
      website: "https://www.ui.ac.id",
      type: 'Academic'
    },
    {
      id: 5,
      name: "Institut Teknologi Bandung",
      tier: 'gold',
      logo: "https://via.placeholder.com/200x80/10b981/ffffff?text=ITB",
      description: "Mitra strategis dalam pengembangan algoritma klasifikasi SDG dan analisis tren riset.",
      since: "2022",
      focus: ["Engineering", "Data Science", "SDG 9", "SDG 13"],
      website: "https://www.itb.ac.id",
      type: 'Academic'
    },
    {
      id: 6,
      name: "ASEAN Centre for Biodiversity",
      tier: 'gold',
      logo: "https://via.placeholder.com/200x80/22c55e/ffffff?text=ACB",
      description: "Mendukung integrasi data biodiversitas regional ke dalam platform analisis SDGs.",
      since: "2023",
      focus: ["Biodiversity", "Regional Collaboration", "SDG 14", "SDG 15"],
      website: "https://www.aseanbiodiversity.org",
      type: 'NGO'
    },
    {
      id: 7,
      name: "PT Telkom Indonesia",
      tier: 'silver',
      logo: "https://via.placeholder.com/200x80/e11d48/ffffff?text=Telkom",
      description: "Penyedia infrastruktur cloud dan dukungan teknis untuk skalabilitas platform.",
      since: "2022",
      focus: ["Infrastructure", "Cloud Services", "SDG 9"],
      website: "https://www.telkom.co.id",
      type: 'Corporate'
    },
    {
      id: 8,
      name: "UNDP Indonesia",
      tier: 'silver',
      logo: "https://via.placeholder.com/200x80/0ea5e9/ffffff?text=UNDP",
      description: "Mitra dalam penyelarasan indikator SDGs dan validasi metodologi impact measurement.",
      since: "2023",
      focus: ["SDG Framework", "Policy Alignment", "SDG 17"],
      website: "https://www.undp.org/indonesia",
      type: 'International'
    },
    {
      id: 9,
      name: "PT Pertamina",
      tier: 'silver',
      logo: "https://via.placeholder.com/200x80/dc2626/ffffff?text=Pertamina",
      description: "Dukungan riset transisi energi dan kontribusi terhadap SDG 7 dan SDG 13.",
      since: "2023",
      focus: ["Energy Transition", "Sustainability", "SDG 7", "SDG 13"],
      website: "https://www.pertamina.com",
      type: 'Corporate'
    },
    {
      id: 10,
      name: "Universitas Gadjah Mada",
      tier: 'silver',
      logo: "https://via.placeholder.com/200x80/7c3aed/ffffff?text=UGM",
      description: "Kolaborasi dalam pengembangan modul analisis sosial-ekonomi untuk Wizdam Impact Score.",
      since: "2022",
      focus: ["Social Science", "Economic Impact", "SDG 1", "SDG 8"],
      website: "https://www.ugm.ac.id",
      type: 'Academic'
    },
    {
      id: 11,
      name: "WWF Indonesia",
      tier: 'bronze',
      logo: "https://via.placeholder.com/200x80/000000/ffffff?text=WWF",
      description: "Kontribusi data konservasi dan validasi indikator SDG 14 & 15.",
      since: "2023",
      focus: ["Conservation", "Environmental Data", "SDG 14", "SDG 15"],
      website: "https://www.wwf.or.id",
      type: 'NGO'
    },
    {
      id: 12,
      name: "Bank Mandiri",
      tier: 'bronze',
      logo: "https://via.placeholder.com/200x80/0066cc/ffffff?text=Mandiri",
      description: "Dukungan finansial dan integrasi data impact investing untuk SDGs.",
      since: "2024",
      focus: ["Impact Investing", "Financial Inclusion", "SDG 1", "SDG 8"],
      website: "https://www.bankmandiri.co.id",
      type: 'Corporate'
    }
  ];

  // Benefits Data
  const benefits = [
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Visibilitas Global',
      description: 'Logo dan profil sponsor ditampilkan di platform yang diakses peneliti dari 150+ negara.'
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Credibility & Trust',
      description: 'Asosiasi dengan platform terverifikasi yang digunakan oleh institusi riset terkemuka.'
    },
    {
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      title: 'Akses Data Eksklusif',
      description: 'Dashboard analitik khusus sponsor dengan insights tren riset dan dampak SDGs.'
    },
    {
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Co-Branding Opportunities',
      description: 'Kesempatan kolaborasi konten, webinar, dan publikasi bersama tim editorial Wizdam.'
    },
    {
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Impact Reporting',
      description: 'Laporan triwulanan terukur tentang kontribusi sponsor terhadap pencapaian SDGs.'
    },
    {
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      title: 'Priority Support',
      description: 'Tim dedicated account manager dan prioritas dalam pengembangan fitur custom.'
    }
  ];

  // Filter sponsors based on active tier
  const filteredSponsors = activeTier === 'all' 
    ? sponsors 
    : sponsors.filter(s => s.tier === activeTier);

  // Get tier color class
  const getTierBadgeClass = (tier) => {
    const colors = {
      platinum: 'bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 text-gray-800 border-gray-400',
      gold: 'bg-gradient-to-r from-yellow-200 via-yellow-50 to-yellow-200 text-yellow-800 border-yellow-400',
      silver: 'bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 text-gray-700 border-gray-300',
      bronze: 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tier] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Sponsor</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Mitra & Sponsor Wizdam
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Bersama para mitra strategis, kami mempercepat dampak riset Indonesia terhadap pencapaian 
          Tujuan Pembangunan Berkelanjutan (SDGs) global.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Sponsor', value: '24', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Negara Terwakili', value: '12', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Sektor', value: '5', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { label: 'Tahun Bermitra', value: '3+', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setActiveTier(tier.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTier === tier.id
                ? `${tier.color || 'bg-indigo-600 text-white'} shadow-md border`
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tier.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTier === tier.id 
                ? 'bg-white/30' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tier.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredSponsors.map((sponsor) => (
          <div 
            key={sponsor.id} 
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all overflow-hidden group ${
              activeTier !== 'all' ? `border-l-4 ${getTierBadgeClass(sponsor.tier).split(' ').pop()}` : 'border-gray-200'
            }`}
          >
            {/* Tier Badge */}
            {activeTier === 'all' && (
              <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-b ${getTierBadgeClass(sponsor.tier)}`}>
                {sponsor.tier}
              </div>
            )}
            
            <div className="p-6">
              {/* Logo */}
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={sponsor.logo} 
                  alt={sponsor.name}
                  className="h-16 object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              
              {/* Name & Type */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{sponsor.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {sponsor.type}
                  </span>
                  <span className="text-xs text-gray-500">Sejak {sponsor.since}</span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
                {sponsor.description}
              </p>
              
              {/* Focus Tags */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {sponsor.focus.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Website Link */}
              <a 
                href={sponsor.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
              >
                Kunjungi Website
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits Section */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Manfaat Menjadi Sponsor</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bergabunglah dengan ekosistem riset berkelanjutan dan tingkatkan dampak organisasi Anda.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={benefit.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsorship Tiers Info */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiers Sponsorship</h2>
            <p className="text-gray-600">Pilih tingkat kemitraan yang sesuai dengan visi organisasi Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { tier: 'Platinum', price: 'Custom', features: ['Logo di header platform', 'Dashboard analitik premium', 'Co-branding webinar', 'Priority feature requests', 'Dedicated account manager'], highlight: true },
              { tier: 'Gold', price: 'Custom', features: ['Logo di halaman sponsor', 'Akses dashboard dasar', 'Mention di newsletter', 'Quarterly impact report'], highlight: false },
              { tier: 'Silver', price: 'Custom', features: ['Logo di halaman sponsor', 'Mention di laporan tahunan', 'Akses publikasi riset'], highlight: false },
              { tier: 'Bronze', price: 'Custom', features: ['Logo di halaman sponsor', 'Sertifikat kemitraan', 'Update newsletter bulanan'], highlight: false }
            ].map((plan, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-xl p-6 border-2 ${
                  plan.highlight 
                    ? 'border-indigo-600 shadow-lg relative' 
                    : 'border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {plan.tier}
                </h3>
                <p className="text-2xl font-bold text-gray-900 mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  Hubungi Kami
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Tertarik Menjadi Sponsor?</h3>
            <p className="text-indigo-100">Mari diskusikan bagaimana kemitraan ini dapat memperkuat dampak riset dan kontribusi SDGs Anda.</p>
          </div>
          <Link 
            to="/contact"
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            Ajukan Proposal Kemitraan
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Sponsors;