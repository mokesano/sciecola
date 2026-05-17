import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, Globe,
  ArrowRight, CheckCircle, Star, ChevronRight,
  FlaskConical, Building2, FileText, Target, Brain, Handshake
} from 'lucide-react';

// =====================================================================
// VISUAL CONFIG
// Icon + warna untuk tiap kartu fitur / langkah. Bukan teks naratif —
// hanya konfigurasi presentasi yang dipasangkan ke konten naratif
// berdasarkan urutan. Teks naratifnya bisa berasal dari DB (admin)
// atau locale file (id.json / en.json) sebagai fallback.
// =====================================================================

const FEATURE_VISUALS = [
  { icon: FlaskConical, color: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',    border: 'border-blue-100' },
  { icon: Search,       color: 'from-emerald-500 to-teal-600',  bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: BarChart2,    color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50',  border: 'border-violet-100' },
  { icon: Users,        color: 'from-orange-500 to-red-500',    bg: 'bg-orange-50',  border: 'border-orange-100' },
  { icon: Brain,        color: 'from-pink-500 to-rose-600',     bg: 'bg-pink-50',    border: 'border-pink-100' },
  { icon: Handshake,    color: 'from-amber-500 to-yellow-500',  bg: 'bg-amber-50',   border: 'border-amber-100' },
];

const STEP_VISUALS = [
  { icon: Search,    color: 'from-blue-500 to-indigo-600' },
  { icon: Brain,     color: 'from-violet-500 to-purple-600' },
  { icon: BarChart2, color: 'from-emerald-500 to-teal-600' },
];

const STAT_ICON_MAP = [
  { icon: FileText,  color: 'text-violet-600',  bg: 'bg-violet-50' },
  { icon: Users,     color: 'text-blue-600',    bg: 'bg-blue-50' },
  { icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Target,    color: 'text-orange-600',  bg: 'bg-orange-50' },
];

// Helper: pilih nilai dari override DB jika ada, kalau tidak pakai
// fallback dari locale (t function). Memastikan tidak ada teks
// naratif yang ter-hardcode di komponen.
const text = (override, t, key, options) =>
  override ?? t(key, options);

// =====================================================================
// KOMPONEN UTAMA
// =====================================================================
const PublicHomePage = () => {
  const { t, i18n } = useTranslation('homepage');
  const lang = i18n.language || 'id';

  const [stats, setStats]       = useState([]);
  const [sdgList, setSdgList]   = useState([]);
  const [insights, setInsights] = useState([]);
  const [partners, setPartners] = useState([]);

  // Konten naratif yang diatur admin lewat /api/landing_content.php.
  // Jika empty/error, semua `c.<key>` undefined → fallback ke t().
  const [c, setC] = useState({});

  // Helper utk akses bertingkat tanpa try/catch
  const pick = (path) => {
    return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), c);
  };

  useEffect(() => {
    // ---- Narrative content (DB override per language) ----
    fetch(`/api/landing_content.php?lang=${encodeURIComponent(lang)}`)
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && json.content && typeof json.content === 'object') {
          setC(json.content);
        } else {
          setC({});
        }
      })
      .catch(() => setC({}));

    // ---- Platform statistics ----
    fetch('/api/platform_stats.php')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) {
          setStats(
            json.data.slice(0, 4).map((s, i) => ({
              label: s.label,
              value: s.value,
              ...(STAT_ICON_MAP[i] || STAT_ICON_MAP[0]),
            }))
          );
        }
      })
      .catch(() => {});

    // ---- SDG list ----
    fetch('/api/sdg_distribution.php?sort=id&limit=17')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) {
          setSdgList(json.data);
        }
      })
      .catch(() => {});

    // ---- AI Insights ----
    fetch('/api/insights.php')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'ok' && Array.isArray(json.insights)) {
          setInsights(json.insights.slice(0, 3));
        }
      })
      .catch(() => {});

    // ---- Partners ----
    fetch('/api/partners.php?limit=8')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.partners)) {
          setPartners(json.partners);
        }
      })
      .catch(() => {});
  }, [lang]);

  const sdgColorById = sdgList.reduce((acc, s) => {
    acc[s.sdg] = s.color;
    return acc;
  }, {});

  // Susun list fitur / how-it-works: prioritaskan override dari DB
  // (jika array & jumlah elemen mencukupi), kalau tidak pakai locale.
  const featureTexts = Array.isArray(pick('features'))
    ? pick('features')
    : t('features', { returnObjects: true });
  const features = FEATURE_VISUALS.map((vis, i) => ({
    ...vis,
    title: featureTexts?.[i]?.title ?? '',
    desc:  featureTexts?.[i]?.desc  ?? '',
  }));

  const stepTexts = Array.isArray(pick('how_it_works'))
    ? pick('how_it_works')
    : t('how_it_works', { returnObjects: true });
  const steps = STEP_VISUALS.map((vis, i) => ({
    ...vis,
    step: i + 1,
    title: stepTexts?.[i]?.title ?? '',
    desc:  stepTexts?.[i]?.desc  ?? '',
  }));

  const trustSignals = Array.isArray(pick('cta_section.trust_signals'))
    ? pick('cta_section.trust_signals')
    : t('cta_section.trust_signals', { returnObjects: true });

  return (
    <main className="min-h-screen bg-white">

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Globe className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium text-blue-200">
              {text(pick('hero.badge'), t, 'hero.badge')}
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            {text(pick('hero.title_1'), t, 'hero.title_1')} <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              {text(pick('hero.title_2'), t, 'hero.title_2')}
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 md:text-xl">
            {text(pick('hero.subtitle'), t, 'hero.subtitle')}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}&nbsp;
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2">
              {text(pick('hero.orcid_hint_link'), t, 'hero.orcid_hint_link')}
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLATFORM STATS                                                */}
      {/* ============================================================ */}
      {stats.length > 0 && (
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
      )}

      {/* ============================================================ */}
      {/* FITUR UTAMA                                                   */}
      {/* ============================================================ */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              {text(pick('features_section.title'), t, 'features_section.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              {text(pick('features_section.subtitle'), t, 'features_section.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
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
      {/* 17 SDGs                                                       */}
      {/* ============================================================ */}
      {sdgList.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                {text(pick('sdg_section.title'), t, 'sdg_section.title')}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-500">
                {text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-9">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="group flex flex-col items-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-md"
                    style={{ backgroundColor: sdg.color }}
                  >
                    <img
                      src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`}
                      alt={`SDG ${sdg.sdg}`}
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${sdg.sdg}</span>`;
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
                {text(pick('sdg_section.cta_label'), t, 'sdg_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              {text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            </h2>
            <p className="mx-auto max-w-xl text-lg text-gray-500">
              {text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')}
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] hidden h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200 md:block" />

            {steps.map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
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
      {/* AI INSIGHTS                                                   */}
      {/* ============================================================ */}
      {insights.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              <div>
                <h2 className="mb-3 text-4xl font-bold text-gray-900">
                  {text(pick('insights_section.title'), t, 'insights_section.title')}
                </h2>
                <p className="max-w-xl text-lg text-gray-500">
                  {text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')}
                </p>
              </div>
              <Link
                to="/insights"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 whitespace-nowrap"
              >
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {insights.map((ins) => {
                const color = sdgColorById[ins.sdg] || '#6b7280';
                return (
                  <div key={ins.id} className="rounded-2xl border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {ins.sdg}
                      </div>
                      {ins.trend && (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {ins.trend}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-base font-bold text-gray-900">{ins.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{ins.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* PARTNERS                                                      */}
      {/* ============================================================ */}
      {partners.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                {text(pick('partners_section.title'), t, 'partners_section.title')}
              </h2>
              <p className="text-gray-500">
                {text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {partners.map((p) => (
                <div
                  key={p.id ?? p.name}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:shadow-md"
                >
                  {p.name}
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/partners"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {text(pick('partners_section.cta_label'), t, 'partners_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
            <span className="text-sm font-medium">
              {text(pick('cta_section.badge'), t, 'cta_section.badge')}
            </span>
          </div>
          <h2 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl"
            >
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
};

export default PublicHomePage;
