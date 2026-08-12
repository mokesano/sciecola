import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/shared/PageHeader';

// ─── Fallback hardcoded insights (12 items covering all 17 SDGs) ──────────────
const FALLBACK_INSIGHTS = [
  {
    id: 1,
    category: 'Tren',
    title: 'Lonjakan Riset Iklim',
    text: 'Publikasi terkait SDG 13 (Climate Action) meningkat 32% dalam 3 tahun terakhir, menjadikannya SDG dengan pertumbuhan tercepat.',
    sdg: 13,
    trend: '+32%',
    icon: 'trend_up',
    link: '/sdgs',
  },
  {
    id: 2,
    category: 'Perbandingan',
    title: 'Dominasi SDG 4 di Indonesia',
    text: 'Quality Education (SDG 4) paling banyak diteliti oleh peneliti dari Indonesia, mencakup 18% dari seluruh publikasi nasional.',
    sdg: 4,
    trend: '18%',
    icon: 'education',
    link: '/researchers',
  },
  {
    id: 3,
    category: 'Tren',
    title: 'Peningkatan Kolaborasi Internasional',
    text: 'Kolaborasi internasional pada riset SDG 3 meningkat 28% dibanding tahun lalu, dengan mitra terbanyak dari Malaysia dan Australia.',
    sdg: 3,
    trend: '+28%',
    icon: 'users',
    link: '/researchers',
  },
  {
    id: 4,
    category: 'Rekomendasi',
    title: 'Gap Riset SDG 2',
    text: 'Zero Hunger (SDG 2) masih sangat kurang diteliti relatif terhadap urgensinya. Hanya 3.2% dari total publikasi membahas ketahanan pangan.',
    sdg: 2,
    trend: '3.2%',
    icon: 'alert',
    link: '/sdgs',
  },
  {
    id: 5,
    category: 'Tren',
    title: 'Energi Bersih Memimpin',
    text: 'Riset SDG 7 (Clean Energy) mencatat pertumbuhan tertinggi kedua dengan 25% peningkatan publikasi, didorong oleh agenda transisi energi global.',
    sdg: 7,
    trend: '+25%',
    icon: 'trend_up',
    link: '/sdgs',
  },
  {
    id: 6,
    category: 'Perbandingan',
    title: 'H-Index Tertinggi SDG 6',
    text: 'Peneliti yang fokus pada SDG 6 (Clean Water) memiliki rata-rata h-index 23, tertinggi di antara semua SDG, menunjukkan kualitas riset yang sangat baik.',
    sdg: 6,
    trend: 'h-23',
    icon: 'star',
    link: '/researchers',
  },
  {
    id: 7,
    category: 'Tren',
    title: 'Riset Kota Berkelanjutan',
    text: 'SDG 11 (Sustainable Cities) merupakan SDG paling banyak dikolaborasikan antar institusi, dengan 68% publikasinya melibatkan 2+ lembaga berbeda.',
    sdg: 11,
    trend: '68%',
    icon: 'city',
    link: '/sdgs',
  },
  {
    id: 8,
    category: 'Peringatan',
    title: 'Penurunan Riset SDG 16',
    text: 'Peace, Justice & Strong Institutions (SDG 16) mengalami penurunan publikasi 12% tahun ini, kemungkinan akibat berkurangnya pendanaan riset sosial.',
    sdg: 16,
    trend: '-12%',
    icon: 'trend_down',
    link: '/sdgs',
  },
  {
    id: 9,
    category: 'Rekomendasi',
    title: 'Peluang Kolaborasi SDG 14',
    text: 'Life Below Water (SDG 14) masih didominasi riset dari negara maju. Peneliti Indonesia memiliki peluang besar untuk mengisi gap ini dengan kearifan lokal.',
    sdg: 14,
    trend: 'Peluang',
    icon: 'opportunity',
    link: '/articles',
  },
  {
    id: 10,
    category: 'Tren',
    title: 'Interdisipliner Meningkat',
    text: 'Publikasi yang menyentuh 3+ SDGs sekaligus tumbuh 41% dalam 2 tahun, menunjukkan pergeseran penelitian ke pendekatan yang lebih holistik.',
    sdg: 17,
    trend: '+41%',
    icon: 'interconnect',
    link: '/sdgs',
  },
  {
    id: 11,
    category: 'Perbandingan',
    title: 'Impact Score SDG 3 Tertinggi',
    text: 'Artikel tentang SDG 3 (Good Health) memiliki rata-rata impact score 3.8, jauh di atas rata-rata platform 2.1, mencerminkan minat global yang tinggi.',
    sdg: 3,
    trend: '3.8',
    icon: 'chart',
    link: '/articles',
  },
  {
    id: 12,
    category: 'Rekomendasi',
    title: 'Potensi AI untuk SDG Research',
    text: 'Integrasi metodologi AI dan machine learning dalam riset SDGs meningkat 89% dalam 5 tahun. Ini adalah area pertumbuhan yang sangat menjanjikan.',
    sdg: 9,
    trend: '+89%',
    icon: 'ai',
    link: '/articles',
  },
];

// ─── SDG color map ────────────────────────────────────────────────────────────
const SDG_COLORS = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
  5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
  9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
  13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D',
  17: '#19486A',
};

// ─── Category badge colors ────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  Tren:         'bg-emerald-500/20 text-emerald-300',
  Perbandingan: 'bg-blue-500/20 text-blue-300',
  Rekomendasi:  'bg-purple-500/20 text-purple-300',
  Peringatan:   'bg-red-500/20 text-red-300',
  Kolaborasi:   'bg-orange-500/20 text-orange-300',
};

// Internal category keys (matches data) → i18n label keys.
const CATEGORY_KEYS = ['Semua', 'Tren', 'Perbandingan', 'Rekomendasi', 'Peringatan'];
const CATEGORY_I18N = {
  Semua:        'filter.all',
  Tren:         'filter.trend',
  Perbandingan: 'filter.comparison',
  Rekomendasi:  'filter.recommendation',
  Peringatan:   'filter.warning',
};

// ─── Icon renderer (SVG only) ─────────────────────────────────────────────────
function InsightIcon({ icon, sdg }) {
  const color = SDG_COLORS[sdg] || '#6366f1';

  const iconMap = {
    trend_up: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    trend_down: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    education: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    users: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    alert: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    star: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    city: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    opportunity: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    interconnect: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    ai: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  };

  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}30`, color }}
    >
      {iconMap[icon] || iconMap['chart']}
    </div>
  );
}

// ─── Single insight card ──────────────────────────────────────────────────────
function InsightCard({ insight, t }) {
  const badgeClass = CATEGORY_STYLES[insight.category] || 'bg-gray-500/20 text-gray-300';
  const categoryLabel = CATEGORY_I18N[insight.category]
    ? t(CATEGORY_I18N[insight.category])
    : insight.category;

  return (
    <Link
      to={insight.link || '/sdgs'}
      className="group bg-[#1e1b4b] rounded-2xl p-5 flex flex-col gap-4 border border-white/10 hover:border-white/20 hover:bg-[#252060] transition-all duration-200 shadow-lg"
    >
      {/* Top row: icon + category badge */}
      <div className="flex items-start justify-between gap-3">
        <InsightIcon icon={insight.icon} sdg={insight.sdg} />
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeClass}`}>
          {categoryLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-bold text-base leading-snug group-hover:text-indigo-300 transition-colors">
        {insight.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-[15px] leading-relaxed flex-1">
        {insight.text}
      </p>

      {/* Footer: SDG badge + trend */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
        <div
          className="w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center"
          style={{ backgroundColor: SDG_COLORS[insight.sdg] || '#6366f1' }}
          title={t('sdg_label', { n: insight.sdg })}
        >
          {insight.sdg}
        </div>
        <span className="text-sm font-bold text-indigo-300">{insight.trend}</span>
      </div>
    </Link>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ active, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORY_KEYS.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-[15px] font-semibold transition-all duration-200 border
            ${active === cat
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
        >
          {t(CATEGORY_I18N[cat])}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const InsightsPage = () => {
  const { t } = useTranslation('insights_page');
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights.php')
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'ok' && Array.isArray(json.insights) && json.insights.length > 0) {
          const mapped = json.insights.map((item) => ({
            ...item,
            link: item.link || '/sdgs',
          }));
          setInsights(mapped);
        }
      })
      .catch(() => {
        // silently use fallback
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'Semua'
      ? insights
      : insights.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
          <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
        </nav>

        {/* Page header */}
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          breadcrumbs={[{ label: t('breadcrumb.current') }]}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        {/* Filter bar */}
        <FilterBar active={activeCategory} onChange={setActiveCategory} t={t} />

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1e1b4b] rounded-2xl p-5 h-52 animate-pulse opacity-60" />
            ))}
          </div>
        )}

        {/* Insights grid */}
        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{t('empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} t={t} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
