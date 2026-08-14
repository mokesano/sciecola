import React, { useEffect, useRef, useState } from 'react';

/**
 * Peta dunia untuk hero, dengan denyut berkeliling di negara peneliti.
 *
 * Soal gaya: seluruh tampilan komponen ini ditulis sebagai kelas Tailwind —
 * termasuk mask, promosi lapisan, warna isian negara, dan bentuk titiknya.
 * Yang tersisa sebagai nilai dari JavaScript hanyalah tiga hal yang memang
 * tidak bisa jadi nama kelas, karena baru diketahui saat halaman berjalan:
 *
 *   1. letak tiap negara — hasil pengukuran berkasnya sendiri;
 *   2. posisi sorot yang berkeliling — berubah tiap frame;
 *   3. posisi sorotan kursor — berubah tiap frame.
 *
 * Ketiganya dioper lewat custom property, dan yang membacanya tetap kelas
 * Tailwind. Jadi tidak ada aturan tampilan yang disuntikkan ke DOM; yang
 * lewat DOM hanya angka.
 *
 * Petanya sendiri disisipkan sebagai SVG sebenarnya, bukan lewat <img>.
 * Alasannya bukan selera: tiap negara di berkas itu adalah <path> ber-nama,
 * dan posisinya perlu dibaca untuk menaruh denyut tepat di atasnya. Lewat
 * <img>, isi berkas tidak terjangkau sama sekali.
 */

const SRC = '/assets/img/world.svg';
const ENDPOINT = '/api/researcher_distribution.php?groupBy=country';

const SPOT = 230;      // jari-jari sorotan kursor, dalam piksel
const MIN_SPAN = 7;    // wilayah lebih kecil dari ini tidak diberi titik latar

/* Nama negara di berkas peta dan di basis data disederhanakan ke bentuk yang
   sama sebelum dibandingkan. */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

/* Nama yang lazim berbeda antara keduanya. Tabel ini dipakai pada kedua sisi,
   jadi selama keduanya menuju bentuk yang sama, cocok. */
const ALIAS = {
  'united-states': 'united-states-of-america',
  'usa': 'united-states-of-america',
  'us': 'united-states-of-america',
  'uk': 'united-kingdom',
  'great-britain': 'united-kingdom',
  'south-korea': 'republic-of-korea',
  'korea-south': 'republic-of-korea',
  'north-korea': 'dem-rep-korea',
  'russia': 'russian-federation',
  'vietnam': 'viet-nam',
  'laos': 'lao-pdr',
  'syria': 'syrian-arab-republic',
  'iran': 'iran-islamic-republic-of',
  'tanzania': 'united-republic-of-tanzania',
  'venezuela': 'venezuela-bolivarian-republic-of',
  'bolivia': 'bolivia-plurinational-state-of',
  'moldova': 'republic-of-moldova',
  'czech-republic': 'czechia',
  'ivory-coast': 'cote-d-ivoire',
  'cape-verde': 'cabo-verde',
  'swaziland': 'eswatini',
  'burma': 'myanmar',
};

const canon = (s) => { const k = slug(s); return ALIAS[k] ?? k; };

/*
 * Titik yang benar-benar berada di dalam wilayah negaranya.
 *
 * Pusat kotak pembatas tidak cukup. Negara berbentuk bulan sabit, negara yang
 * membungkus teluk, dan negara yang punya wilayah seberang laut — pusat
 * kotaknya jatuh di laut, dan denyutnya ikut mendarat di laut. Jadi pusat
 * kotak hanya dipakai bila memang berada di dalam isian; kalau tidak, kotaknya
 * dipindai dan diambil titik dalam-isian yang paling dekat ke pusat.
 */
const insidePoint = (path) => {
  const b = path.getBBox();
  if (!b.width || !b.height) return null;

  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const test = (x, y) => {
    try { return path.isPointInFill(new DOMPoint(x, y)); } catch { return false; }
  };

  if (typeof path.isPointInFill !== 'function' || test(cx, cy)) return { x: cx, y: cy };

  const N = 9;
  let best = null;
  let bestD = Infinity;
  for (let i = 1; i < N; i += 1) {
    for (let j = 1; j < N; j += 1) {
      const x = b.x + (b.width  * i) / N;
      const y = b.y + (b.height * j) / N;
      if (!test(x, y)) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best ?? { x: cx, y: cy };
};

/* Pelandaian di kedua ujung: berangkat pelan, cepat di tengah, melambat
   sebelum berhenti — itu yang membuat perpindahannya terbaca sebagai
   luncuran, bukan lompatan. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

/* ── Kelas ────────────────────────────────────────────────────────────────
   Dikumpulkan di sini supaya baris JSX-nya tetap terbaca. Semuanya kelas
   Tailwind biasa, termasuk yang memakai nilai sembarang. */

const MAP =
  'absolute inset-0 transform-gpu will-change-transform ' +
  // peta didorong ke lapisan compositor sendiri; tanpa itu sorotan kursor
  // yang bergerak memaksa ratusan path diraster ulang tiap frame
  '[&_svg]:block [&_svg]:h-full [&_svg]:w-full ' +
  '[&_path]:fill-[#FBE3D2] [&_path]:stroke-[#EFC4A4] [&_path]:[stroke-width:0.4] ' +
  '[&_path]:[vector-effect:non-scaling-stroke]';

/* Titik negara peneliti, dan titik latar untuk negara lain. Titik negara
   peneliti dibuat cukup besar untuk terbaca dari jarak baca biasa — ia
   penanda data, bukan hiasan; titik latar setingkat lebih kecil supaya
   keduanya tetap bisa dibedakan sekilas. */
const DOT      = 'absolute -ml-[7px] -mt-[7px] h-[14px] w-[14px] rounded-full';
const DOT_TINY = 'absolute -ml-[4px] -mt-[4px] h-2 w-2 rounded-full';
const RING     = 'absolute inset-0 rounded-full border-2';

/* Sorotan kursor: kotak seukuran sorotan dengan mask diam, digeser transform.
   Isinya digeser balik dengan transform kebalikannya, jadi titik tetap berada
   di koordinat petanya. Keduanya ditangani compositor — mask yang berpindah
   tiap frame akan memaksa seluruh lapisan dicat ulang. */
const SPOT_BOX =
  'absolute left-0 top-0 h-[460px] w-[460px] will-change-transform ' +
  '[transform:translate3d(calc(var(--gx,-9999px)-230px),calc(var(--gy,-9999px)-230px),0)] ' +
  '[mask-image:radial-gradient(circle_at_center,#000_0%,rgba(0,0,0,0.55)_54%,transparent_78%)] ' +
  '[-webkit-mask-image:radial-gradient(circle_at_center,#000_0%,rgba(0,0,0,0.55)_54%,transparent_78%)]';

const SPOT_INNER =
  'absolute left-0 top-0 h-[var(--sc-h,100%)] w-[var(--sc-w,100%)] will-change-transform ' +
  '[transform:translate3d(calc(230px-var(--gx,-9999px)),calc(230px-var(--gy,-9999px)),0)]';

const HeroWorld = () => {
  const hostRef = useRef(null);
  const mapRef  = useRef(null);
  const roamRef = useRef(null);

  const targetRef = useRef({ x: -9999, y: -9999 });
  const posRef    = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(0);
  const sizeRef   = useRef({ w: 0, h: 0 });

  const [markers, setMarkers] = useState([]);
  const countriesRef = useRef(new Set());
  const idleRef      = useRef([]);
  const idleWrapRef  = useRef(null);

  /* ── Peta ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    fetch(SRC)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((svg) => {
        if (!alive || !mapRef.current) return;
        mapRef.current.innerHTML = svg;
        const el = mapRef.current.querySelector('svg');
        if (el) {
          el.removeAttribute('width');
          el.removeAttribute('height');
          el.removeAttribute('class');
          el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        measure();
      })
      .catch(() => { /* peta gagal dimuat: hero tetap tampil tanpa latar */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Negara peneliti ───────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!alive) return;
        const rows = Array.isArray(j?.data) ? j.data : [];
        countriesRef.current = new Set(
          rows.filter((r) => Number(r.researchers) > 0).map((r) => canon(r.name)),
        );
        measure();
      })
      .catch(() => { /* tanpa data, tidak ada negara yang ditandai */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Posisi diambil dalam koordinat gambar, lalu dipetakan ke layar lewat
   * getScreenCTM() — koordinat lokal saja akan meleset kalau berkasnya
   * memakai transform. Hasilnya disimpan sebagai persen terhadap kotak SVG,
   * jadi tetap menempel di negaranya berapa pun lebar lapisan petanya.
   */
  const measure = () => {
    const svg = mapRef.current?.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;

    const host = hostRef.current;
    if (host) {
      sizeRef.current = { w: box.width, h: box.height };
      host.style.setProperty('--sc-w', `${box.width}px`);
      host.style.setProperty('--sc-h', `${box.height}px`);
    }

    const seen = new Set();
    const next = [];
    svg.querySelectorAll('path').forEach((path) => {
      const id = canon(path.getAttribute('name') || path.id);
      if (!id || seen.has(id)) return;
      const local = insidePoint(path);
      if (!local) return;
      const m = path.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(local.x, local.y).matrixTransform(m);
      const bb = path.getBBox();
      seen.add(id);
      next.push({
        id,
        x: ((p.x - box.left) / box.width)  * 100,
        y: ((p.y - box.top)  / box.height) * 100,
        active: countriesRef.current.has(id),
        /* Berkas ini memuat 256 wilayah, banyak di antaranya pulau sebesar
           beberapa piksel. Kalau semuanya diberi titik, yang muncul di
           sekitar kursor bukan sebaran negara melainkan gumpalan. Yang
           tersaring hanya titik latar; negara yang punya peneliti selalu
           ditampilkan, sekecil apa pun wilayahnya. */
        tiny: bb.width < MIN_SPAN || bb.height < MIN_SPAN,
      });
    });

    setMarkers(next);
  };

  useEffect(() => {
    const host = mapRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Elemen titik dikumpulkan sekali setiap daftar negara berubah, supaya
     gelung rAF tidak perlu menyentuh DOM untuk mencarinya tiap frame. */
  useEffect(() => {
    const wrap = idleWrapRef.current;
    idleRef.current = wrap
      ? markers.filter((m) => !m.active && !m.tiny).map((m, i) => ({
          el: wrap.children[i], x: m.x / 100, y: m.y / 100, on: false,
        })).filter((d) => d.el)
      : [];
  }, [markers]);

  /* ── Sorot yang berkeliling ────────────────────────────────────────── */
  useEffect(() => {
    const roam = roamRef.current;
    const list = markers.filter((m) => m.active);
    if (!roam || list.length === 0) return undefined;

    const put = (x, y) => {
      roam.style.setProperty('--rx', `${x}%`);
      roam.style.setProperty('--ry', `${y}%`);
    };

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      put(list[0].x, list[0].y);
      return undefined;
    }

    let raf = 0;
    let from = list[0];
    let to   = list.length > 1 ? list[1] : list[0];
    let start = 0;
    let dur = 1;
    let phase = 'dwell';
    const DWELL = 1700;

    const pick = () => {
      if (list.length < 2) return list[0];
      let n = to;
      for (let i = 0; i < 8 && n.id === to.id; i += 1) {
        n = list[Math.floor(Math.random() * list.length)];
      }
      return n;
    };

    const tick = (now) => {
      if (!start) start = now;
      const t = now - start;

      if (phase === 'dwell') {
        if (t >= DWELL) {
          from = to;
          to = pick();
          /* Lama luncuran mengikuti jaraknya, dengan batas atas dan bawah:
             negara bertetangga tidak melesat, negara seberang benua tidak
             berjalan terlalu lama. */
          const d = Math.hypot(to.x - from.x, to.y - from.y);
          dur = Math.min(2400, Math.max(900, d * 26));
          phase = 'travel';
          start = now;
        }
      } else {
        const k = Math.min(1, t / dur);
        const e = ease(k);
        put(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
        if (k >= 1) { phase = 'dwell'; start = now; }
      }

      raf = requestAnimationFrame(tick);
    };

    put(to.x, to.y);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [markers]);

  /* ── Sorotan kursor ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    /* Denyut negara lain hanya dinyalakan saat benar-benar berada di dalam
       sorotan. Gelang yang beranimasi di balik mask tetap dibayar browser
       meski tak terlihat, dan ratusan di antaranya cukup untuk menjatuhkan
       laju frame. */
    const near = () => {
      const { w, h } = sizeRef.current;
      if (!w) return;
      const { x, y } = posRef.current;
      const r2 = SPOT * SPOT;
      for (const d of idleRef.current) {
        const dx = d.x * w - x;
        const dy = d.y * h - y;
        const on = dx * dx + dy * dy <= r2;
        if (on !== d.on) { d.on = on; d.el.classList.toggle('is-near', on); }
      }
    };

    const step = () => {
      const p = posRef.current;
      const t = targetRef.current;
      if (p.x < -9000) { p.x = t.x; p.y = t.y; }
      p.x += (t.x - p.x) * 0.18;
      p.y += (t.y - p.y) * 0.18;
      el.style.setProperty('--gx', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--gy', `${p.y.toFixed(1)}px`);
      near();
      const settled = Math.abs(t.x - p.x) < 0.4 && Math.abs(t.y - p.y) < 0.4;
      rafRef.current = settled ? 0 : requestAnimationFrame(step);
    };

    /* Kotak dibaca sekali per gerakan pointer, bukan di dalam gelung rAF. */
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      targetRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const active = markers.filter((m) => m.active);
  const rest   = markers.filter((m) => !m.active && !m.tiny);

  /* Letak tiap negara adalah hasil pengukuran, bukan nilai yang bisa ditulis
     jadi nama kelas — inilah satu-satunya tempat gaya sebaris di komponen
     ini, dan isinya memang koordinat, bukan aturan tampilan. */
  const at = (m) => ({ left: `${m.x}%`, top: `${m.y}%` });

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div ref={mapRef} className={MAP} />

      {/* Negara peneliti: titiknya tetap terlihat semua supaya sebarannya
          terbaca. Yang berdenyut hanya satu — sorot yang berkeliling. */}
      <div className="absolute inset-0">
        {active.map((m) => (
          <span key={`on-${m.id}`} style={at(m)} className={`${DOT} bg-orange-600 ring-2 ring-white/70`} />
        ))}
      </div>

      {/* Sorot yang berkeliling. Denyutnya animate-ping bawaan Tailwind. */}
      {active.length > 0 && (
        <div ref={roamRef}
          className={'absolute left-[var(--rx,-100%)] top-[var(--ry,-100%)] -ml-[10px] -mt-[10px] '
            + 'h-5 w-5 rounded-full bg-orange-600 shadow-lg shadow-orange-600/40 '
            + 'ring-[6px] ring-orange-500/25 will-change-[left,top]'}>
          {/* Dua gelang dengan jeda berbeda: yang kedua menyusul saat yang
              pertama sedang memudar, jadi denyutnya terbaca menerus. */}
          <span className="absolute -inset-2 animate-ping rounded-full border-2 border-orange-600/70" />
          <span className="absolute -inset-4 animate-ping rounded-full border-2 border-orange-500/40 [animation-delay:600ms]" />
        </div>
      )}

      {/* Titik yang sama dalam warna sorot, dan negara lain dalam warna muda.
          Keduanya hanya tampak di dalam sorotan yang mengikuti kursor. */}
      <div className={SPOT_BOX}>
        <div className={SPOT_INNER}>
          {active.map((m) => (
            <span key={`hot-${m.id}`} style={at(m)} className={`${DOT} bg-amber-500 ring-2 ring-white/70`} />
          ))}
          <div ref={idleWrapRef} className="absolute inset-0">
            {rest.map((m) => (
              <span key={`idle-${m.id}`} style={at(m)} className={`${DOT_TINY} group bg-orange-600/70`}>
                <span className={`${RING} -inset-1 border-orange-600/50 opacity-0 group-[.is-near]:animate-ping group-[.is-near]:opacity-100`} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroWorld;
