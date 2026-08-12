import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, ArrowRight, Check, ChevronRight,
  FlaskConical, Brain, Handshake,
} from 'lucide-react';
import Sparkline, { readDirection } from '../components/shared/Sparkline';
import { AmbientSection, SpotlightCard, ACCENTS, ART, CARD } from '../components/shared/Ambient';

// =====================================================================
// VISUAL CONFIG
//
// Halaman ini gelap, mengikuti rujukan ScholarAPI: bidang mendekati hitam,
// satu aksen yang dipakai dengan berani, dan tiap seksi punya latar SVG yang
// menggambarkan isinya (kisi data, jaringan simpul, kurva tren, rantai
// langkah, bola meridian) — bukan bidang polos.
//
// Ikon fitur tidak membawa warnanya sendiri. Enam keluarga warna berbeda pada
// satu grid kartu membaca sebagai dekorasi, bukan informasi.
// =====================================================================

const FEATURE_ICONS = [FlaskConical, Search, BarChart2, Users, Brain, Handshake];
const STEP_ICONS    = [Search, Brain, BarChart2];

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
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-lg bg-white/[0.06] py-3.5 pl-11 pr-3 text-base text-white ring-1 ring-white/15 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-indigo-500 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/40"
        >
          {t('search.submit')}
        </button>
      </form>

      {err && <p className="mt-3 text-[15px] text-rose-400">{err}</p>}

      {ambiguousId && (
        <div className="mt-3 rounded-lg bg-white/[0.05] p-4 text-left ring-1 ring-white/10">
          <p className="mb-2.5 text-[15px] text-slate-300">
            {t('search.ambiguous', { id: ambiguousId })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/scopus/${ambiguousId}`)}
              className="rounded-lg bg-white/10 px-3.5 py-2 text-[15px] font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/20">
              Scopus
            </button>
            <button type="button" onClick={() => go(`/sinta/${ambiguousId}`)}
              className="rounded-lg bg-white/10 px-3.5 py-2 text-[15px] font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/20">
              SINTA
            </button>
            <button type="button" onClick={() => setAmbiguousId(null)}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-slate-400 transition-colors hover:text-white">
              {t('search.cancel')}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-[15px] text-slate-500">{t('search.no_login')}</p>
    </div>
  );
};

// Helper: pilih nilai dari override DB jika ada, kalau tidak pakai fallback
// dari locale (t function). Memastikan tidak ada teks naratif ter-hardcode.
const text = (override, t, key, options) => override ?? t(key, options);

const SectionHead = ({ eyebrow, title, subtitle, align = 'center', className = 'mb-14', accent = 'blue' }) => (
  <div className={`${className} ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
    {eyebrow && (
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${ACCENTS[accent].eyebrow}`}>{eyebrow}</p>
    )}
    <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
    {subtitle && <p className="mt-4 text-base leading-relaxed text-slate-400">{subtitle}</p>}
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
          setStats(json.data.slice(0, 4).map((s) => ({ label: s.label, value: s.value })));
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

  const heroHighlights = Array.isArray(pick('hero.highlights'))
    ? pick('hero.highlights') : t('hero.highlights', { returnObjects: true });

  const featureTexts = Array.isArray(pick('features'))
    ? pick('features') : t('features', { returnObjects: true });
  const featureLabels = t('feature_labels', { returnObjects: true });
  const features = FEATURE_ICONS.map((Icon, i) => ({
    Icon,
    label: featureTexts?.[i]?.label ?? (Array.isArray(featureLabels) ? featureLabels[i] : undefined),
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
    <main className="min-h-screen bg-[#08080C] pt-20">

      {/* ══ HERO — biru, kisi data ══════════════════════════════════ */}
      <AmbientSection accent="blue" art={ART.hero} artOpacity={0.5}>
        <div className="mx-auto max-w-5xl px-6 py-28 text-center lg:px-8">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] px-4 py-1.5 text-[15px] font-medium text-slate-300 ring-1 ring-white/15">
            <span className={`h-1.5 w-1.5 rounded-full ${ACCENTS.blue.dot}`} />
            {text(pick('hero.badge'), t, 'hero.badge')}
          </span>

          <h1 className="mt-8 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {text(pick('hero.title_1'), t, 'hero.title_1')}{' '}
            <span className={ACCENTS.blue.eyebrow}>
              {text(pick('hero.title_2'), t, 'hero.title_2')}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {text(pick('hero.subtitle'), t, 'hero.subtitle')}
          </p>

          {Array.isArray(heroHighlights) && heroHighlights.length > 0 && (
            <ul className="mx-auto mt-9 grid max-w-2xl gap-x-8 gap-y-3 text-left sm:grid-cols-2">
              {heroHighlights.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-snug text-slate-300">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ACCENTS.blue.tile}`}>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          <PublicSearch t={t} />

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-[15px] font-semibold text-slate-900 transition-transform hover:-translate-y-0.5">
              {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-7 py-3 text-[15px] font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.12]">
              {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
            </Link>
          </div>

          <p className="mt-6 text-[15px] text-slate-500">
            {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}{' '}
            <Link to="/tutorial-orcid" className={`font-medium underline-offset-4 hover:underline ${ACCENTS.blue.link}`}>
              {text(pick('hero.orcid_hint_link'), t, 'hero.orcid_hint_link')}
            </Link>
          </p>
        </div>
      </AmbientSection>

      {/* ══ CAKUPAN — oranye, bola meridian ═════════════════════════ */}
      {stats.length > 0 && (
        <AmbientSection accent="orange" art={ART.coverage} artOpacity={0.45}
          className="border-y border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <p className={`text-center text-xs font-semibold uppercase tracking-[0.2em] ${ACCENTS.orange.eyebrow}`}>
              {t('stats_section.eyebrow')}
            </p>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <dd className={`text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${ACCENTS.orange.numeral}`}>
                    {s.value}
                  </dd>
                  <div aria-hidden className={`mx-auto mt-4 h-px w-10 ${ACCENTS.orange.rule}`} />
                  <dt className="mt-4 text-[15px] leading-snug text-slate-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </AmbientSection>
      )}

      {/* ══ KEMAMPUAN — oranye tua, jaringan simpul ═════════════════ */}
      <AmbientSection accent="ember" art={ART.network} artOpacity={0.4} className="py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            accent="ember"
            eyebrow={t('features_section.eyebrow')}
            title={text(pick('features_section.title'), t, 'features_section.title')}
            subtitle={text(pick('features_section.subtitle'), t, 'features_section.subtitle')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <SpotlightCard key={i} accent="ember" className={`${CARD} ${ACCENTS.ember.ring} p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${ACCENTS.ember.tile}`}>
                    <f.Icon className="h-5 w-5" />
                  </span>
                  {f.label && (
                    <span className={`rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ring-1 ring-white/10 ${ACCENTS.ember.chip}`}>
                      {f.label}
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{f.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </AmbientSection>

      {/* ══ 17 SDG — biru; ubinnya sendiri sudah berwarna resmi ═════ */}
      {sdgList.length > 0 && (
        <AmbientSection accent="blue" art={ART.hero} artOpacity={0.3} artPosition="bottom"
          className="border-y border-white/10 py-28">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              accent="blue"
              eyebrow={t('sdg_section.eyebrow')}
              title={text(pick('sdg_section.title'), t, 'sdg_section.title')}
              subtitle={text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')}
            />

            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="group flex flex-col items-center">
                  <div
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-white/40"
                    style={{ backgroundColor: sdg.color, boxShadow: `0 8px 26px -8px ${sdg.color}` }}
                  >
                    <img
                      src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`}
                      alt={`SDG ${sdg.sdg}`}
                      className="h-14 w-14 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          `<span class="text-white font-bold text-xl">${sdg.sdg}</span>`;
                      }}
                    />
                  </div>
                  <span className="mt-2.5 text-center text-xs font-medium leading-tight text-slate-500 transition-colors group-hover:text-white">
                    {sdg.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link to="/sdgs"
                className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-6 py-3 text-[15px] font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.12]">
                {text(pick('sdg_section.cta_label'), t, 'sdg_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ ALUR KERJA — oranye, rantai langkah ═════════════════════ */}
      <AmbientSection accent="orange" art={ART.flow} artOpacity={0.5} className="py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            accent="orange"
            eyebrow={t('how_it_works_section.eyebrow')}
            title={text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            subtitle={text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')}
          />

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <SpotlightCard key={item.step} as="li" accent="orange"
                className={`${CARD} ${ACCENTS.orange.ring} p-7`}>
                <div className="flex items-center gap-4">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold tabular-nums text-white ${ACCENTS.orange.step}`}>
                    {item.step}
                  </span>
                  <item.Icon className={`h-5 w-5 ${ACCENTS.orange.chip}`} />
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{item.desc}</p>
              </SpotlightCard>
            ))}
          </ol>
        </div>
      </AmbientSection>

      {/* ══ INSIGHTS — oranye tua, kurva tren ═══════════════════════ */}
      {insights.length > 0 && (
        <AmbientSection accent="ember" art={ART.waves} artOpacity={0.5} artPosition="bottom"
          fade={false} className="border-y border-white/10 py-28">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHead
                align="left" className="" accent="ember"
                eyebrow={t('insights_section.eyebrow')}
                title={text(pick('insights_section.title'), t, 'insights_section.title')}
                subtitle={text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')}
              />
              <Link to="/insights"
                className={`inline-flex shrink-0 items-center gap-2 pb-1 text-[15px] font-medium underline-offset-4 hover:underline ${ACCENTS.ember.link}`}>
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {insights.map((ins) => {
                const color     = sdgColorById[ins.sdg] || '#F87171';
                const series    = Array.isArray(ins.series) ? ins.series : [];
                const direction = readDirection(series, ins.trend);
                const start     = ins.series_start;
                const end       = start && series.length ? start + series.length - 1 : null;

                return (
                  <SpotlightCard key={ins.id} as="article" accent="ember" glow={`${color}2E`}
                    className={`${CARD} ${ACCENTS.ember.ring} flex flex-col p-6`}>
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="h-3 w-3 rounded-[3px]"
                        style={{ backgroundColor: color, boxShadow: `0 0 12px 0 ${color}` }} />
                      <span className="font-mono text-xs tabular-nums text-slate-500">
                        SDG {String(ins.sdg).padStart(2, '0')}
                      </span>
                      {ins.category && (
                        <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-white/10">
                          {ins.category}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-[17px] font-semibold leading-snug text-white">{ins.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-400">{ins.text}</p>

                    <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                      <div>
                        {ins.trend && (
                          <p className={`text-2xl font-bold tabular-nums ${
                            direction === 'down' ? 'text-rose-400'
                              : direction === 'up' ? 'text-red-300' : 'text-slate-300'
                          }`}>
                            {ins.trend}
                          </p>
                        )}
                        {start && end && (
                          <p className="font-mono text-xs tabular-nums text-slate-500">{start}–{end}</p>
                        )}
                      </div>
                      {series.length > 1 && (
                        <Sparkline values={series} direction={direction} className="h-12 w-28" />
                      )}
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ MITRA — biru ════════════════════════════════════════════ */}
      {partners.length > 0 && (
        <AmbientSection accent="blue" art={ART.network} artOpacity={0.28} artPosition="top"
          className="py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              accent="blue"
              eyebrow={t('partners_section.eyebrow')}
              title={text(pick('partners_section.title'), t, 'partners_section.title')}
              subtitle={text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')}
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((p) => (
                <SpotlightCard key={p.id ?? p.name} as="span" accent="blue" radius={160}
                  className="rounded-lg bg-white/[0.04] px-5 py-3 text-[15px] font-medium text-slate-300 ring-1 ring-white/10 transition-colors hover:text-white">
                  {p.name}
                </SpotlightCard>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/partners"
                className={`inline-flex items-center gap-1 text-[15px] font-medium underline-offset-4 hover:underline ${ACCENTS.blue.link}`}>
                {text(pick('partners_section.cta_label'), t, 'partners_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AmbientSection>
      )}

      {/* ══ PENUTUP — oranye ════════════════════════════════════════ */}
      <AmbientSection accent="orange" art={ART.coverage} artOpacity={0.4}
        className="border-t border-white/10 py-28">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-[15px] font-medium text-slate-300 ring-1 ring-white/15">
            {text(pick('cta_section.badge'), t, 'cta_section.badge')}
          </span>

          <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/register"
              className={`inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 ${ACCENTS.orange.button}`}>
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-7 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.12]">
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[15px] text-slate-400">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${ACCENTS.orange.eyebrow}`} strokeWidth={3} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </AmbientSection>

    </main>
  );
};

export default PublicHomePage;
