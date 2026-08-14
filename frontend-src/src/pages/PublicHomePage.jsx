import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, ArrowRight, CheckCircle, ChevronRight,
  FlaskConical, Brain, Handshake, Check, Code2,
} from 'lucide-react';
import SectionBackdrop from '../components/shared/SectionBackdrop';
import HeroWorld from '../components/shared/HeroWorld';
import '../styles/homepage.css';

// =====================================================================
// BERANDA PUBLIK
//
// Gaya halaman ini hidup di styles/homepage.css sebagai kelas bernama —
// sc-hero__title, sc-card, sc-band_dark — bukan rentetan utility di dalam
// atribut class. Markup di berkas ini karena itu menyebut peran tiap
// elemen, dan nilai desainnya terkumpul di satu tempat.
//
// Susunan warnanya: dasar putih, berselang dengan abu-hangat sangat muda
// untuk memisahkan seksi, dan tiga pita gelap sebagai tanda baca. Satu
// warna aksen untuk tombol, angka, dan ikon.
// =====================================================================

/* Ilustrasi di dalam seksi — memakai aset yang sudah tersedia di aplikasi. */
const SHOT = {
  explore:   '/assets/img/capturing-users.svg',
  analytics: '/assets/img/ai-infrastructure.png',
  directory: '/assets/img/Hero-Illustrated.png',
  collab:    '/assets/img/globalmap.png',
  footer:    '/assets/img/cta.jpg',
};

const FEATURE_ICONS = [FlaskConical, Search, BarChart2, Users, Brain, Handshake];
const STEP_ICONS    = [Search, Brain, BarChart2];

const PATTERNS = {
  orcid:        /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i,
  researcherid: /^[A-Z]{1,3}-\d{4}-\d{4}$/i,
  doi:          /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
  numeric:      /^\d{4,12}$/,
};

const text = (override, t, key, options) => override ?? t(key, options);

/* ── Seksi dua kolom ───────────────────────────────────────────────────
   Teks di satu sisi, ilustrasi di sisi lain, berganti arah tiap seksi.

   `wide` untuk aset melintang. Aset 2:1 di dalam sel grid selebar 512px
   hanya setinggi 241px — sekecil apa pun perlakuannya diperbaiki. Jadi ia
   dikeluarkan dari grid dan berdiri langsung di dalam seksi: tingginya
   mengikuti tinggi seksi, lebarnya mengikuti rasio, dan ia melintas ke
   wilayah teks. Yang meredam pertemuannya dengan huruf hanya halo di
   sekeliling glif, bukan penyempitan gambarnya. */
const SplitSection = ({
  eyebrow, title, body, points = [], image, imageAlt = '', tint, wide = false,
  reverse = false, primary, secondary, surface = 'sc-surface_plain', haloAlt = false, backdrop,
}) => {
  const halo = wide ? `sc-halo${haloAlt ? ' sc-halo_alt' : ''}` : '';

  return (
    <section className={`sc-section ${surface}`}>
      {backdrop}

      {wide && (
        <div aria-hidden className={`sc-bleed ${reverse ? 'sc-bleed_left' : 'sc-bleed_right'}`}>
          {tint
            ? <span className="sc-bleed__tint" />
            : <img src={image} alt="" loading="lazy" className="sc-bleed__img" />}
        </div>
      )}

      <div className="sc-shell sc-stack">
        <div className={wide ? '' : `sc-split${reverse ? ' sc-split_flip' : ''}`}>

          {/* Halo dipasang pada blok teksnya, bukan pada pembungkusnya:
              kalau di pembungkus, label tombol ikut berhalo dan tulisannya
              terlihat berkabut. */}
          <div className={wide
            ? `sc-split__text_wide${reverse ? ' sc-split__text_end' : ''}`
            : ''}>
            <p className={`sc-eyebrow ${halo}`}>{eyebrow}</p>
            <h2 className={`sc-split__title ${halo}`}>{title}</h2>
            <p className={`sc-split__body ${halo}`}>{body}</p>

            {points.length > 0 && (
              <ul className={`sc-points ${halo}`}>
                {points.map((pt, i) => (
                  <li key={i} className="sc-points__item">
                    <span className="sc-points__mark">
                      <Check className="sc-icon_sm" strokeWidth={3.5} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            )}

            <div className="sc-actions">
              {primary && (
                <Link to={primary.to} className="sc-btn sc-btn_primary">
                  {primary.label}
                  <ArrowRight className="sc-icon" />
                </Link>
              )}
              {secondary && (
                <Link to={secondary.to} className="sc-btn sc-btn_ghost">
                  {secondary.label}
                  <ChevronRight className="sc-icon" />
                </Link>
              )}
            </div>
          </div>

          {/* Untuk aset melintang, sel ini hanya melayani layar sempit; di
              layar lebar gambarnya sudah berdiri di dalam seksi. */}
          <div className={`sc-figure${wide ? ' sc-figure_narrowOnly' : ''}`}>
            {tint
              ? <span role="img" aria-label={imageAlt} className="sc-figure__tint" />
              : <img src={image} alt={imageAlt} loading="lazy"
                  className="sc-figure__img sc-figure__img_soft" />}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Pencarian identitas peneliti ─────────────────────────────────── */
const PublicSearch = () => {
  const [q, setQ] = useState('');
  const [ambiguousId, setAmbiguousId] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation('homepage');

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
    <div className="sc-search">
      <form onSubmit={submit} className="sc-search__form">
        <div className="sc-search__field">
          <Search className="sc-search__icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="sc-search__input"
          />
        </div>
        <button type="submit" className="sc-btn sc-btn_dark sc-btn_lg">
          {t('search.submit')}
        </button>
      </form>

      {err && <p className="sc-search__error">{err}</p>}

      {ambiguousId && (
        <div className="sc-choice">
          <p className="sc-choice__q">{t('search.ambiguous', { id: ambiguousId })}</p>
          <div className="sc-choice__row">
            <button type="button" className="sc-choice__btn"
              onClick={() => go(`/scopus/${ambiguousId}`)}>Scopus</button>
            <button type="button" className="sc-choice__btn"
              onClick={() => go(`/sinta/${ambiguousId}`)}>SINTA</button>
            <button type="button" className="sc-choice__btn sc-choice__btn_plain"
              onClick={() => setAmbiguousId(null)}>{t('search.cancel')}</button>
          </div>
        </div>
      )}

      <p className="sc-search__note">{t('search.no_login')}</p>
    </div>
  );
};

/* ── Kepala seksi ─────────────────────────────────────────────────── */
const SectionHead = ({ title, subtitle, onDark = false }) => (
  <div className={`sc-head${onDark ? ' sc-head_light' : ''}`}>
    <h2 className="sc-head__title">{title}</h2>
    {subtitle && <p className="sc-head__sub">{subtitle}</p>}
  </div>
);

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
    Icon, step: i + 1,
    title: stepTexts?.[i]?.title ?? '',
    desc:  stepTexts?.[i]?.desc  ?? '',
  }));

  const trustSignals = Array.isArray(pick('cta_section.trust_signals'))
    ? pick('cta_section.trust_signals') : t('cta_section.trust_signals', { returnObjects: true });

  return (
    <main className="sc-page">

      {/* ══ HERO ═════════════════════════════════════════════════════ */}
      <section className="sc-hero">
        {/* Peta direntang ke seluruh bidang seksi: tingginya tinggi seksi,
            lebarnya mengikuti rasio berkasnya, diratakan ke tepi kanan. */}
        <div aria-hidden className="sc-hero__art">
          <HeroWorld />
        </div>

        <div className="sc-shell sc-hero__inner">
          <div className="sc-hero__col">
            <span className="sc-pill">{text(pick('hero.badge'), t, 'hero.badge')}</span>

            <h1 className="sc-hero__title sc-halo">
              {text(pick('hero.title_1'), t, 'hero.title_1')}{' '}
              <em>{text(pick('hero.title_2'), t, 'hero.title_2')}</em>
            </h1>

            <p className="sc-hero__lede sc-halo">
              {text(pick('hero.subtitle'), t, 'hero.subtitle')}
            </p>

            <PublicSearch />

            <div className="sc-actions">
              <Link to="/register" className="sc-btn sc-btn_primary sc-btn_lg">
                {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
                <ArrowRight className="sc-icon" />
              </Link>
              <Link to="/login" className="sc-btn sc-btn_ghost sc-btn_lg">
                {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
              </Link>
            </div>

            <p className="sc-hero__hint sc-halo">
              {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}{' '}
              <Link to="/tutorial-orcid">
                {text(pick('hero.orcid_hint_link'), t, 'hero.orcid_hint_link')}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══ KEMAMPUAN ════════════════════════════════════════════════ */}
      <section className="sc-section sc-surface_plain">
        <SectionBackdrop art="net" hole={76} tone="accent" strength="medium" motion="drift" />
        <div className="sc-shell sc-stack">
          <SectionHead
            title={text(pick('features_section.title'), t, 'features_section.title')}
            subtitle={text(pick('features_section.subtitle'), t, 'features_section.subtitle')} />
          <div className="sc-grid sc-grid_3">
            {features.map((f, i) => (
              <div key={i} className="sc-card">
                <span className="sc-card__badge"><f.Icon className="sc-icon_lg" /></span>
                <h3 className="sc-card__title">{f.title}</h3>
                <p className="sc-card__text">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ANGKA PLATFORM — pita gelap pertama ══════════════════════ */}
      {stats.length > 0 && (
        <section className="sc-section sc-section_flush sc-surface_dark">
          <SectionBackdrop art="globe" hole={70} tone="sand" strength="strong" motion="breathe" />
          <div className="sc-shell sc-stack sc-section_band">
            <dl className="sc-stats">
              {stats.map((s, i) => (
                <div key={i}>
                  <dd className="sc-stats__value">{s.value}</dd>
                  <dt className="sc-stats__label">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ══ 17 SDG ═══════════════════════════════════════════════════ */}
      {sdgList.length > 0 && (
        <section className="sc-section sc-surface_alt sc-rule_y">
          <SectionBackdrop art="grid" hole={80} tone="deep" strength="soft" motion="drift" />
          <div className="sc-shell sc-stack">
            <SectionHead
              title={text(pick('sdg_section.title'), t, 'sdg_section.title')}
              subtitle={text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')} />

            <div className="sc-sdg">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="sc-sdg__item">
                  <span className="sc-sdg__tile" style={{ backgroundColor: sdg.color }}>
                    <img src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`} alt={`SDG ${sdg.sdg}`}
                      className="sc-sdg__glyph" width="56" height="56" />
                  </span>
                  <span className="sc-sdg__name">{sdg.name}</span>
                </Link>
              ))}
            </div>

            <div className="sc-actions sc-actions_center">
              <Link to="/sdgs" className="sc-btn sc-btn_ghost">
                {text(pick('sdg_section.cta_label'), t, 'sdg_section.cta_label')}
                <ChevronRight className="sc-icon" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ ALUR KERJA ═══════════════════════════════════════════════ */}
      <section className="sc-section sc-surface_plain">
        <SectionBackdrop art="flow" hole={78} tone="accent" strength="medium" motion="pan" />
        <div className="sc-shell sc-stack">
          <SectionHead
            title={text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            subtitle={text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')} />

          <ol className="sc-grid sc-grid_3">
            {steps.map((item) => (
              <li key={item.step} className="sc-card">
                <div className="sc-step__head">
                  <span className="sc-step__no">{item.step}</span>
                  <item.Icon className="sc-icon_lg" />
                </div>
                <h3 className="sc-card__title">{item.title}</h3>
                <p className="sc-card__text">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ AI INSIGHTS — pita gelap kedua ═══════════════════════════ */}
      {insights.length > 0 && (
        <section className="sc-section sc-surface_dark sc-on-dark">
          <SectionBackdrop art="waves" hole={72} tone="amber" strength="strong" motion="pan"
            interactive lit="amber" />
          <div className="sc-shell sc-stack">
            <div className="sc-head sc-head_light">
              <h2 className="sc-head__title">
                {text(pick('insights_section.title'), t, 'insights_section.title')}
              </h2>
              <p className="sc-head__sub">
                {text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')}
              </p>
            </div>

            <div className="sc-grid sc-grid_3">
              {insights.map((ins) => (
                <Link key={ins.id} to="/insights" className="sc-insight">
                  <div className="sc-insight__meta">
                    <span aria-hidden className="sc-insight__chip"
                      style={{ backgroundColor: sdgColorById[ins.sdg] || '#FB923C' }} />
                    <span className="sc-insight__sdg">
                      SDG {String(ins.sdg).padStart(2, '0')}
                    </span>
                    {ins.trend && <span className="sc-insight__trend">{ins.trend}</span>}
                  </div>
                  <h3 className="sc-insight__title">{ins.title}</h3>
                  <p className="sc-insight__text">{ins.text}</p>
                  {/* Ajakan baca hanya muncul saat kartunya disentuh — tidak
                      mengambil ruang saat diam, tapi memberi tahu bahwa
                      kartunya memang bisa diklik. */}
                  <span className="sc-insight__more">
                    {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                    <ArrowRight className="sc-icon" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="sc-actions sc-actions_center">
              <Link to="/insights" className="sc-link sc-link_accent">
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="sc-icon" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ PENELUSURAN ═════════════════════════════════════════════ */}
      <SplitSection
        eyebrow={t('sections.explore.eyebrow')}
        title={t('sections.explore.title')}
        body={t('sections.explore.body')}
        points={t('sections.explore.points', { returnObjects: true })}
        image={SHOT.explore}
        backdrop={<SectionBackdrop art="net" hole={86} tone="accent" strength="faint" motion="drift" />}
        primary={{ to: '/researchers', label: t('sections.explore.cta') }}
        secondary={{ to: '/articles',  label: t('sections.explore.cta2') }} />

      {/* ══ ANALITIK ════════════════════════════════════════════════ */}
      <SplitSection reverse
        eyebrow={t('sections.analytics.eyebrow')}
        title={t('sections.analytics.title')}
        body={t('sections.analytics.body')}
        points={t('sections.analytics.points', { returnObjects: true })}
        image={SHOT.analytics}
        surface="sc-surface_alt sc-rule_y"
        backdrop={<SectionBackdrop art="waves" hole={86} tone="deep" strength="faint" motion="pan" />}
        primary={{ to: '/analytics',       label: t('sections.analytics.cta') }}
        secondary={{ to: '/trends-analysis', label: t('sections.analytics.cta2') }} />

      {/* ══ DIREKTORI ═══════════════════════════════════════════════ */}
      <SplitSection wide
        eyebrow={t('sections.directory.eyebrow')}
        title={t('sections.directory.title')}
        body={t('sections.directory.body')}
        points={t('sections.directory.points', { returnObjects: true })}
        image={SHOT.directory}
        backdrop={<SectionBackdrop art="globe" hole={86} tone="accent" strength="faint" motion="breathe" />}
        primary={{ to: '/journals',     label: t('sections.directory.cta') }}
        secondary={{ to: '/institutions', label: t('sections.directory.cta2') }} />

      {/* ══ KOLABORASI ══════════════════════════════════════════════ */}
      <SplitSection reverse wide tint haloAlt
        eyebrow={t('sections.collab.eyebrow')}
        title={t('sections.collab.title')}
        body={t('sections.collab.body')}
        points={t('sections.collab.points', { returnObjects: true })}
        image={SHOT.collab}
        surface="sc-surface_alt sc-rule_y"
        backdrop={<SectionBackdrop art="flow" hole={86} tone="deep" strength="faint" motion="drift" />}
        primary={{ to: '/research-matching',      label: t('sections.collab.cta') }}
        secondary={{ to: '/innovation-marketplace', label: t('sections.collab.cta2') }} />

      {/* ══ API — pita gelap ketiga ═════════════════════════════════ */}
      <section className="sc-section sc-section_band sc-surface_dark">
        <SectionBackdrop art="grid" hole={70} tone="ember" strength="solid" motion="pan" interactive />
        <div className="sc-shell sc-stack sc-api">
          <div className="sc-api__lead">
            <span className="sc-api__mark"><Code2 className="sc-icon_lg" /></span>
            <div>
              <p className="sc-api__eyebrow">{t('sections.api.eyebrow')}</p>
              <h2 className="sc-api__title">{t('sections.api.title')}</h2>
              <p className="sc-api__text">{t('sections.api.body')}</p>
            </div>
          </div>
          <Link to="/docs/api-reference" className="sc-btn sc-btn_onDark">
            {t('sections.api.cta')}
            <ArrowRight className="sc-icon" />
          </Link>
        </div>
      </section>

      {/* ══ MITRA ════════════════════════════════════════════════════ */}
      {partners.length > 0 && (
        <section className="sc-section sc-section_band sc-surface_alt sc-rule_y">
          <SectionBackdrop art="net" hole={78} tone="deep" strength="soft" motion="breathe" />
          <div className="sc-shell sc-stack">
            <SectionHead
              title={text(pick('partners_section.title'), t, 'partners_section.title')}
              subtitle={text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')} />
            <div className="sc-partners">
              {partners.map((p) => (
                <span key={p.id ?? p.name} className="sc-partners__item">{p.name}</span>
              ))}
            </div>
            <div className="sc-actions sc-actions_center">
              <Link to="/partners" className="sc-link">
                {text(pick('partners_section.cta_label'), t, 'partners_section.cta_label')}
                <ChevronRight className="sc-icon" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ PENUTUP ══════════════════════════════════════════════════ */}
      <section className="sc-section sc-surface_plain">
        <SectionBackdrop art="about" hole={76} tone="accent" strength="medium" motion="drift" />
        <div className="sc-shell sc-stack sc-closing">
          <span className="sc-pill">{text(pick('cta_section.badge'), t, 'cta_section.badge')}</span>

          <h2 className="sc-closing__title">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="sc-closing__sub">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          <div className="sc-actions sc-actions_center">
            <Link to="/register" className="sc-btn sc-btn_primary sc-btn_lg">
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="sc-icon" />
            </Link>
            <Link to="/login" className="sc-btn sc-btn_ghost sc-btn_lg">
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="sc-trust">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="sc-trust__item">
                <CheckCircle className="sc-icon" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pita gambar antara seksi terakhir dan footer: bukan bagian dari
          seksi mana pun, hanya jeda visual. Tingginya mengikuti rasio
          berkasnya sendiri, jadi tidak ada yang terpotong. */}
      <div aria-hidden className="sc-outro">
        <img src={SHOT.footer} alt="" loading="lazy" className="sc-outro__img" />
      </div>

    </main>
  );
};

export default PublicHomePage;
