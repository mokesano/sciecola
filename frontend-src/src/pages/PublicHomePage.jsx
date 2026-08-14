import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search, BarChart2, Users, ArrowRight, CheckCircle, ChevronRight,
  FlaskConical, Brain, Handshake, Check, Code2,
} from 'lucide-react';
import SectionBackdrop from '../components/shared/SectionBackdrop';
import HeroGrid from '../components/shared/HeroGrid';

// =====================================================================
// SUSUNAN WARNA
//
// Mengikuti pola ketiga situs rujukan: dasarnya putih. Gradasi hanya ada di
// hero — oranye turun ke putih, dan ekor putihnya sengaja menyambung ke seksi
// kemampuan yang juga putih, supaya tidak ada sekat — lalu halaman berselang
// dengan abu sangat muda untuk memisahkan seksi, dan dua pita gelap dipakai
// sebagai tanda baca. Satu warna aksen untuk tombol, angka, dan ikon.
//
// Sapuan warna sepanjang halaman sudah dicoba dan ditarik: rujukannya tidak
// melakukan itu.
// =====================================================================

/* Hero tidak lagi memakai sapuan gradien. Seperti pada rujukan Gcore,
   bidangnya terang dan yang hidup adalah gambarnya: kisi data yang bergerak
   pelan dan menyala tepat di bawah kursor. Warna dibawa oleh judul dan
   tombol, bukan oleh latar. */

/* Latar bergambar tiap seksi. Warnanya menyesuaikan bidangnya: oranye pekat
   di atas putih, oranye muda di atas pita gelap, putih di atas hero. */
const ART = {
  grid:  '/assets/img/sections/hero-grid.svg',
  globe: '/assets/img/sections/globe.svg',
  net:   '/assets/img/sections/network.svg',
  flow:  '/assets/img/sections/flow.svg',
  waves: '/assets/img/sections/waves.svg',
  about: '/assets/img/sections/about.svg',
  world: '/assets/img/world.svg',
};

/* Ilustrasi di dalam seksi — memakai aset yang sudah tersedia di aplikasi.
   Dipasang dengan mask memudar di tepi, cara yang sama dipakai hero beranda
   pengguna untuk menyatukan gambar dengan bidang di belakangnya. */
const SHOT = {
  explore:   '/assets/img/capturing-users.svg',
  analytics: '/assets/img/ai-infrastructure.png',
  directory: '/assets/img/Hero-Illustrated.png',
  collab:    '/assets/img/globalmap.png',
  footer:    '/assets/img/cta.jpg',
};

/* Aset garis pucat dipasang sebagai mask lalu diberi warna, bukan ditampilkan
   apa adanya. Dipakai di dua tempat — sel grid untuk layar sempit dan lapisan
   lepas untuk layar lebar — jadi aturannya ditulis sekali di sini. */
const tintStyle = (src, tint) => ({
  backgroundColor:    tint.color,
  WebkitMaskImage:   `url('${src}')`,
  maskImage:         `url('${src}')`,
  WebkitMaskSize:     'contain',
  maskSize:           'contain',
  WebkitMaskRepeat:   'no-repeat',
  maskRepeat:         'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition:       'center',
});

/*
 * Peredupan untuk gambar yang melintas ke wilayah teks.
 *
 * Teks memang duduk di lapisan atas, tapi di antara baris dan di sela huruf
 * gambarnya masih menyembul dan bikin teks susah dibaca. Jadi gambarnya
 * dipudarkan habis ke arah teks: pekat di sisi tepi halaman, hilang sama
 * sekali sebelum sampai ke kolom teks.
 *
 * Peredupan tegak ikut dipasang karena tidak semua aset berlatar tembus.
 * Hero-Illustrated.png punya latar lavender pekat sampai ke tepi berkasnya;
 * tanpa peredupan tegak, lapisan ini terbaca sebagai panel yang ditempel —
 * bertepi lurus di atas dan di bawah — bukan sebagai ilustrasi yang menyatu
 * dengan bidang seksinya.
 *
 * `over` diisi saat lapisannya sudah memakai mask untuk aset bertinta;
 * peredupan lalu diiriskan dengan mask aset itu.
 */
const bleedFade = (reverse, over = null) => {
  const dir  = reverse ? 'to left' : 'to right';
  const side = `linear-gradient(${dir}, transparent 0%, rgba(0,0,0,0.18) 42%, #000 66%)`;
  const top  = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 17%, #000 35%,'
             + ' #000 65%, rgba(0,0,0,0.55) 83%, transparent 100%)';

  if (!over) {
    return {
      WebkitMaskImage:    `${side}, ${top}`,
      maskImage:          `${side}, ${top}`,
      WebkitMaskComposite: 'source-in',
      maskComposite:       'intersect',
    };
  }
  return {
    WebkitMaskImage:     `url('${over}'), ${side}, ${top}`,
    maskImage:           `url('${over}'), ${side}, ${top}`,
    WebkitMaskSize:       'contain, 100% 100%, 100% 100%',
    maskSize:             'contain, 100% 100%, 100% 100%',
    WebkitMaskRepeat:     'no-repeat, no-repeat, no-repeat',
    maskRepeat:           'no-repeat, no-repeat, no-repeat',
    WebkitMaskPosition:   'center, center, center',
    maskPosition:         'center, center, center',
    WebkitMaskComposite:  'source-in, source-in',
    maskComposite:        'intersect, intersect',
  };
};

/* Seksi dua kolom: teks di satu sisi, ilustrasi di sisi lain, berganti arah
   tiap seksi. Tidak semua seksi harus terpusat — halaman jadi berirama dan
   gambarnya punya ruang sendiri alih-alih ditumpuk di belakang teks. */
const SplitSection = ({
  eyebrow, title, body, points = [], image, imageAlt = '', tint, wide = false,
  reverse = false, primary, secondary, surface = 'bg-white', backdrop,
}) => (
  <section className={`relative overflow-hidden ${surface} py-20`}>
    {backdrop}

    {/*
      Aset melintang tidak ikut grid. Selama ia jadi sel grid, lebarnya
      dipotong kolom — dan aset 2:1 di kolom 512px hanya setinggi 241px,
      sekecil apa pun perlakuannya diperbaiki. Di sini ia berdiri langsung
      di dalam seksi: tingginya mengikuti tinggi seksi, lebarnya bebas, dan
      ia boleh melintas ke wilayah teks. Bagian yang melintas itu ditutup
      teks — teks duduk di lapisan atas, dan gambarnya sendiri sudah pudar
      habis sebelum sampai ke sana.
    */}
    {wide && (
      <div aria-hidden
        className={`pointer-events-none absolute inset-y-8 hidden w-[78%] items-center lg:flex ${
          reverse ? 'left-0 justify-start' : 'right-0 justify-end'}`}>
        {/* Kotak elemen gambar dibuat memeluk gambarnya — tinggi penuh, lebar
            mengikuti rasio — supaya sisi luarnya benar-benar menempel tepi
            halaman. Kalau kotaknya lebih lebar dari gambarnya, latar aset yang
            pekat berhenti sebelum tepi dan menyisakan garis lurus. */}
        {tint ? (
          <span className="h-full w-full"
            style={{ backgroundColor: tint.color, ...bleedFade(reverse, image) }} />
        ) : (
          <img src={image} alt="" loading="lazy"
            className="h-full w-auto max-w-none object-contain"
            style={bleedFade(reverse)} />
        )}
      </div>
    )}

    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      {/* Saat gambarnya melintang, kolom kedua tidak lagi menampung apa pun
          di layar lebar, jadi grid ditinggalkan dan teks cukup dibatasi
          lebarnya lalu didorong ke sisinya sendiri. */}
      <div className={wide
        ? ''
        : `grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>

        <div className={wide ? `relative z-10 lg:w-[47%] ${reverse ? 'lg:ml-auto' : ''}` : ''}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{eyebrow}</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600">{body}</p>

          {points.length > 0 && (
            <ul className="mt-7 space-y-3">
              {points.map((pt, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-snug text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {primary && (
              <Link to={primary.to}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700">
                {primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {secondary && (
              <Link to={secondary.to}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-[15px] font-semibold text-slate-700 transition-colors hover:border-orange-400 hover:text-orange-700">
                {secondary.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/*
          Perlakuan gambar seksi — yang dipakai seksi Analitik: gambar berdiri
          sendiri tanpa bingkai, rasionya utuh, dan tepinya dilebur mask lembut
          supaya menyatu dengan bidang di belakangnya alih-alih terpotong
          kotak.

          `tint` untuk aset garis yang warnanya nyaris putih — globalmap.png
          hanya titik abu sangat muda, jadi di atas bidang terang ia praktis
          tak terlihat. Berkasnya punya kanal alfa, jadi ia dipasang sebagai
          mask dan diberi warna aksen halaman.

          Untuk aset melintang, sel ini hanya melayani layar sempit; di layar
          lebar gambarnya sudah berdiri di dalam seksi, di luar grid.
        */}
        <div className={`relative flex items-center justify-center ${wide ? 'mt-12 lg:hidden' : ''}`}>
          {tint ? (
            <span role="img" aria-label={imageAlt}
              className="block w-full max-w-xl"
              style={{ aspectRatio: tint.ratio, ...tintStyle(image, tint) }} />
          ) : (
            <img src={image} alt={imageAlt} loading="lazy"
              className="w-full max-w-xl object-contain"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse 82% 82% at 50% 50%, #000 46%, transparent 92%)',
                maskImage:       'radial-gradient(ellipse 82% 82% at 50% 50%, #000 46%, transparent 92%)',
              }} />
          )}
        </div>
      </div>
    </div>
  </section>
);

const SURFACE = {
  white: 'bg-white',
  tint:  'bg-[#FAF7F4]',   // abu-hangat sangat muda, pemisah antar seksi
  dark:  'bg-[#1C1917]',   // pita gelap, dipakai dua kali saja
};

const FEATURE_ICONS = [FlaskConical, Search, BarChart2, Users, Brain, Handshake];
const STEP_ICONS    = [Search, Brain, BarChart2];

/* Kartu putih berbingkai — bentuk kartu yang dipakai ketiga rujukan. */
const CARD = 'rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/60';

const PATTERNS = {
  orcid:        /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i,
  researcherid: /^[A-Z]{1,3}-\d{4}-\d{4}$/i,
  doi:          /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
  numeric:      /^\d{4,12}$/,
};

const PublicSearch = () => {
  const [q, setQ] = useState('');
  const [ambiguousId, setAmbiguousId] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  /* Seluruh teks di sini datang dari berkas locale — kuncinya memang sudah
     ada di homepage.json untuk id maupun en, hanya belum dipakai. */
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
    <div className="mt-9 max-w-2xl">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-lg border border-slate-300 bg-white py-3.5 pl-11 pr-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <button type="submit"
          className="shrink-0 rounded-lg bg-slate-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800">
          {t('search.submit')}
        </button>
      </form>

      {err && <p className="mt-3 text-[15px] font-medium text-red-600">{err}</p>}

      {ambiguousId && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-lg">
          <p className="mb-2.5 text-[15px] text-slate-600">
            {t('search.ambiguous', { id: ambiguousId })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/scopus/${ambiguousId}`)}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-[15px] font-medium text-slate-700 hover:border-orange-400 hover:text-orange-700">Scopus</button>
            <button type="button" onClick={() => go(`/sinta/${ambiguousId}`)}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-[15px] font-medium text-slate-700 hover:border-orange-400 hover:text-orange-700">SINTA</button>
            <button type="button" onClick={() => setAmbiguousId(null)}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-slate-500 hover:text-slate-900">{t('search.cancel')}</button>
          </div>
        </div>
      )}

      <p className="mt-4 text-[15px] text-slate-500">
        {t('search.no_login')}
      </p>
    </div>
  );
};

const text = (override, t, key, options) => override ?? t(key, options);

/* Kepala seksi: judul tebal terpusat dengan sub-judul senyap di bawahnya —
   bentuk yang sama dipakai ketiga rujukan. */
const SectionHead = ({ title, subtitle, onDark = false }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${onDark ? 'text-white' : 'text-slate-900'}`}>
      {title}
    </h2>
    {subtitle && (
      <p className={`mt-4 text-base leading-relaxed ${onDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {subtitle}
      </p>
    )}
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
    <main className="min-h-screen bg-white pt-[60px]">

      {/* ══ HERO — satu-satunya tempat gradasi berada ═════════════════ */}
      <section className="relative overflow-hidden bg-white">
        {/* Kisi menempati paruh kanan, seperti pada rujukan Gcore. Teksnya di
            kiri, jadi sorotan kursor punya ruang penuh untuk bekerja. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <HeroGrid />
        </div>
        {/* Di layar sempit teks memenuhi lebar, jadi kisinya dipasang di
            belakang teks dengan warna jauh lebih senyap. */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <HeroGrid gap={22} line="rgba(234,88,12,0.06)" dot="rgba(234,88,12,0.16)" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 lg:px-8">
          <div className="max-w-2xl text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[15px] font-semibold text-orange-800 ring-1 ring-orange-200">
            {text(pick('hero.badge'), t, 'hero.badge')}
          </span>

          <h1 className="mt-7 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {text(pick('hero.title_1'), t, 'hero.title_1')}{' '}
            <span className="text-orange-600">{text(pick('hero.title_2'), t, 'hero.title_2')}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {text(pick('hero.subtitle'), t, 'hero.subtitle')}
          </p>

          <PublicSearch />

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700">
              {text(pick('hero.cta_secondary'), t, 'hero.cta_secondary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-7 py-3.5 text-[15px] font-semibold text-slate-700 transition-colors hover:border-orange-400 hover:text-orange-700">
              {text(pick('hero.cta_primary'), t, 'hero.cta_primary')}
            </Link>
          </div>

          <p className="mt-6 text-[15px] text-slate-600">
            {text(pick('hero.orcid_hint_prefix'), t, 'hero.orcid_hint_prefix')}{' '}
            <Link to="/tutorial-orcid" className="font-semibold text-orange-700 underline underline-offset-4 hover:text-orange-800">
              {text(pick('hero.orcid_hint_link'), t, 'hero.orcid_hint_link')}
            </Link>
          </p>
          </div>
        </div>
      </section>

      {/* ══ KEMAMPUAN — putih ════════════════════════════════════════ */}
      <section className={`relative overflow-hidden ${SURFACE.white} py-20`}>
        <SectionBackdrop src={ART.net} color="#EA580C" opacity={0.22} motion="drift" reach={76} />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            title={text(pick('features_section.title'), t, 'features_section.title')}
            subtitle={text(pick('features_section.subtitle'), t, 'features_section.subtitle')} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className={`${CARD} p-6`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <f.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ANGKA PLATFORM — pita gelap pertama ══════════════════════ */}
      {stats.length > 0 && (
        <section className={`relative overflow-hidden ${SURFACE.dark}`}>
          <SectionBackdrop src={ART.globe} color="#FDBA74" opacity={0.30} motion="breathe" reach={70} />
          <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <dd className="text-4xl font-bold tabular-nums tracking-tight text-orange-400 sm:text-5xl">
                    {s.value}
                  </dd>
                  <dt className="mt-2 text-[15px] leading-snug text-slate-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ══ 17 SDG — abu muda ════════════════════════════════════════ */}
      {sdgList.length > 0 && (
        <section className={`relative overflow-hidden ${SURFACE.tint} border-y border-slate-200 py-20`}>
          <SectionBackdrop src={ART.grid} color="#C2410C" opacity={0.18} motion="drift" reach={80} />
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              title={text(pick('sdg_section.title'), t, 'sdg_section.title')}
              subtitle={text(pick('sdg_section.subtitle'), t, 'sdg_section.subtitle')} />

            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
              {sdgList.map((sdg) => (
                <Link key={sdg.sdg} to="/sdgs" className="group flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
                    style={{ backgroundColor: sdg.color }}>
                    <img src={`/assets/sdgs/icons/sdg-${sdg.sdg}.svg`} alt={`SDG ${sdg.sdg}`}
                      className="h-14 w-14 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span className="text-white font-bold text-xl">${sdg.sdg}</span>`;
                      }} />
                  </div>
                  <span className="mt-2.5 text-center text-xs font-medium leading-tight text-slate-500 transition-colors group-hover:text-slate-900">
                    {sdg.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/sdgs"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-slate-700 transition-colors hover:border-orange-400 hover:text-orange-700">
                {text(pick('sdg_section.cta_label'), t, 'sdg_section.cta_label')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ ALUR KERJA — putih ═══════════════════════════════════════ */}
      <section className={`relative overflow-hidden ${SURFACE.white} py-20`}>
        <SectionBackdrop src={ART.flow} color="#EA580C" opacity={0.24} motion="pan" reach={78} />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <SectionHead
            title={text(pick('how_it_works_section.title'), t, 'how_it_works_section.title')}
            subtitle={text(pick('how_it_works_section.subtitle'), t, 'how_it_works_section.subtitle')} />

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step} className={`${CARD} p-7`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-base font-bold tabular-nums text-white">
                    {item.step}
                  </span>
                  <item.Icon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ AI INSIGHTS — pita gelap kedua ═══════════════════════════ */}
      {insights.length > 0 && (
        <section className={`relative overflow-hidden ${SURFACE.dark} py-20`}>
          <SectionBackdrop src={ART.waves} color="#FB923C" opacity={0.34} motion="pan" reach={72}
            interactive litColor="rgba(251,146,60,0.55)" litRadius={380} />
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {text(pick('insights_section.title'), t, 'insights_section.title')}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  {text(pick('insights_section.subtitle'), t, 'insights_section.subtitle')}
                </p>
              </div>
              <Link to="/insights"
                className="inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-orange-400 underline-offset-4 hover:underline">
                {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {insights.map((ins) => {
                const color = sdgColorById[ins.sdg] || '#FB923C';
                return (
                  <Link key={ins.id} to="/insights"
                    className="group flex flex-col rounded-xl border border-white/10 bg-[#292524] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/50 hover:bg-[#332B27] hover:shadow-xl hover:shadow-black/40">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs tabular-nums text-slate-400">
                        SDG {String(ins.sdg).padStart(2, '0')}
                      </span>
                      {ins.trend && (
                        <span className="ml-auto rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold tabular-nums text-orange-300">
                          {ins.trend}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-5 text-[17px] font-semibold leading-snug text-white transition-colors group-hover:text-orange-200">
                      {ins.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-300">{ins.text}</p>

                    {/* Ajakan baca hanya muncul saat kartunya disentuh — tidak
                        mengambil ruang saat diam, tapi memberi tahu bahwa
                        kartunya memang bisa diklik. */}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-orange-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {text(pick('insights_section.cta_label'), t, 'insights_section.cta_label')}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ PENELUSURAN — teks kiri, ilustrasi kanan ════════════════ */}
      <SplitSection
        eyebrow={t('sections.explore.eyebrow')}
        title={t('sections.explore.title')}
        body={t('sections.explore.body')}
        points={t('sections.explore.points', { returnObjects: true })}
        image={SHOT.explore}
        surface={SURFACE.white}
        backdrop={<SectionBackdrop src={ART.net} color="#EA580C" opacity={0.16} motion="drift" reach={86} />}
        primary={{ to: '/researchers', label: t('sections.explore.cta') }}
        secondary={{ to: '/articles',  label: t('sections.explore.cta2') }} />

      {/* ══ ANALITIK — ilustrasi kiri, teks kanan ═══════════════════ */}
      <SplitSection reverse
        eyebrow={t('sections.analytics.eyebrow')}
        title={t('sections.analytics.title')}
        body={t('sections.analytics.body')}
        points={t('sections.analytics.points', { returnObjects: true })}
        image={SHOT.analytics}
        surface={`${SURFACE.tint} border-y border-slate-200`}
        backdrop={<SectionBackdrop src={ART.waves} color="#C2410C" opacity={0.16} motion="pan" reach={86} />}
        primary={{ to: '/analytics',       label: t('sections.analytics.cta') }}
        secondary={{ to: '/trends-analysis', label: t('sections.analytics.cta2') }} />

      {/* ══ DIREKTORI ═══════════════════════════════════════════════ */}
      <SplitSection
        eyebrow={t('sections.directory.eyebrow')}
        title={t('sections.directory.title')}
        body={t('sections.directory.body')}
        points={t('sections.directory.points', { returnObjects: true })}
        image={SHOT.directory}
        wide
        surface={SURFACE.white}
        backdrop={<SectionBackdrop src={ART.globe} color="#EA580C" opacity={0.15} motion="breathe" reach={86} />}
        primary={{ to: '/journals',     label: t('sections.directory.cta') }}
        secondary={{ to: '/institutions', label: t('sections.directory.cta2') }} />

      {/* ══ KOLABORASI ══════════════════════════════════════════════ */}
      <SplitSection reverse
        eyebrow={t('sections.collab.eyebrow')}
        title={t('sections.collab.title')}
        body={t('sections.collab.body')}
        points={t('sections.collab.points', { returnObjects: true })}
        image={SHOT.collab}
        tint={{ color: '#EA580C', ratio: '909 / 428' }}
        wide
        surface={`${SURFACE.tint} border-y border-slate-200`}
        backdrop={<SectionBackdrop src={ART.flow} color="#C2410C" opacity={0.16} motion="drift" reach={86} />}
        primary={{ to: '/research-matching',      label: t('sections.collab.cta') }}
        secondary={{ to: '/innovation-marketplace', label: t('sections.collab.cta2') }} />

      {/* ══ API — pita gelap ketiga, latarnya menyala mengikuti kursor ═ */}
      <section className={`relative overflow-hidden ${SURFACE.dark} py-16`}>
        <SectionBackdrop src={ART.grid} color="#7C3E1D" opacity={0.85} motion="pan" reach={70}
          interactive litColor="rgba(234,88,12,0.9)" litRadius={340} />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-5">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/25 sm:flex">
              <Code2 className="h-6 w-6" />
            </span>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                {t('sections.api.eyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t('sections.api.title')}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300">{t('sections.api.body')}</p>
            </div>
          </div>
          <Link to="/docs/api-reference"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:border-orange-400/60 hover:bg-orange-500/10 hover:text-orange-200">
            {t('sections.api.cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ══ MITRA — abu muda ═════════════════════════════════════════ */}
      {partners.length > 0 && (
        <section className={`relative overflow-hidden ${SURFACE.tint} border-y border-slate-200 py-16`}>
          <SectionBackdrop src={ART.net} color="#C2410C" opacity={0.17} motion="breathe" reach={78} />
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <SectionHead
              title={text(pick('partners_section.title'), t, 'partners_section.title')}
              subtitle={text(pick('partners_section.subtitle'), t, 'partners_section.subtitle')} />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((p) => (
                <span key={p.id ?? p.name}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-[15px] font-medium text-slate-700 shadow-sm">
                  {p.name}
                </span>
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
        </section>
      )}

      {/* ══ PENUTUP — putih ══════════════════════════════════════════ */}
      <section className={`relative overflow-hidden ${SURFACE.white} py-20`}>
        <SectionBackdrop src={ART.about} color="#EA580C" opacity={0.22} motion="drift" reach={76} />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[15px] font-semibold text-orange-800 ring-1 ring-orange-200">
            {text(pick('cta_section.badge'), t, 'cta_section.badge')}
          </span>

          <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {text(pick('cta_section.title'), t, 'cta_section.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            {text(pick('cta_section.subtitle'), t, 'cta_section.subtitle')}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700">
              {text(pick('cta_section.cta_primary'), t, 'cta_section.cta_primary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-7 py-3.5 text-[15px] font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
              {text(pick('cta_section.cta_secondary'), t, 'cta_section.cta_secondary')}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[15px] text-slate-600">
            {(Array.isArray(trustSignals) ? trustSignals : []).map((label, i) => (
              <span key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/*
        Pita gambar yang berdiri di antara seksi terakhir dan footer. Ia bukan
        bagian dari seksi mana pun — tidak membawa teks, tidak membawa aksi —
        hanya jeda visual sebelum footer, memakai aset yang memang disiapkan
        untuk posisi ini.
      */}
      {/* cta.jpg berukuran 1200×314 — sebuah pita lebar. Sebelumnya ia
          dipaksa masuk kotak setinggi 288px dengan object-cover, jadi bagian
          atas dan bawahnya terpotong. Tingginya sekarang mengikuti rasio
          gambarnya sendiri, jadi tidak ada yang hilang. */}
      <div aria-hidden className="w-full overflow-hidden bg-white">
        <img src={SHOT.footer} alt="" loading="lazy"
          className="block h-auto w-full"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 100%)',
            maskImage:       'linear-gradient(to bottom, transparent 0%, #000 22%, #000 100%)',
          }} />
      </div>

    </main>
  );
};

export default PublicHomePage;
