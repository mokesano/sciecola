import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Doc = () => {
  const [activeSection, setActiveSection] = useState('wis');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const contentRef = useRef(null);

  // Documentation structure
  const sections = [
    {
      id: 'wis',
      title: 'Wizdam Impact Score',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      subsections: [
        { id: 'wis-overview', title: 'Overview & Formula' },
        { id: 'wis-pillars', title: '4 Pilar Komponen' }
      ]
    },
    {
      id: 'academic',
      title: 'Pilar Academic',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      subsections: [
        { id: 'academic-metrics', title: 'Metrik Academic' },
        { id: 'academic-formula', title: 'Formula Internal' }
      ]
    },
    {
      id: 'social',
      title: 'Pilar Social',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      subsections: [
        { id: 'social-fields', title: 'Field & Rentang' },
        { id: 'social-formula', title: 'Formula Perhitungan' }
      ]
    },
    {
      id: 'economic',
      title: 'Pilar Economic',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subsections: [
        { id: 'economic-fields', title: 'Field Economic' }
      ]
    },
    {
      id: 'sdg',
      title: 'Pilar SDG',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subsections: [
        { id: 'sdg-score', title: 'SDG Score Calculation' },
        { id: 'sdg-config', title: 'Konfigurasi Bobot SDG' },
        { id: 'sdg-list', title: '17 Tujuan SDG' }
      ]
    },
    {
      id: 'api',
      title: 'API Key & HMAC',
      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      subsections: [
        { id: 'api-format', title: 'Format API Key' },
        { id: 'api-validation', title: 'Validasi & TTL' },
        { id: 'api-example', title: 'Contoh Penggunaan' }
      ]
    },
    {
      id: 'data',
      title: 'Supplied Data Pattern',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      subsections: [
        { id: 'data-flow', title: 'Alur Data Supplied' },
        { id: 'data-caching', title: 'Caching Strategy' }
      ]
    },
    {
      id: 'batch',
      title: 'Batch Anti-Timeout',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      subsections: [
        { id: 'batch-pattern', title: 'Pola Batch Processing' },
        { id: 'batch-retry', title: 'Retry Logic' }
      ]
    },
    {
      id: 'crawler',
      title: 'WizdamCrawler',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      subsections: [
        { id: 'crawler-sources', title: 'Sumber Data & Prioritas' },
        { id: 'crawler-limits', title: 'Rate Limiting' }
      ]
    }
  ];

  // SDG color mapping
  const sdgColors = {
    1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
    5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
    9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
    13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A'
  };

  const sdgList = [
    { no: 1, code: 'SDG1', label: 'Tanpa Kemiskinan' },
    { no: 2, code: 'SDG2', label: 'Tanpa Kelaparan' },
    { no: 3, code: 'SDG3', label: 'Kehidupan Sehat dan Sejahtera' },
    { no: 4, code: 'SDG4', label: 'Pendidikan Berkualitas' },
    { no: 5, code: 'SDG5', label: 'Kesetaraan Gender' },
    { no: 6, code: 'SDG6', label: 'Air Bersih dan Sanitasi' },
    { no: 7, code: 'SDG7', label: 'Energi Bersih dan Terjangkau' },
    { no: 8, code: 'SDG8', label: 'Pekerjaan Layak dan Pertumbuhan Ekonomi' },
    { no: 9, code: 'SDG9', label: 'Industri, Inovasi, dan Infrastruktur' },
    { no: 10, code: 'SDG10', label: 'Berkurangnya Kesenjangan' },
    { no: 11, code: 'SDG11', label: 'Kota dan Komunitas Berkelanjutan' },
    { no: 12, code: 'SDG12', label: 'Konsumsi dan Produksi yang Bertanggung Jawab' },
    { no: 13, code: 'SDG13', label: 'Penanganan Perubahan Iklim' },
    { no: 14, code: 'SDG14', label: 'Ekosistem Lautan' },
    { no: 15, code: 'SDG15', label: 'Ekosistem Daratan' },
    { no: 16, code: 'SDG16', label: 'Perdamaian, Keadilan, dan Kelembagaan yang Tangguh' },
    { no: 17, code: 'SDG17', label: 'Kemitraan untuk Mencapai Tujuan' }
  ];

  // Code snippets for copy functionality
  const codeSnippets = {
    wisFormula: `WIS = (Academic × 40%) + (Social × 25%) + (Economic × 20%) + (SDG × 15%)`,
    academicFormula: `academic_raw = normalize(
  h_index       × 0.30 +
  citations_5y  × 0.35 +
  citation_vel  × 0.20 +
  i10_index     × 0.15
)
Academic = scale(academic_raw, 0, 100)`,
    apiKeyFormat: `wz_{user_id}_{unix_timestamp}_{hmac16}`,
    apiKeyValidation: `TTL = 365 hari sejak timestamp
Valid jika: timestamp + 365×86400 > now() AND HMAC cocok`,
    apiKeyExample: `wz_42_1717200000_a3f8c2e1b4d5f678`,
    suppliedData: `IF author_profiles_cache EXISTS FOR orcid:
    kirim supplied_works, supplied_person, supplied_scopus ke Sangia
    → Sangia skip external fetch
    → data_source = 'wizdam_scola_db'
ELSE:
    Sangia fetch dari ORCID/Scopus
    → simpan raw_data ke author_profiles_cache
    → data_source = 'orcid_api' / 'scopus_api'`,
    batchPattern: `offset = 0
LOOP:
    POST /api/v1/impact/calculate {orcid, offset, batch_size: 20}
    IF response.status == 'processing':
        offset = response.next_offset
        sleep(300ms)
        CONTINUE
    IF HTTP 410 (session expired):
        offset = 0
        retry (max 3x)
        CONTINUE
    IF response.status == 'success':
        RETURN result`
  };

  // Handle copy to clipboard
  const copyToClipboard = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId.split('-')[0]);
    }
    setIsSidebarOpen(false);
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-doc-section]');
      let current = 'wis';
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = section.id;
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subsections.some(sub =>
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : sections;

  // Code Block Component
  const CodeBlock = ({ code, id, language = 'plaintext' }) => (
    <div className="relative group my-4">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm overflow-x-auto border border-gray-700">
        <code className="font-mono">{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copiedCode === id ? (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Dokumentasi</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Formula, Bobot, dan Metodologi</h1>
        <p className="text-gray-600 max-w-3xl">
          Dokumentasi teknis lengkap mengenai perhitungan Wizdam Impact Score (WIS), klasifikasi SDG, 
          integrasi API, dan pola arsitektur sistem Wizdam Scola.
        </p>
      </div>

      {/* Search & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Cari dalam dokumentasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Navigasi
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className={`lg:col-span-1 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">Daftar Isi</h3>
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${activeSection === section.id ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon} />
                    </svg>
                    {section.title}
                  </button>
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => scrollToSection(sub.id)}
                      className={`w-full pl-10 pr-3 py-1.5 text-xs transition-colors text-left ${
                        activeSection === sub.id
                          ? 'text-indigo-600 font-medium'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg'
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <div className="lg:col-span-3" ref={contentRef}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8 space-y-12">
            
            {/* Wizdam Impact Score */}
            <section id="wis" data-doc-section className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Wizdam Impact Score (WIS)
              </h2>
              
              <p className="text-gray-700 mb-4">
                Wizdam Impact Score adalah skor komposit 0–100 yang mengukur dampak nyata seorang peneliti atau karya riset di empat dimensi:
              </p>
              
              <CodeBlock code={codeSnippets.wisFormula} id="wis-formula" language="formula" />
              
              <div id="wis-pillars" className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Komponen 4 Pilar</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Pilar</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Bobot Default</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Sumber Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Academic</td>
                        <td className="px-4 py-3 text-gray-700">40%</td>
                        <td className="px-4 py-3 text-gray-600">Sitasi, h-index, i10-index (ORCID + Scopus)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Social</td>
                        <td className="px-4 py-3 text-gray-700">25%</td>
                        <td className="px-4 py-3 text-gray-600">Media mentions, policy citations, public engagement</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Economic</td>
                        <td className="px-4 py-3 text-gray-700">20%</td>
                        <td className="px-4 py-3 text-gray-600">Adopsi industri, paten, kolaborasi industry</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">SDG</td>
                        <td className="px-4 py-3 text-gray-700">15%</td>
                        <td className="px-4 py-3 text-gray-600">Keterkaitan dengan 17 SDG PBB (oleh Sangia AI)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  <strong>Catatan:</strong> Bobot dapat dikonfigurasi melalui Admin Panel → Konfigurasi Bobot. 
                  Nilai disimpan di tabel <code className="bg-gray-100 px-1.5 py-0.5 rounded">analysis_weight_configs</code> (key: <code className="bg-gray-100 px-1.5 py-0.5 rounded">impact_composite</code>).
                </p>
              </div>
            </section>

            {/* Pilar Academic */}
            <section id="academic" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                Pilar Academic (Skor 0–100)
              </h2>
              
              <p className="text-gray-700 mb-4">Dihitung oleh Sangia API Engine berdasarkan:</p>
              
              <div id="academic-metrics" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Metrik Academic</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Metrik</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>h-index</strong></td>
                        <td className="px-4 py-3 text-gray-600">Jumlah h karya dengan minimal h sitasi</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>i10-index</strong></td>
                        <td className="px-4 py-3 text-gray-600">Jumlah karya dengan minimal 10 sitasi</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>total_citations</strong></td>
                        <td className="px-4 py-3 text-gray-600">Total sitasi dari semua karya</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>citation_velocity</strong></td>
                        <td className="px-4 py-3 text-gray-600">Kecepatan pertumbuhan sitasi (sitasi/tahun)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>recent_citations</strong></td>
                        <td className="px-4 py-3 text-gray-600">Bobot lebih tinggi untuk sitasi 5 tahun terakhir</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><strong>co-author_network</strong></td>
                        <td className="px-4 py-3 text-gray-600">Luas jaringan kolaborasi internasional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="academic-formula">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Formula Internal (Sangia)</h3>
                <CodeBlock code={codeSnippets.academicFormula} id="academic-formula-code" language="formula" />
              </div>
            </section>

            {/* Pilar Social */}
            <section id="social" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                Pilar Social (Skor 0–100)
              </h2>
              
              <p className="text-gray-700 mb-4">Dimasukkan secara manual atau via crawler untuk masing-masing peneliti:</p>
              
              <div id="social-fields" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Field & Rentang</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Field</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Rentang</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>media_mentions</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Penyebutan di media berita/blog</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>policy_citations</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Dikutip dalam dokumen kebijakan pemerintah</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>public_engagement</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Keterlibatan publik (seminar, podcast, dll.)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>social_media_impact</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Dampak di media sosial akademik (ResearchGate, Academia)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="social-formula">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Formula</h3>
                <CodeBlock 
                  code={`Social = (media_mentions × w1) + (policy_citations × w2) + (public_engagement × w3) + ...`} 
                  id="social-formula-code" 
                  language="formula" 
                />
                <p className="text-sm text-gray-600 mt-2">
                  Bobot <code className="bg-gray-100 px-1.5 py-0.5 rounded">w1..wN</code> dikonfigurasi via Sangia API dengan <code className="bg-gray-100 px-1.5 py-0.5 rounded">WeightConfigService</code>.
                </p>
              </div>
            </section>

            {/* Pilar Economic */}
            <section id="economic" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Pilar Economic (Skor 0–100)
              </h2>
              
              <div id="economic-fields">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Field Economic</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Field</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Rentang</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>industry_adoption</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Adopsi hasil riset oleh industri</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>patents</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Paten yang mengutip atau berbasis karya peneliti</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>startup_founded</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Startup yang lahir dari riset</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>tech_transfer</code></td>
                        <td className="px-4 py-3 text-gray-700">0–100</td>
                        <td className="px-4 py-3 text-gray-600">Transfer teknologi ke mitra industri</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Pilar SDG */}
            <section id="sdg" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Pilar SDG (Skor 0–100)
              </h2>
              
              <p className="text-gray-700 mb-4">
                SDG score dihitung dari derajat keterkaitan seluruh karya peneliti dengan 17 Tujuan Pembangunan Berkelanjutan PBB.
              </p>
              
              <div id="sdg-score" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">SDG Score Calculation</h3>
                <CodeBlock 
                  code={`SDG_score = mean(confidence_score_per_sdg × relevance_weight)`} 
                  id="sdg-formula" 
                  language="formula" 
                />
              </div>

              <div id="sdg-config" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Konfigurasi Bobot SDG Scoring (key: <code>sdg_v5</code>)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Parameter</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Default</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>keyword</code></td>
                        <td className="px-4 py-3 text-gray-700">0.30</td>
                        <td className="px-4 py-3 text-gray-600">Bobot pencocokan kata kunci SDG</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>similarity</code></td>
                        <td className="px-4 py-3 text-gray-700">0.30</td>
                        <td className="px-4 py-3 text-gray-600">Bobot kesamaan semantik (embedding)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>substantive</code></td>
                        <td className="px-4 py-3 text-gray-700">0.20</td>
                        <td className="px-4 py-3 text-gray-600">Bobot analisis substantif konteks</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>causal</code></td>
                        <td className="px-4 py-3 text-gray-700">0.20</td>
                        <td className="px-4 py-3 text-gray-600">Bobot hubungan kausal dengan SDG</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>max_sdgs</code></td>
                        <td className="px-4 py-3 text-gray-700">7</td>
                        <td className="px-4 py-3 text-gray-600">Maksimum jumlah SDG yang diatribusikan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>threshold.min</code></td>
                        <td className="px-4 py-3 text-gray-700">0.20</td>
                        <td className="px-4 py-3 text-gray-600">Skor minimum untuk dikategorikan relevan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>threshold.confidence</code></td>
                        <td className="px-4 py-3 text-gray-700">0.30</td>
                        <td className="px-4 py-3 text-gray-600">Skor minimum untuk ditampilkan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900"><code>threshold.high</code></td>
                        <td className="px-4 py-3 text-gray-700">0.60</td>
                        <td className="px-4 py-3 text-gray-600">Skor untuk label "Sangat Relevan"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="sdg-list">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">17 Tujuan SDG</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sdgList.map((sdg) => (
                    <div key={sdg.no} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: sdgColors[sdg.no] }}
                      >
                        {sdg.no}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{sdg.code}</p>
                        <p className="text-xs text-gray-600">{sdg.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* API Key & HMAC */}
            <section id="api" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                API Key — Format HMAC
              </h2>
              
              <p className="text-gray-700 mb-4">
                API Key yang digenerate untuk pengguna mengikuti format:
              </p>
              
              <div id="api-format">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Format API Key</h3>
                <CodeBlock code={codeSnippets.apiKeyFormat} id="api-key-format" language="plaintext" />
              </div>

              <div id="api-validation" className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Validasi</h3>
                <CodeBlock code={codeSnippets.apiKeyValidation} id="api-key-validation" language="plaintext" />
              </div>

              <div id="api-example">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contoh</h3>
                <CodeBlock code={codeSnippets.apiKeyExample} id="api-key-example" language="plaintext" />
                <p className="text-sm text-gray-600 mt-2">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded">WIZDAM_SHARED_SECRET</code> harus sama antara wizdam-scola dan wizdam-apis untuk validasi silang.
                </p>
              </div>
            </section>

            {/* Supplied Data Pattern */}
            <section id="data" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </span>
                Supplied Data Pattern
              </h2>
              
              <p className="text-gray-700 mb-4">
                Untuk menghemat kuota API dan mengurangi latensi, Wizdam Scola mengirimkan data yang sudah ada di database ke Sangia API (<code className="bg-gray-100 px-1.5 py-0.5 rounded">supplied_data</code>), sehingga Sangia tidak perlu fetch ulang dari ORCID/Scopus.
              </p>
              
              <div id="data-flow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Alur Data Supplied</h3>
                <CodeBlock code={codeSnippets.suppliedData} id="supplied-data-code" language="pseudocode" />
              </div>
            </section>

            {/* Batch Anti-Timeout Pattern */}
            <section id="batch" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                Batch Anti-Timeout Pattern
              </h2>
              
              <p className="text-gray-700 mb-4">
                Untuk perhitungan yang panjang (banyak karya), Sangia API menggunakan pola batch:
              </p>
              
              <div id="batch-pattern">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Pola Batch Processing</h3>
                <CodeBlock code={codeSnippets.batchPattern} id="batch-pattern-code" language="pseudocode" />
              </div>

              <div id="batch-retry">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Retry Logic</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Retry maksimal 3x jika HTTP 410 (session expired)</li>
                  <li>Reset <code className="bg-gray-100 px-1.5 py-0.5 rounded">offset = 0</code> sebelum retry</li>
                  <li>Sleep 300ms antar request untuk menghindari rate limiting</li>
                </ul>
              </div>
            </section>

            {/* WizdamCrawler */}
            <section id="crawler" data-doc-section className="scroll-mt-24 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                WizdamCrawler — Prioritas dan Rate Limit
              </h2>
              
              <div id="crawler-sources">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sumber Data & Prioritas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Sumber</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Rate Limit</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Delay</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Google Scholar</td>
                        <td className="px-4 py-3 text-gray-700">Tidak ada API resmi</td>
                        <td className="px-4 py-3 text-gray-700">3–5 detik</td>
                        <td className="px-4 py-3 text-gray-600">CAPTCHA kemungkinan muncul</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">ResearchGate</td>
                        <td className="px-4 py-3 text-gray-700">Tidak ada API resmi</td>
                        <td className="px-4 py-3 text-gray-700">3 detik</td>
                        <td className="px-4 py-3 text-gray-600">JavaScript-heavy</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Crossref</td>
                        <td className="px-4 py-3 text-gray-700">50 req/detik (tanpa key)</td>
                        <td className="px-4 py-3 text-gray-700">1 detik</td>
                        <td className="px-4 py-3 text-gray-600 text-green-700 font-medium">✓ Direkomendasikan</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Semantic Scholar</td>
                        <td className="px-4 py-3 text-gray-700">100 req/5 menit</td>
                        <td className="px-4 py-3 text-gray-700">1 detik</td>
                        <td className="px-4 py-3 text-gray-600">Gunakan API key untuk lebih banyak</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">OpenCitations</td>
                        <td className="px-4 py-3 text-gray-700">Tidak dibatasi</td>
                        <td className="px-4 py-3 text-gray-700">1 detik</td>
                        <td className="px-4 py-3 text-gray-600">Gratis dan publik</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Scimago</td>
                        <td className="px-4 py-3 text-gray-700">Tidak ada API resmi</td>
                        <td className="px-4 py-3 text-gray-700">2 detik</td>
                        <td className="px-4 py-3 text-gray-600">Data terbuka</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">SINTA</td>
                        <td className="px-4 py-3 text-gray-700">Tidak ada API resmi</td>
                        <td className="px-4 py-3 text-gray-700">3 detik</td>
                        <td className="px-4 py-3 text-gray-600">Gunakan via Sangia API</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Footer CTA */}
            <div className="pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Butuh klarifikasi lebih lanjut?</h3>
                    <p className="text-indigo-100 text-sm">Hubungi tim engineering kami untuk diskusi teknis mendalam.</p>
                  </div>
                  <div className="flex gap-3">
                    <Link to="/contact" className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap">
                      Hubungi Tim
                    </Link>
                    <a href="/docs/api-reference" className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors text-sm whitespace-nowrap">
                      API Reference
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Doc;