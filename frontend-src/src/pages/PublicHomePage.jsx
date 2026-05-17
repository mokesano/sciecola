import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, BarChart2, Users, Globe, Zap, BookOpen,
  ArrowRight, CheckCircle, Star, ChevronRight,
  FlaskConical, Building2, FileText, Target, Brain, Handshake
} from 'lucide-react';

// =====================================================================
// DATA
// =====================================================================

const SDG_LIST = [
  { id: 1, name: 'No Poverty', color: '#E5243B' },
  { id: 2, name: 'Zero Hunger', color: '#DDA63A' },
  { id: 3, name: 'Good Health', color: '#4C9F38' },
  { id: 4, name: 'Quality Education', color: '#C5192D' },
  { id: 5, name: 'Gender Equality', color: '#FF3A21' },
  { id: 6, name: 'Clean Water', color: '#26BDE2' },
  { id: 7, name: 'Clean Energy', color: '#FCC30B' },
  { id: 8, name: 'Decent Work', color: '#A21942' },
  { id: 9, name: 'Innovation', color: '#FD6925' },
  { id: 10, name: 'Reduced Inequalities', color: '#DD1367' },
  { id: 11, name: 'Sustainable Cities', color: '#FD9D24' },
  { id: 12, name: 'Responsible Consumption', color: '#BF8B2E' },
  { id: 13, name: 'Climate Action', color: '#3F7E44' },
  { id: 14, name: 'Life Below Water', color: '#0A97D9' },
  { id: 15, name: 'Life on Land', color: '#56C02B' },
  { id: 16, name: 'Peace & Justice', color: '#00689D' },
  { id: 17, name: 'Partnerships', color: '#19486A' },
];

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Klasifikasi SDG Otomatis',
    desc: 'AI kami mengklasifikasikan artikel ilmiah dan profil peneliti ke dalam 17 tujuan pembangunan berkelanjutan PBB secara otomatis.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Search,
    title: 'Analisis ORCID & DOI',
    desc: 'Masukkan ORCID peneliti atau DOI artikel untuk mendapatkan peta kontribusi SDG secara instan dan mendetail.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: BarChart2,
    title: 'Research Explorer',
    desc: 'Jelajahi tren riset global, distribusi SDG antarwaktu, dan temukan kolaborator potensial dengan visualisasi interaktif.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: Users,
    title: 'Jaringan Kolaborasi',
    desc: 'Bangun koneksi lintas institusi dan negara. Temukan peneliti yang memiliki fokus SDG serupa untuk berkolaborasi.',
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    desc: 'Dapatkan wawasan mendalam yang dihasilkan AI tentang tren penelitian, gap riset, dan peluang kolaborasi SDG.',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
  },
  {
    icon: Handshake,
    title: 'Research Matching',
    desc: 'Platform cerdas yang mencocokkan peneliti, institusi, dan mitra industri berdasarkan keselarasan tujuan SDG.',
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Search,
    title: 'Masukkan ORCID atau DOI',
    desc: 'Ketikkan ID ORCID peneliti atau DOI artikel ilmiah Anda. Platform kami akan mengambil data publikasi secara otomatis.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    step: 2,
    icon: Brain,
    title: 'AI Mengklasifikasi SDG',
    desc: 'Model AI kami menganalisis abstrak dan konten publikasi, lalu memetakannya ke dalam satu atau lebih dari 17 SDG PBB.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    step: 3,
    icon: BarChart2,
    title: 'Eksplorasi Hasil & Dampak',
    desc: 'Lihat visualisasi interaktif kontribusi SDG, tren waktu, kolaborasi, dan ukuran dampak penelitian Anda.',
    color: 'from-emerald-500 to-teal-600',
  },
];

const DEFAULT_STATS = [
  { label: 'Peneliti Terdaftar', value: '12,400+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Artikel Terklasifikasi', value: '89,500+', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Institusi Partner', value: '340+', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'SDG Dicakup', value: '17 / 17', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const INSIGHT_PREVIEWS = [
  {
    sdg: 13,
    sdgColor: '#3F7E44',
    title: 'Akselerasi Riset Iklim',
    desc: 'Publikasi bertema perubahan iklim meningkat 34% dalam 2 tahun terakhir, didominasi oleh peneliti dari Asia Tenggara.',
    trend: '+34%',
  },
  {
    sdg: 3,
    sdgColor: '#4C9F38',
    title: 'Inovasi Kesehatan Global',
    desc: 'SDG 3 menjadi fokus riset paling banyak — 28% dari seluruh publikasi yang terklasifikasi berkaitan dengan kesehatan.',
    trend: '+28%',
  },
  {
    sdg: 4,
    sdgColor: '#C5192D',
    title: 'Transformasi Pendidikan',
    desc: 'Riset tentang pendidikan berkualitas dan pembelajaran digital mengalami lonjakan signifikan pasca pandemi.',
    trend: '+19%',
  },
];

const PARTNERS = [
  'Universitas Indonesia', 'ITB', 'UGM', 'IPB University',
  'BRIN', 'Kemendikbud', 'LPDP', 'OpenAlex',
];

// =====================================================================
// KOMPONEN UTAMA
// =====================================================================
const PublicHomePage = () => {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/platform_stats.php');
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== 'success' || !data.stats) return;
        setStats([
          { label: 'Peneliti Terdaftar', value: data.stats.researchers ?? DEFAULT_STATS[0].value, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Artikel Terklasifikasi', value: data.stats.articles ?? DEFAULT_STATS[1].value, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Institusi Partner', value: data.stats.institutions ?? DEFAULT_STATS[2].value, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'SDG Dicakup', value: '17 / 17', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
        ]);
      } catch {
        // silently keep default stats
      }
    };
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-white">

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 pt-28 pb-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Globe className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium text-blue-200">Platform Riset SDG berbasis AI</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Petakan Dampak Riset <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Terhadap Dunia
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 md:text-xl">
            Sciecola menggunakan kecerdasan buatan untuk mengklasifikasikan penelitian ilmiah
            ke dalam 17 Tujuan Pembangunan Berkelanjutan PBB — secara otomatis, akurat, dan visual.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Mulai Analisis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Quick ORCID hint */}
          <p className="mt-6 text-sm text-slate-400">
            Sudah punya ORCID?&nbsp;
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Masuk &amp; analisis profil Anda &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLATFORM STATS                                                */}
      {/* ============================================================ */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className={`flex flex-col items-center rounded-2xl border ${s.bg} border-gray-100 p-6 text-center shadow-sm`}>
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="mt-1 text-sm font-medium text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FITUR UTAMA                                                   */}
      {/* ============================================================ */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Semua yang Anda Butuhkan</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              Dari klasifikasi otomatis hingga analisis dampak — satu platform untuk seluruh kebutuhan riset SDG Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className={`group rounded-2xl border ${f.border} ${f.bg} p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 17 SDGs OVERVIEW                                              */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">17 Tujuan Pembangunan Berkelanjutan</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              Platform kami mencakup seluruh 17 SDG PBB 2030 — setiap publikasi dipetakan secara presisi ke tujuan yang relevan.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-9">
            {SDG_LIST.map((sdg) => (
              <Link
                key={sdg.id}
                to={`/sdgs`}
                className="group flex flex-col items-center"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-md"
                  style={{ backgroundColor: sdg.color }}
                >
                  <img
                    src={`/assets/sdgs/icons/sdg-${sdg.id}.svg`}
                    alt={`SDG ${sdg.id}`}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${sdg.id}</span>`;
                    }}
                  />
                </div>
                <span className="mt-1.5 text-center text-[10px] font-medium leading-tight text-gray-500 group-hover:text-gray-800">
                  {sdg.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/sdgs"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-700"
            >
              Jelajahi Semua SDG
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Cara Kerja Sciecola</h2>
            <p className="mx-auto max-w-xl text-lg text-gray-500">
              Tiga langkah sederhana untuk memetakan dampak penelitian Anda terhadap SDG global.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] hidden h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200 md:block" />

            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {/* Step number badge */}
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-10`} />
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-extrabold text-gray-800 shadow">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AI INSIGHTS PREVIEW                                           */}
      {/* ============================================================ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="mb-3 text-4xl font-bold text-gray-900">AI Insights Terkini</h2>
              <p className="max-w-xl text-lg text-gray-500">
                Wawasan otomatis berbasis data riset global — diperbarui setiap minggu.
              </p>
            </div>
            <Link
              to="/insights"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 whitespace-nowrap"
            >
              Lihat Semua Insights
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {INSIGHT_PREVIEWS.map((ins, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: ins.sdgColor }}
                  >
                    {ins.sdg}
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: ins.sdgColor }}
                  >
                    {ins.trend}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{ins.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{ins.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PARTNERS & SPONSORS                                           */}
      {/* ============================================================ */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">Dipercaya oleh Institusi Terkemuka</h2>
            <p className="text-gray-500">Bergabung bersama ratusan universitas, lembaga riset, dan mitra industri.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {PARTNERS.map((name, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:shadow-md"
              >
                {name}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/partners"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Lihat semua partner &amp; sponsor
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA                                                           */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 py-24 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Star className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Gratis untuk peneliti akademik</span>
          </div>
          <h2 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Mulai Pemetaan Riset SDG <br className="hidden md:block" />
            Anda Hari Ini
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100">
            Daftarkan diri Anda, hubungkan profil ORCID, dan temukan kontribusi nyata penelitian Anda terhadap tujuan global.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl"
            >
              Daftar Sekarang — Gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            {['Tidak perlu kartu kredit', 'Tersedia dalam Bahasa Indonesia', 'Data peneliti dilindungi'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
};

export default PublicHomePage;
