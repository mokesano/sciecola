import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, ArrowRight, Check, ChevronRight,
  FlaskConical, Building2, FileText, Target, Brain, Handshake,
} from 'lucide-react';
import Sparkline, { readDirection } from '../components/shared/Sparkline';

// =====================================================================
// VISUAL CONFIG
// Icon untuk tiap kartu fitur / langkah. Bukan teks naratif — hanya
// konfigurasi presentasi yang dipasangkan ke konten naratif berdasarkan
// urutan. Teks naratifnya bisa berasal dari DB (admin) atau locale file
// sebagai fallback.
//
// Ikon sengaja tidak lagi membawa warnanya sendiri. Enam keluarga warna
// berbeda pada satu grid kartu membaca sebagai dekorasi, bukan informasi;
// seluruh ikon kini memakai satu perlakuan aksen yang sama.
// =====================================================================

const FEATURE_ICONS = [FlaskConical, Search, BarChart2, Users, Brain, Handshake];
const STEP_ICONS    = [Search, Brain, BarChart2];
const STAT_ICONS    = [FileText, Users, Building2, Target];

// Deteksi identifier yang sama dengan HeroSearch, tapi tanpa memaksa login.
// Siapa pun bisa menelusuri keempat ID peneliti yang didukung (atau DOI).
const PATTERNS = {
  orcid:        /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i,
  researcherid: /^[A-Z]{1,3}-\d{4}-\d{4}$/i,
  doi:          /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
  numeric:      /^\d{4,12}$/,
};

const PublicSearch = ({ t }) => {
  const [q, setQ] = useState('');
  const [ambiguousId, setAmbiguousId] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const go = (path) => { setErr(''); setAmbiguousId(null); navigate(path); };

  const submit = (e) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setErr('');
    setAmbiguousId(null);
    if (PATTERNS.orcid.test(v))         return go(`/orcid/${v}`);
    if (PATTERNS.researcherid.test(v))  return go(`/researcherid/${v.toUpperCase()}`);
    if (PATTERNS.doi.test(v))           return go(`/doi/${encodeURIComponent(v)}`);
    if (PATTERNS.numeric.test(v))       return setAmbiguousId(v);
    setErr(t('search.error'));
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {t('search.submit')}
        </button>
      </form>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      {ambiguousId && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="mb-2.5 text-[13px] text-slate-600">
            {t('search.ambiguous', { id: ambiguousId })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/scopus/${ambiguousId}`)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
              Scopus
            </button>
            <button type="button" onClick={() => go(`/sinta/${ambiguousId}`)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
              SINTA
            </button>
            <button type="button" onClick={() => setAmbiguousId(null)}
              className="rounded px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
              {t('search.cancel')}
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-[13px] text-slate-500">{t('search.no_login')}</p>
    </div>
  );
};

// Helper: pilih nilai dari override DB jika ada, kalau tidak pakai fallback
// dari locale (t function). Memastikan tidak ada teks naratif ter-hardcode.
const text = (override, t, key, options) => override ?? t(key, options);

/* Kepala seksi dengan ukuran tipografi yang konsisten. Sebelumnya setiap
   judul seksi memakai text-6xl — sebesar judul hero — sehingga tidak ada
   hierarki sama sekali di antara keduanya. */
const SectionHead = ({ eyebrow, title, subtitle, align = 'center', className = 'mb-12', children }) => (
  <div className={`${className} ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
    {eyebrow && (
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">{eyebrow}</p>
    )}
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
    {subtitle && <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{subtitle}</p>}
    {children}
  </div>
);

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

  const pick = (path) =>
    path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), c);

  useEffect(() => {
    fetch(`/api/landing_content.php?lang=${encodeURIComponent(lang)}`)
      .then(r => r.json())
      .then(json => {
        setC(json.status === 'success' && json.content && typeof json.content === 'object'
          ? json.content : {});
      })
      .catch(() => setC({}));

    fetch('/api/platform_stats.php')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) {
          setStats(json.data.slice(0, 4).map((s, i) => ({
            label: s.label,
            value: s.value,
            icon:  STAT_ICONS[i] ?? STAT_ICONS[0],
          })));
        }
      })
      .catch(() => {});

    fetch('/api/sdg_distribution.php?sort=id&limit=17')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) setSdgList(json.data);
      })
      .catch(() => {});

    fetch('/api/insights.php')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'ok' && Array.isArray(json.insights)) {
          setInsights(json.insights.slice(0, 3));
        }
      })
      .catch(() => {});

    fetch('/api/partners.php?limit=8')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.partners)) setPartners(json.partners);
      })
      .catch(() => {});
  }, [lang]);

  const sdgColorById = sdgList.reduce((acc, s) => { acc[s.sdg] = s.color; return acc; }, {});

  const featureTexts = Array.isArray(pick('features'))
    ? pick('features') : t('features', { returnObjects: true });
  const features = FEATURE_ICONS.map((Icon, i) => ({
    Icon,
    title: featureTexts?.[i]?.title ?? '',
    desc:  featureTexts?.[i]?.desc  ?? '',
  }));

  const stepTexts = Array.isArray(pick('how_it_works'))
    ? pick('how_it_works') : t('how_it_works', { returnObjects: true });
  const steps = STEP_ICONS.map((Icon, i) => ({
    Icon,
    step:  i + 1,
    title: stepTexts?.[i]?.title ?? '',
    desc:  stepTexts?.[i]?.desc  ?? '',
  }));

  const trustSignals = Array.isArray(pick('cta_section.trust_signals'))
    ? pick('cta_section.trust_signals') : t('cta_section.trust_signals', { returnObjects: true });

  return (
    <main className="min-h-screen bg-white pt-20">

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* Bidang terang dengan kisi tipis, bukan gradien gelap dengan   */}
      {/* tiga blob blur. Kotak pencarian jadi pusat perhatian, karena  */}
      {/* penelusuran profil memang tidak memerlukan login.             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #e2e8f0 1px, transparent 1px),' +
              'linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            {text(pick('hero.badge'), t, 'hero.badge')}
          </span>

          <h1 className="mt-7 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {text(pick('hero.title_1'), t, 'hero.title_1')}{' '}
            <span className="text-indigo-600">
              {text(pick('hero.title_2'), t, 'hero.title_2')}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            {text(pick('hero.subtitle'), t, 'hero.subtitle')}
          </p>

          <PublicSearch t={t} />

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
              {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
            </Link>
          </div>

          <p className="mt-6 text-[13px] text-slate-500">
            {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}{' '}
            <Link to="/tutorial-orcid"
              className="font-medium text-indigo-700 underline-offset-4 hover:underline">
              {text(pick('hero.orcid_hint_link'), t, 'hero.orcid_hint_link')}
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLATFORM STATS                                                */}
      {/* ============================================================ */}
      {stats.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <dl className="grid grid-cols-2 divide-slate-200 sm:divide-x md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-2 py-8 sm:px-6">
                  <s.icon className="h-5 w-5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <dd className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                      {s.value}
                    </dd>
                    <dt className="mt-0.5 text-[13px] leading-snug text-slate-500">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* FITUR UTAMA                                                   */}
      {/* ============================================================ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            title={text(pick('features_section.title'), t, 'features_section.title')}
            subtitle={text(pick('features_section.subtitle'), t, 'features_section.subtitle')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300 hover:bg-slate-50">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <f.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 17 SDGs — warna resmi PBB dipertahankan karena ia data,       */}
      {/* bukan dekorasi.                                               */}
      {/* ============================================================ */}
      {sdgList.length > 0 && (
        <section className="border-y border-slate-200 bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              title={text(pick('sdg_section.title'), t, 'sdg_section.title')}
              subtitle={text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')}
            />

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-9">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="group flex flex-col items-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg transition-transform group-hover:scale-[1.04]"
                    style={{ backgroundColor: sdg.color }}
                  >
                    <img
                      src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`}
                      alt={`SDG ${sdg.sdg}`}
                      className="h-11 w-11 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          `<span class="text-white font-semibold text-lg">${sdg.sdg}</span>`;
                      }}
                    />
                  </div>
                  <span className="mt-2 text-center text-[10px] font-medium leading-tight text-slate-500 group-hover:text-slate-900">
                    {sdg.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/sdgs"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
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
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            title={text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            subtitle={text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')}
          />

          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step} className="border-t-2 border-slate-900 pt-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-slate-400">
                    {String(item.step).padStart(2, '0')}
                  </span>
                  <item.Icon className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AI INSIGHTS — tiap kartu membawa sparkline agar pembaca       */}
      {/* melihat arah perubahannya, bukan hanya angka akhirnya.        */}
      {/* ============================================================ */}
      {insights.length > 0 && (
        <section className="border-y border-slate-200 bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHead
                align="left"
                className=""
                title={text(pick('insights_section.title'), t, 'insights_section.title')}
                subtitle={text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')}
              />
              <Link to="/insights"
                className="inline-flex shrink-0 items-center gap-2 pb-1 text-sm font-medium text-indigo-700 underline-offset-4 hover:underline">
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {insights.map((ins) => {
                const color     = sdgColorById[ins.sdg] || '#64748b';
                const series    = Array.isArray(ins.series) ? ins.series : [];
                const direction = readDirection(series, ins.trend);
                const start     = ins.series_start;
                const end       = start && series.length ? start + series.length - 1 : null;

                return (
                  <article key={ins.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
                      <span className="font-mono text-[11px] tabular-nums text-slate-400">
                        SDG {String(ins.sdg).padStart(2, '0')}
                      </span>
                      {ins.category && (
                        <span className="ml-auto rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {ins.category}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-[15px] font-semibold leading-snug text-slate-900">{ins.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{ins.text}</p>

                    <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                      <div>
                        {ins.trend && (
                          <p className={`text-xl font-semibold tabular-nums ${
                            direction === 'down' ? 'text-red-600'
                              : direction === 'up' ? 'text-indigo-700' : 'text-slate-700'
                          }`}>
                            {ins.trend}
                          </p>
                        )}
                        {start && end && (
                          <p className="font-mono text-[10px] tabular-nums text-slate-400">{start}–{end}</p>
                        )}
                      </div>
                      {series.length > 1 && (
                        <Sparkline values={series} direction={direction} className="h-12 w-28" />
                      )}
                    </div>
                  </article>
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
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              title={text(pick('partners_section.title'), t, 'partners_section.title')}
              subtitle={text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')}
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((p) => (
                <span key={p.id ?? p.name}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
                  {p.name}
                </span>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to="/partners"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 underline-offset-4 hover:underline">
                {text(pick('partners_section.cta_label'), t, 'partners_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* CTA — panel gelap pekat, tanpa gradien maupun orb blur.       */}
      {/* ============================================================ */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-slate-300">
            {text(pick('cta_section.badge'), t, 'cta_section.badge')}
          </span>

          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100">
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-indigo-400" />
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
