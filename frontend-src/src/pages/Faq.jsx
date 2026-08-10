import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';

const Faq = () => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaqs, setOpenFaqs] = useState({});
  const [sortBy, setSortBy] = useState('relevance');

  // FAQ Data Structure
  const faqData = {
    umum: {
      title: 'Umum',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-indigo-500',
      items: [
        {
          id: 'faq-umum-1',
          question: 'Apa itu Sciecola?',
          answer: 'Platform analisis dampak penelitian Indonesia yang mengukur kontribusi peneliti, artikel, institusi, dan jurnal menggunakan Sangia Impact Score (Scieco) — skor komposit dari 4 pilar: Akademik, Sosial, Ekonomi, dan SDG.'
        },
        {
          id: 'faq-umum-2',
          question: 'Apa itu Sciecola AI Engine?',
          answer: 'Sciecola AI Engine adalah backend analitik AI (`api.sangia.org`) yang melakukan kalkulasi berat: SDG classification, impact score, trend analysis, dan policy recommendation. Sciecola tidak menyimpan data — semua persistensi dilakukan oleh Sciecola. Sciecola Engine dikelola terpisah di repository `sciecola-apis`.'
        },
        {
          id: 'faq-umum-3',
          question: 'Mengapa ada dua server (PHP port 8000 dan Node port 3000)?',
          answer: 'Saat development, PHP melayani halaman Twig dan REST API, sementara Vite dev server melayani React frontend dengan Hot Module Replacement (HMR). Di production, hanya PHP yang berjalan — React di-build menjadi file statis di `public/app/`.'
        }
      ]
    },
    autentikasi: {
      title: 'Autentikasi',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      color: 'bg-emerald-500',
      items: [
        {
          id: 'faq-auth-1',
          question: 'Mengapa login hanya via ORCID?',
          answer: 'ORCID adalah identitas peneliti terverifikasi internasional. Login via ORCID memastikan hanya peneliti nyata yang bisa mengklaim profil mereka di platform.'
        },
        {
          id: 'faq-auth-2',
          question: 'Bagaimana jika saya belum punya ORCID?',
          answer: 'Daftar gratis di orcid.org. ORCID ID adalah standar identifikasi peneliti global yang diakui lebih dari 1.000 lembaga riset.'
        },
        {
          id: 'faq-auth-3',
          question: 'Apakah admin bisa login tanpa ORCID?',
          answer: 'Tidak. Semua akun menggunakan ORCID. Role admin ditetapkan di database (`users.role = \'admin\'`) setelah akun dibuat pertama kali.'
        }
      ]
    },
    apikey: {
      title: 'API Key',
      icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
      color: 'bg-purple-500',
      items: [
        {
          id: 'faq-api-1',
          question: 'Untuk apa API Key?',
          answer: 'API Key digunakan untuk memanggil Sangia API Engine secara langsung dari aplikasi lain atau skrip analitik. Format key: `wz_{user_id}_{timestamp}_{hmac16}`.'
        },
        {
          id: 'faq-api-2',
          question: 'Berapa lama API Key berlaku?',
          answer: '365 hari sejak dibuat. Setelah expired, generate key baru melalui Dashboard → Manajemen API Key.'
        },
        {
          id: 'faq-api-3',
          question: 'Bagaimana jika API Key saya bocor?',
          answer: 'Segera klik "Cabut API Key" di Dashboard. Key akan langsung di-blacklist di Sangia API Engine dan di-null-kan di database.'
        },
        {
          id: 'faq-api-4',
          question: 'Kenapa SANGIA_SHARED_SECRET harus sama antara Sciecola dan APIs?',
          answer: 'Sangia API memvalidasi HMAC key secara lokal tanpa roundtrip ke database. Agar validasi berhasil di kedua sisi, secret harus identik.'
        }
      ]
    },
    scieco: {
      title: 'Sangia Impact Score',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'bg-amber-500',
      items: [
        {
          id: 'faq-wis-1',
          question: 'Apakah skor Scieco bisa berubah?',
          answer: 'Ya. Skor direkam setiap kalkulasi (tidak di-update, melainkan di-insert baru). History skor tersimpan untuk grafik tren. Pemicunya bisa manual (tombol "Hitung Ulang") atau otomatis via job queue.'
        },
        {
          id: 'faq-wis-2',
          question: 'Mengapa skor saya lebih rendah dari yang diharapkan?',
          answer: 'Beberapa kemungkinan:\n• Data sitasi belum ter-update di Scopus/ORCID (tunggu 24–48 jam)\n• Pilar Social dan Economic membutuhkan input manual yang belum diisi\n• Karya di luar ORCID tidak terhitung (tambahkan karya di profil ORCID Anda)'
        },
        {
          id: 'faq-wis-3',
          question: 'Bisakah saya mengubah bobot 4 pilar?',
          answer: 'Ya, melalui Admin Panel → Konfigurasi Bobot. Perubahan tersimpan di `analysis_weight_configs` dan langsung diterapkan pada kalkulasi berikutnya.'
        },
        {
          id: 'faq-wis-4',
          question: 'Apakah Scieco sama dengan h-index?',
          answer: 'Tidak. h-index hanya mengukur dampak akademik (sitasi). Scieco mengukur 4 dimensi: akademik, sosial, ekonomi, dan kontribusi terhadap SDG. Seorang peneliti bisa punya h-index rendah tapi Scieco tinggi jika risetnya berdampak sosial-ekonomi besar.'
        }
      ]
    },
    sdg: {
      title: 'SDG Classification',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-green-500',
      items: [
        {
          id: 'faq-sdg-1',
          question: 'Bagaimana cara kerja klasifikasi SDG?',
          answer: 'Sangia menganalisis judul dan abstrak artikel menggunakan 4 pendekatan:\n1. Pencocokan kata kunci SDG (bobot 30%)\n2. Kesamaan semantik dengan embedding SDG (30%)\n3. Analisis substantif konteks (20%)\n4. Hubungan kausal dengan target SDG (20%)'
        },
        {
          id: 'faq-sdg-2',
          question: 'Berapa maksimum SDG yang bisa diatribusikan ke satu artikel?',
          answer: 'Default 7 SDG. Nilai ini dapat dikonfigurasi oleh admin melalui bobot `sdg_v5.max_sdgs`.'
        },
        {
          id: 'faq-sdg-3',
          question: 'Apakah SDG v5 berbeda dengan versi sebelumnya?',
          answer: 'Ya. Sangia mendukung beberapa versi model SDG (v4, v5). v5 menggunakan model embedding yang lebih baru dengan akurasi lebih tinggi pada teks berbahasa Indonesia.'
        }
      ]
    },
    database: {
      title: 'Database & Migrasi',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      color: 'bg-blue-500',
      items: [
        {
          id: 'faq-db-1',
          question: 'Apa perbedaan `database_schema_full.sql` dan `database_migration_v2.sql`?',
          answer: '• `database_schema_full.sql` — skema lengkap dari awal (buat dari nol)\n• `database_migration_v2.sql` — tambahan tabel untuk integrasi Sangia API v2 (cache, weight configs, API logs). Jalankan setelah schema_full.'
        },
        {
          id: 'faq-db-2',
          question: 'Apakah aman menjalankan `database_migration_v2.sql` berulang kali?',
          answer: 'Ya. Semua pernyataan menggunakan `CREATE TABLE IF NOT EXISTS` dan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, jadi aman dijalankan ulang.'
        }
      ]
    },
    frontend: {
      title: 'Frontend React',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      color: 'bg-cyan-500',
      items: [
        {
          id: 'faq-fe-1',
          question: 'Mengapa menggunakan Vite bukan Create React App (CRA)?',
          answer: 'Vite jauh lebih cepat: HMR (hot reload) hampir instan vs 10–30 detik di CRA. Build produksi juga lebih kecil karena menggunakan Rollup dengan tree-shaking agresif.'
        },
        {
          id: 'faq-fe-2',
          question: 'Apa itu `window.__SANGIA_INIT__`?',
          answer: 'Objek yang diinjeksi oleh PHP ke halaman sebelum React dimuat, berisi:\n• apiUrl: "/api/v1" — URL API backend\n• currentUser: { id, full_name } — Data user yang sedang login\n• csrfToken: "abc123..." — Token CSRF untuk request POST\n• appPath: "/app" — Base path React Router\n\nReact membaca objek ini via `window.__SANGIA_INIT__` saat startup.'
        },
        {
          id: 'faq-fe-3',
          question: 'Kenapa `/app/researchers/123` kadang 404 saat refresh?',
          answer: 'Ini adalah SPA (Single Page Application) — routing dilakukan di sisi client. Saat hard refresh, browser meminta `/app/researchers/123` ke PHP. Konfigurasi route `/app/{path:.+}` (catch-all dengan regex `.+`) memastikan PHP selalu mengembalikan React shell, lalu React Router menangani navigasi.'
        },
        {
          id: 'faq-fe-4',
          question: 'Bagaimana cara ganti bahasa antarmuka?',
          answer: 'Secara default, bahasa terdeteksi dari browser. Untuk ganti secara paksa:\n\n```js\nimport i18n from \'./i18n\';\ni18n.changeLanguage(\'en\'); // atau \'id\'\n```\n\nPreferensi disimpan di `localStorage`.'
        }
      ]
    },
    crawler: {
      title: 'SciecolaBot Crawler',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      color: 'bg-pink-500',
      items: [
        {
          id: 'faq-crawl-1',
          question: 'Apakah SciecolaBot aman digunakan?',
          answer: 'Ya, dengan catatan:\n• Mematuhi `robots.txt` secara otomatis\n• Rate limiting default 2 detik antar request\n• Berhenti otomatis jika CAPTCHA terdeteksi\n• Tidak menyimpan data pribadi'
        },
        {
          id: 'faq-crawl-2',
          question: 'Mengapa tidak semua data dari Google Scholar tersedia?',
          answer: 'Google Scholar tidak memiliki API publik resmi dan aktif memblokir scraping. SciecolaBot mencoba best-effort; jika CAPTCHA terdeteksi, proses dihentikan dan fallback ke data dari API resmi (Crossref, Semantic Scholar).'
        },
        {
          id: 'faq-crawl-3',
          question: 'Data apa yang diprioritaskan untuk di-crawl?',
          answer: 'Urutan prioritas: API resmi (Crossref, Semantic Scholar, OpenCitations) → Sangia API cache → Crawl web (Scholar, ResearchGate, Scimago). API resmi selalu lebih andal dan lebih cepat.'
        }
      ]
    },
    deployment: {
      title: 'Deployment',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      color: 'bg-orange-500',
      items: [
        {
          id: 'faq-deploy-1',
          question: 'Bagaimana cara deploy ke production?',
          answer: '1. Set `APP_ENV=production` dan `APP_DEBUG=false` di `.env`\n2. Jalankan `npm run build` → output ke `public/app/`\n3. Set `TWIG_CACHE=true` untuk performa\n4. Gunakan Nginx/Apache dengan konfigurasi di `docs/INSTALLATION.md`\n5. Set `ORCID_SANDBOX=false` untuk ORCID production'
        },
        {
          id: 'faq-deploy-2',
          question: 'Apakah Redis wajib?',
          answer: 'Tidak wajib. Redis digunakan untuk queue job background (`QUEUE_DRIVER=redis`). Jika tidak tersedia, set `QUEUE_DRIVER=database` — job disimpan di tabel MySQL.'
        },
        {
          id: 'faq-deploy-3',
          question: 'Bagaimana cara update aplikasi?',
          answer: '```bash\ngit pull origin main\ncomposer install --optimize-autoloader\nnpm install && npm run build\n# Jalankan migration baru jika ada:\nmysql -u root -p sciecola < database_migration_vX.sql\n```'
        }
      ]
    }
  };

  // Summary stats
  const summaryStats = [
    { label: 'Total Pertanyaan', value: 32, icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Kategori', value: Object.keys(faqData).length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'text-purple-600 bg-purple-50' },
    { label: 'Terupdate', value: 'Hari Ini', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600 bg-green-50' }
  ];

  // Filter categories
  const categories = [
    { id: 'all', label: 'Semua', count: Object.values(faqData).reduce((acc, cat) => acc + cat.items.length, 0) }
  ].concat(
    Object.entries(faqData).map(([key, val]) => ({
      id: key,
      label: val.title,
      count: val.items.length,
      icon: val.icon,
      color: val.color
    }))
  );

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    let result = {};
    
    if (activeCategory === 'all') {
      result = faqData;
    } else if (faqData[activeCategory]) {
      result = { [activeCategory]: faqData[activeCategory] };
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = {};
      
      Object.entries(result).forEach(([key, category]) => {
        const matchedItems = category.items.filter(item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
        );
        if (matchedItems.length > 0) {
          filtered[key] = { ...category, items: matchedItems };
        }
      });
      return filtered;
    }
    
    return result;
  }, [searchQuery, activeCategory]);

  // Toggle FAQ accordion
  const toggleFaq = (faqId) => {
    setOpenFaqs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Format answer with line breaks and code blocks
  const formatAnswer = (text) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).trim();
        return (
          <pre key={idx} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-3">
            <code>{code}</code>
          </pre>
        );
      }
      // Regular text with line breaks and bullet points
      const lines = part.split('\n');
      return (
        <div key={idx} className="space-y-2">
          {lines.map((line, lineIdx) => {
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
              return (
                <div key={lineIdx} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-indigo-600">•</span>
                  <span>{line.replace(/^[\s•-]+/, '')}</span>
                </div>
              );
            }
            if (line.trim().match(/^\d+\./)) {
              return (
                <div key={lineIdx} className="flex gap-2 text-m text-gray-700">
                  <span className="text-indigo-600 font-medium">{line.match(/^\d+\./)[0]}</span>
                  <span>{line.replace(/^\d+\.\s*/, '')}</span>
                </div>
              );
            }
            return line.trim() ? <p key={lineIdx} className="text-m text-gray-700">{line}</p> : null;
          })}
        </div>
      );
    });
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/docs" className="hover:text-indigo-600 transition-colors">Documentations</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">FAQ</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pertanyaan yang Sering Diajukan</h1>
        <p className="text-gray-600 max-w-3xl">
          Temukan jawaban untuk pertanyaan umum seputar Sciecola, Sangia AI Engine, API, dan deployment. 
          Jika tidak menemukan jawaban, hubungi tim dukungan kami.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center shrink-0`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-m text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Category Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <input
            type="text"
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon && activeCategory === cat.id && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cat.icon} />
                </svg>
              )}
              {cat.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeCategory === cat.id ? 'bg-indigo-500' : 'bg-gray-200'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Categories */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">Kategori</h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    activeCategory === cat.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {cat.icon && (
                      <svg className={`w-4 h-4 ${activeCategory === cat.id ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cat.icon} />
                      </svg>
                    )}
                    {cat.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeCategory === cat.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* FAQ Content */}
        <div className="lg:col-span-3 space-y-8">
          {Object.entries(filteredFaqs).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada hasil ditemukan</h3>
              <p className="text-gray-600 text-sm mb-4">Coba kata kunci lain atau pilih kategori berbeda.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            Object.entries(filteredFaqs).map(([key, category]) => (
              <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Category Header */}
                <div className={`px-6 py-4 ${category.color} text-white`}>
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={category.icon} />
                    </svg>
                    <h2 className="text-lg font-bold">{category.title}</h2>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                      {category.items.length} pertanyaan
                    </span>
                  </div>
                </div>

                {/* FAQ Items */}
                <div className="divide-y divide-gray-100">
                  {category.items.map((faq) => (
                    <div key={faq.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-start justify-between gap-4 text-left"
                      >
                        <span className="font-medium font-semibold text-gray-900 pr-4">{faq.question}</span>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${openFaqs[faq.id] ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {openFaqs[faq.id] && (
                        <div className="mt-4 pt-4 mb-4 border-t border-gray-100">
                          <div className="text-gray-700 leading-relaxed">
                            {formatAnswer(faq.answer)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Still Need Help */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Masih butuh bantuan?</h3>
                <p className="text-indigo-100 text-m">Tim dukungan kami siap membantu Anda 24/7.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/contact" className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-m whitespace-nowrap">
                  Hubungi Kami
                </Link>
                <Link to="/docs" className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors text-m whitespace-nowrap">
                  Dokumentasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Faq;