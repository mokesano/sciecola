import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, ArrowRight, Check, ChevronRight,
  FlaskConical, Brain, Handshake, Building2, Landmark, Coins, GraduationCap,
} from 'lucide-react';
import Sparkline, { readDirection } from '../components/shared/Sparkline';
import { AmbientSection, SpotlightCard, ART, CARD, PANEL } from '../components/shared/Ambient';
import HeroDataField from '../components/shared/HeroDataField';
import SvgCarousel from '../components/shared/SvgCarousel';

// =====================================================================
// TANGGA WARNA HALAMAN
//
// Warna latar tidak berselang-seling. Ia menurun satu arah, dari oranye tua
// mendekati merah di hero sampai putih di seksi terakhir sebelum footer —
// jadi menggulir halaman terasa seperti bergerak menuju terang, bukan
// melompat-lompat antar warna.
//
// Yang membedakan tiap seksi adalah gambar latar SVG-nya dan cahaya sekitarnya,
// bukan lompatan warna. Satu seksi sengaja keluar dari tangga ini — AI Insights
// memakai bidang pekat sebagai tanda baca di tengah halaman.
// =====================================================================

const STEP = {
  hero:      { bg: '#7C2D12', dark: true  },
  search:    { bg: '#8E3616', dark: true  },
  features:  { bg: '#A64020', dark: true  },
  sdg:       { bg: '#BE5433', dark: true  },
  flow:      { bg: '#E8A183', dark: false },
  insights:  { bg: '#16100E', dark: true  },   // tanda baca: bidang pekat
  sources:   { bg: '#F5C9B2', dark: false },
  audience:  { bg: '#FBE3D6', dark: false },
  partners:  { bg: '#FEF4EE', dark: false },
  closing:   { bg: '#FFFFFF', dark: false },
};

/* Artwork diberi warna kontras terhadap anak tangganya sendiri, bukan warna
   tetap — di bidang tua ia lebih terang, di bidang muda ia lebih pekat. */
const ART_ON_DARK  = { art: '#FFD9C2', lit: 'rgba(255,255,255,0.95)', blob: 'rgba(255,170,120,0.16)' };
const ART_ON_LIGHT = { art: '#B45309', lit: 'rgba(180,83,9,0.85)',    blob: 'rgba(234,88,12,0.10)'  };
const artFor = (step) => (step.dark ? ART_ON_DARK : ART_ON_LIGHT);

/* Kelas teks per anak tangga. Kontras dijaga tegas: di bidang tua teks putih,
   di bidang muda teks slate pekat. Tidak ada teks abu-abu di atas gambar. */
const ink = (step) => (step.dark
  ? { head: 'text-white',      body: 'text-white/80',  soft: 'text-white/60',  eyebrow: 'text-amber-300' }
  : { head: 'text-slate-900',  body: 'text-slate-700',  soft: 'text-slate-600', eyebrow: 'text-orange-700' });

const FEATURE_ICONS  = [FlaskConical, Search, BarChart2, Users, Brain, Handshake];
const STEP_ICONS     = [Search, Brain, BarChart2];
const AUDIENCE_ICONS = [GraduationCap, Building2, Coins, Landmark];

const DATA_SOURCES = ['ORCID', 'Scopus', 'SINTA', 'Crossref', 'OpenCitations', 'DataCite', 'Dimensions', 'Semantic Scholar'];

// Deteksi identifier yang sama dengan HeroSearch, tapi tanpa memaksa login.
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
    <div className="mx-auto max-w-2xl">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-lg bg-white py-3.5 pl-11 pr-3 text-base text-slate-900 shadow-sm ring-1 ring-black/10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button type="submit"
          className="shrink-0 rounded-lg bg-amber-400 px-7 py-3.5 text-[15px] font-bold text-[#4A1A08] shadow-lg shadow-black/20 transition-all hover:bg-amber-300">
          {t('search.submit')}
        </button>
      </form>

      {err && <p className="mt-3 text-[15px] font-medium text-amber-200">{err}</p>}

      {ambiguousId && (
        <div className={`${CARD} mt-3 p-4 text-left`}>
          <p className="mb-2.5 text-[15px] text-white/80">{t('search.ambiguous', { id: ambiguousId })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/scopus/${ambiguousId}`)}
              className="rounded-lg bg-white/10 px-3.5 py-2 text-[15px] font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
              Scopus
            </button>
            <button type="button" onClick={() => go(`/sinta/${ambiguousId}`)}
              className="rounded-lg bg-white/10 px-3.5 py-2 text-[15px] font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
              SINTA
            </button>
            <button type="button" onClick={() => setAmbiguousId(null)}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-white/60 transition-colors hover:text-white">
              {t('search.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const text = (override, t, key, options) => override ?? t(key, options);

const SectionHead = ({ eyebrow, title, subtitle, step, align = 'center', className = 'mb-14' }) => {
  const c = ink(step);
  return (
    <div className={`${className} ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow && <p className={`text-xs font-bold uppercase tracking-[0.2em] ${c.eyebrow}`}>{eyebrow}</p>}
      <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${c.head}`}>{title}</h2>
      {subtitle && <p className={`mt-4 text-base leading-relaxed ${c.body}`}>{subtitle}</p>}
    </div>
  );
};

// =====================================================================
const PublicHomePage = () => {
  const { t, i18n } = useTranslation('homepage');
  const lang = i18n.language || 'id';

  const [stats, setStats]       = useState([]);
  const [sdgList, setSdgList]   = useState([]);
  const [insights, setInsights] = useState([]);
  const [partners, setPartners] = useState([]);
  const [c, setC] = useState({});

  const pick = (path) =>
    path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), c);

  useEffect(() => {
    fetch(`/api/landing_content.php?lang=${encodeURIComponent(lang)}`)
      .then(r => r.json())
      .then(json => setC(json.status === 'success' && json.content && typeof json.content === 'object' ? json.content : {}))
      .catch(() => setC({}));

    fetch('/api/platform_stats.php')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) {
          setStats(json.data.slice(0, 4).map(s => ({ label: s.label, value: s.value })));
        }
      }).catch(() => {});

    fetch('/api/sdg_distribution.php?sort=id&limit=17')
      .then(r => r.json())
      .then(json => { if (json.status === 'success' && Array.isArray(json.data)) setSdgList(json.data); })
      .catch(() => {});

    fetch('/api/insights.php')
      .then(r => r.json())
      .then(json => { if (json.status === 'ok' && Array.isArray(json.insights)) setInsights(json.insights.slice(0, 3)); })
      .catch(() => {});

    fetch('/api/partners.php?limit=8')
      .then(r => r.json())
      .then(json => { if (json.status === 'success' && Array.isArray(json.partners)) setPartners(json.partners); })
      .catch(() => {});
  }, [lang]);

  const sdgColorById = sdgList.reduce((acc, s) => { acc[s.sdg] = s.color; return acc; }, {});

  const heroHighlights = Array.isArray(pick('hero.highlights'))
    ? pick('hero.highlights') : t('hero.highlights', { returnObjects: true });

  const featureTexts  = Array.isArray(pick('features')) ? pick('features') : t('features', { returnObjects: true });
  const featureLabels = t('feature_labels', { returnObjects: true });
  const features = FEATURE_ICONS.map((Icon, i) => ({
    Icon,
    label: featureTexts?.[i]?.label ?? (Array.isArray(featureLabels) ? featureLabels[i] : undefined),
    title: featureTexts?.[i]?.title ?? '',
    desc:  featureTexts?.[i]?.desc  ?? '',
  }));

  const stepTexts = Array.isArray(pick('how_it_works')) ? pick('how_it_works') : t('how_it_works', { returnObjects: true });
  const steps = STEP_ICONS.map((Icon, i) => ({
    Icon, step: i + 1,
    title: stepTexts?.[i]?.title ?? '',
    desc:  stepTexts?.[i]?.desc  ?? '',
  }));

  const audience = (t('audience_section.items', { returnObjects: true }) || []).map((a, i) => ({
    ...a, Icon: AUDIENCE_ICONS[i] ?? AUDIENCE_ICONS[0],
  }));

  const trustSignals = Array.isArray(pick('cta_section.trust_signals'))
    ? pick('cta_section.trust_signals') : t('cta_section.trust_signals', { returnObjects: true });

  /* Slide korsel hero: tiap gambar mewakili satu hal yang dikerjakan
     aplikasi, bukan hiasan yang berganti-ganti. */
  const heroSlides = [
    { src: ART.world,    caption: t('stats_section.eyebrow') },
    { src: ART.network,  caption: t('features_section.eyebrow') },
    { src: ART.waves,    caption: t('insights_section.eyebrow') },
    { src: ART.flow,     caption: t('how_it_works_section.eyebrow') },
  ];

  return (
    <main className="min-h-screen">

      {/* ══ 1 · HERO — rata kiri, korsel di kanan, statistik platform ══ */}
      <AmbientSection surfaceColor={STEP.hero.bg} {...artFor(STEP.hero)}
        art={ART.hero} artOpacity={0.35} artPosition="right" blob={false}>
        {/* Penanda data dikurung di paruh kanan, di ruang yang sama dengan
            korsel. Dibiarkan menutupi seluruh hero, penandanya akan duduk di
            atas judul dan menghalangi teks — dan penanda itu bisa diklik,
            jadi ia benar-benar merebut pointer dari teks di bawahnya. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] lg:block">
          <HeroDataField items={sdgList} labels={t('hero.field', { returnObjects: true })} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8 lg:pt-36">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">

            {/* — kolom kiri: pesan — */}
            <div className="text-left">
              <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 text-[15px] font-medium text-white ring-1 ring-white/25">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(252,211,77,0.9)]" />
                {text(pick('hero.badge'), t, 'hero.badge')}
              </span>

              <h1 id="hero-title" className="mt-8 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {text(pick('hero.title_1'), t, 'hero.title_1')}{' '}
                <span className="text-amber-300">{text(pick('hero.title_2'), t, 'hero.title_2')}</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
                {text(pick('hero.subtitle'), t, 'hero.subtitle')}
              </p>

              {Array.isArray(heroHighlights) && heroHighlights.length > 0 && (
                <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {heroHighlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-snug text-white/90">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[#4A1A08]">
                        <Check className="h-3 w-3" strokeWidth={3.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
                <Link to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-7 py-3.5 text-[15px] font-bold text-[#4A1A08] shadow-lg shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-amber-300">
                  {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {/* Teksnya mengajak masuk, jadi tujuannya halaman masuk —
                    sebelumnya tautan ini mendarat di halaman panduan. */}
                <Link to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20">
                  {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
                </Link>
              </div>

              <p className="mt-6 text-[15px] text-white/70">
                {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}{' '}
                <Link to="/tutorial-orcid" className="font-semibold text-amber-300 underline-offset-4 hover:underline">
                  {t('hero.tutorial_link')}
                </Link>
              </p>
            </div>

            {/* — kolom kanan: korsel SVG — */}
            <div className="relative z-10 hidden lg:block">
              <SvgCarousel slides={heroSlides} color="rgba(255,255,255,0.92)"
                className="h-[26rem]" labelledBy="hero-title" />
            </div>
          </div>

          {/* — statistik platform, seperti pada beranda pengguna — */}
          {stats.length > 0 && (
            <dl className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-white/20 pt-12 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i}>
                  <dd className="text-4xl font-bold tabular-nums tracking-tight text-amber-300">{s.value}</dd>
                  <dt className="mt-2 text-[15px] leading-snug text-white/75">{s.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </AmbientSection>

      {/* ══ 2 · PENELUSURAN — ajakan tindakan pindah ke seksinya sendiri ══ */}
      <AmbientSection surfaceColor={STEP.search.bg} {...artFor(STEP.search)}
        art={ART.coverage} artOpacity={0.25} className="py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <SectionHead step={STEP.search} className="mb-10"
            eyebrow={t('search_section.eyebrow')}
            title={t('search_section.title')}
            subtitle={t('search_section.subtitle')} />
          <PublicSearch t={t} />
        </div>
      </AmbientSection>

      {/* ══ 3 · KEMAMPUAN ══════════════════════════════════════════════ */}
      <AmbientSection surfaceColor={STEP.features.bg} {...artFor(STEP.features)}
        art={ART.network} artOpacity={0.22} className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead step={STEP.features}
            eyebrow={t('features_section.eyebrow')}
            title={text(pick('features_section.title'), t, 'features_section.title')}
            subtitle={text(pick('features_section.subtitle'), t, 'features_section.subtitle')} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <SpotlightCard key={i} glow="rgba(255,220,190,0.16)"
                className={`${CARD} p-6 hover:ring-amber-300/45`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
                    <f.Icon className="h-5 w-5" />
                  </span>
                  {f.label && (
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-300 ring-1 ring-white/10">
                      {f.label}
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{f.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </AmbientSection>

      {/* ══ 4 · 17 SDG ═════════════════════════════════════════════════ */}
      {sdgList.length > 0 && (
        <AmbientSection surfaceColor={STEP.sdg.bg} {...artFor(STEP.sdg)}
          art={ART.hero} artOpacity={0.18} artPosition="bottom" className="py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead step={STEP.sdg}
              eyebrow={t('sdg_section.eyebrow')}
              title={text(pick('sdg_section.title'), t, 'sdg_section.title')}
              subtitle={text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')} />

            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="group flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/25 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-white/70"
                    style={{ backgroundColor: sdg.color, boxShadow: `0 8px 26px -8px ${sdg.color}` }}>
                    <img src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`} alt={`SDG ${sdg.sdg}`}
                      className="h-14 w-14 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-white font-bold text-xl">${sdg.sdg}</span>`;
                      }} />
                  </div>
                  <span className="mt-2.5 text-center text-xs font-medium leading-tight text-white/70 transition-colors group-hover:text-white">
                    {sdg.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link to="/sdgs"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-[15px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20">
                {text(pick('sdg_section.cta_label'), t, 'sdg_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ 5 · ALUR KERJA ═════════════════════════════════════════════ */}
      <AmbientSection surfaceColor={STEP.flow.bg} {...artFor(STEP.flow)}
        art={ART.flow} artOpacity={0.3} className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead step={STEP.flow}
            eyebrow={t('how_it_works_section.eyebrow')}
            title={text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            subtitle={text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')} />

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <SpotlightCard key={item.step} as="li" tone="light" accent="orange"
                className={`${PANEL} p-7 hover:ring-orange-300`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-base font-bold tabular-nums text-white shadow-sm">
                    {item.step}
                  </span>
                  <item.Icon className="h-5 w-5 text-orange-700" />
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{item.desc}</p>
              </SpotlightCard>
            ))}
          </ol>
        </div>
      </AmbientSection>

      {/* ══ 6 · AI INSIGHTS — satu-satunya bidang pekat ════════════════ */}
      {insights.length > 0 && (
        <AmbientSection surfaceColor={STEP.insights.bg} {...artFor(STEP.insights)}
          art={ART.waves} artOpacity={0.4} artPosition="bottom" fade={false} className="py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHead align="left" className="" step={STEP.insights}
                eyebrow={t('insights_section.eyebrow')}
                title={text(pick('insights_section.title'), t, 'insights_section.title')}
                subtitle={text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')} />
              <Link to="/insights"
                className="inline-flex shrink-0 items-center gap-2 pb-1 text-[15px] font-semibold text-amber-300 underline-offset-4 hover:underline">
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {insights.map((ins) => {
                const color     = sdgColorById[ins.sdg] || '#FBBF24';
                const series    = Array.isArray(ins.series) ? ins.series : [];
                const direction = readDirection(series, ins.trend);
                const start     = ins.series_start;
                const end       = start && series.length ? start + series.length - 1 : null;

                return (
                  <SpotlightCard key={ins.id} as="article" glow={`${color}2E`}
                    className={`${CARD} flex flex-col p-6 hover:ring-amber-300/45`}>
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="h-3 w-3 rounded-[3px]"
                        style={{ backgroundColor: color, boxShadow: `0 0 12px 0 ${color}` }} />
                      <span className="font-mono text-xs tabular-nums text-white/50">
                        SDG {String(ins.sdg).padStart(2, '0')}
                      </span>
                      {ins.category && (
                        <span className="ml-auto rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-white/70 ring-1 ring-white/10">
                          {ins.category}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-5 text-[17px] font-semibold leading-snug text-white">{ins.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/70">{ins.text}</p>
                    <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                      <div>
                        {ins.trend && (
                          <p className={`text-2xl font-bold tabular-nums ${
                            direction === 'down' ? 'text-rose-400' : direction === 'up' ? 'text-amber-300' : 'text-white/80'
                          }`}>{ins.trend}</p>
                        )}
                        {start && end && (
                          <p className="font-mono text-xs tabular-nums text-white/50">{start}–{end}</p>
                        )}
                      </div>
                      {series.length > 1 && <Sparkline values={series} direction={direction} className="h-12 w-28" />}
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ 7 · SUMBER DATA — seksi baru ═══════════════════════════════ */}
      <AmbientSection surfaceColor={STEP.sources.bg} {...artFor(STEP.sources)}
        art={ART.world} artOpacity={0.16} className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead step={STEP.sources}
            eyebrow={t('sources_section.eyebrow')}
            title={t('sources_section.title')}
            subtitle={t('sources_section.subtitle')} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {DATA_SOURCES.map((name) => (
              <SpotlightCard key={name} as="span" tone="light" accent="orange" radius={150}
                className={`${PANEL} px-5 py-3 text-[15px] font-semibold text-slate-800 hover:ring-orange-300`}>
                {name}
              </SpotlightCard>
            ))}
          </div>
        </div>
      </AmbientSection>

      {/* ══ 8 · UNTUK SIAPA — seksi baru ═══════════════════════════════ */}
      <AmbientSection surfaceColor={STEP.audience.bg} {...artFor(STEP.audience)}
        art={ART.about} artOpacity={0.18} className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead step={STEP.audience}
            eyebrow={t('audience_section.eyebrow')}
            title={t('audience_section.title')}
            subtitle={t('audience_section.subtitle')} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {audience.map((a, i) => (
              <SpotlightCard key={i} tone="light" accent="orange"
                className={`${PANEL} p-6 hover:ring-orange-300`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                  <a.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{a.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{a.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </AmbientSection>

      {/* ══ 9 · MITRA ══════════════════════════════════════════════════ */}
      {partners.length > 0 && (
        <AmbientSection surfaceColor={STEP.partners.bg} {...artFor(STEP.partners)}
          art={ART.network} artOpacity={0.14} artPosition="top" className="py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead step={STEP.partners}
              eyebrow={t('partners_section.eyebrow')}
              title={text(pick('partners_section.title'), t, 'partners_section.title')}
              subtitle={text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')} />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((p) => (
                <SpotlightCard key={p.id ?? p.name} as="span" tone="light" accent="orange" radius={150}
                  className={`${PANEL} px-5 py-3 text-[15px] font-medium text-slate-700 hover:ring-orange-300`}>
                  {p.name}
                </SpotlightCard>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/partners"
                className="inline-flex items-center gap-1 text-[15px] font-semibold text-orange-700 underline-offset-4 hover:underline">
                {text(pick('partners_section.cta_label'), t, 'partners_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ 10 · PENUTUP — putih, artwork diberi ruang sendiri ═════════ */}
      <section className="relative bg-white py-24">
        <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[15px] font-semibold text-orange-800 ring-1 ring-orange-200">
            {text(pick('cta_section.badge'), t, 'cta_section.badge')}
          </span>

          <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-700">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          {/*
            Artwork penutup berdiri di jalurnya sendiri, di bawah teks dan di
            atas tombol, bukan sebagai lapisan di belakang keduanya. Aset dari
            /assets ditampilkan apa adanya di ruang kosong, sehingga gambarnya
            terbaca utuh tanpa tertimpa warna seksi maupun SVG lain.
          */}
          <img src={ART.world} alt="" aria-hidden
            className="mx-auto my-14 h-40 w-full max-w-3xl object-contain opacity-25 sm:h-52" />

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700">
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-800 ring-1 ring-slate-300 transition-colors hover:bg-slate-50">
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[15px] text-slate-700">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-600" strokeWidth={3} />
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